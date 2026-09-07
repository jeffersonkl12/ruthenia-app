import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { systemPromptBuilder, type ModelRequest } from "@/llm";
import { promptContextService } from "@/service/prompt-context.service";
import { sessionService } from "@/service/session.service";
import {
  stateReflectionService,
  type RecentMessage,
} from "@/service/state-reflection.service";
import { agentPool } from "./agent.pool";
import {
  buildChunk,
  buildCompletion,
  extractText,
  newCompletionId,
  splitSystem,
  toLangchainMessages,
} from "./chat.mapper";
import { parseModelId } from "./model-id";
import type { ChatCompletionRequest } from "./openai.types";

/** Quantas mensagens do histórico recente vão para a reflexão pós-turno. */
const RECENT_MSG_LIMIT = 10;

interface PreparedRequest {
  model: ModelRequest;
  systemPrompt: string;
  /** Sessão ativa (única) — `undefined` enquanto não houver linha em `sessions`. */
  sessionId?: number;
  /** Últimas mensagens do jogador/mestre, para a reflexão de estado pós-turno. */
  recentMessages: RecentMessage[];
  messages: ReturnType<typeof toLangchainMessages>;
}

/**
 * Monta o system prompt do agente para esta requisição.
 *
 * A LibreChat reenvia o histórico inteiro a cada turno, então "uma
 * requisição" == "uma nova mensagem": remontamos o prompt do zero toda vez.
 * Busca o estado do mundo da sessão ativa (única — jogo single-player) via
 * {@link promptContextService.buildContext} e renderiza as camadas com o
 * {@link systemPromptBuilder}. O prompt vai por invocação (`AgentInput`), não
 * embutido no agente: o {@link AgentPool} cacheia o agente por config de
 * modelo, então remontar o prompt a cada turno não recompila nada.
 *
 * Um `system` message vindo do cliente é anexado ao final, preservando
 * instruções custom da LibreChat. Sem sessão no banco ainda → cai para o
 * prompt estático (só as camadas `static`).
 */
async function buildSystemPrompt(
  clientSystem: string | undefined,
  sessionId: number | undefined,
): Promise<string> {
  const ctx =
    sessionId != null
      ? await promptContextService.buildContext(sessionId)
      : {};

  const base = await systemPromptBuilder.build(ctx);
  return clientSystem ? `${base}\n\n${clientSystem}` : base;
}

/** Traduz o corpo OpenAI numa configuração de agente + mensagens do LangChain. */
async function prepare(body: ChatCompletionRequest): Promise<PreparedRequest> {
  const { provider, model } = parseModelId(body.model);
  const { system, rest } = splitSystem(body.messages ?? []);
  const [session] = await sessionService.findAll();

  const recentMessages: RecentMessage[] = rest
    .slice(-RECENT_MSG_LIMIT)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: extractText(message.content),
    }));

  return {
    model: {
      provider,
      model,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
    },
    systemPrompt: await buildSystemPrompt(system, session?.id),
    sessionId: session?.id,
    recentMessages,
    messages: toLangchainMessages(rest),
  };
}

/**
 * Dispara a reflexão de estado narrativo pós-turno — fire-and-forget, nunca
 * lança, não atrasa a resposta ao jogador. No-op se não há sessão ativa.
 */
function triggerStateReflection(
  sessionId: number | undefined,
  recentMessages: RecentMessage[],
  finalReply: string,
): void {
  if (sessionId == null) return;
  void stateReflectionService
    .reflectAfterTurn({ sessionId, recentMessages, finalReply })
    .catch((error: unknown) =>
      console.error("[state-reflection] hook failed", error),
    );
}

/** Resposta única (não-streaming). */
export async function complete(body: ChatCompletionRequest) {
  const { model, systemPrompt, messages, sessionId, recentMessages } =
    await prepare(body);
  const agent = await agentPool.get({ model });
  const result = await agent.invoke({ messages, systemPrompt });

  triggerStateReflection(sessionId, recentMessages, result.content);

  return buildCompletion(result.content, body.model);
}

/**
 * Resposta em streaming (SSE), no formato `chat.completion.chunk`.
 *
 * A criação do agente (que valida provedor/credencial) acontece **antes** de
 * abrir o stream: assim um erro de configuração vira um JSON 400 normal, não um
 * stream vazio. Falhas durante a geração são enviadas como um último chunk de
 * texto seguido de `[DONE]`, para ficarem visíveis na LibreChat.
 */
export async function streamChat(
  c: Context,
  body: ChatCompletionRequest,
): Promise<Response> {
  const { model, systemPrompt, messages, sessionId, recentMessages } =
    await prepare(body);
  const completionId = newCompletionId();
  const agent = await agentPool.get({ model });

  return streamSSE(
    c,
    async (sse) => {
      let first = true;
      let assistantText = "";
      for await (const chunk of agent.stream({ messages, systemPrompt })) {
        assistantText += chunk.content;
        await sse.writeSSE({
          data: JSON.stringify(
            buildChunk(chunk.content, body.model, { id: completionId, first }),
          ),
        });
        first = false;
      }

      await sse.writeSSE({
        data: JSON.stringify(
          buildChunk("", body.model, { id: completionId, done: true }),
        ),
      });
      await sse.writeSSE({ data: "[DONE]" });

      triggerStateReflection(sessionId, recentMessages, assistantText);
    },
    async (err, sse) => {
      console.error(err);
      await sse.writeSSE({
        data: JSON.stringify(
          buildChunk(`\n\n[erro: ${err.message}]`, body.model, {
            id: completionId,
          }),
        ),
      });
      await sse.writeSSE({
        data: JSON.stringify(
          buildChunk("", body.model, { id: completionId, done: true }),
        ),
      });
      await sse.writeSSE({ data: "[DONE]" });
    },
  );
}
