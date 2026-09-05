import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { BASE_SYSTEM_PROMPT, type ModelRequest } from "@/llm";
import { agentPool } from "./agent.pool";
import {
  buildChunk,
  buildCompletion,
  newCompletionId,
  splitSystem,
  toLangchainMessages,
} from "./chat.mapper";
import { parseModelId } from "./model-id";
import type { ChatCompletionRequest } from "./openai.types";

interface PreparedRequest {
  model: ModelRequest;
  systemPrompt: string;
  messages: ReturnType<typeof toLangchainMessages>;
}

/** Traduz o corpo OpenAI numa configuração de agente + mensagens do LangChain. */
function prepare(body: ChatCompletionRequest): PreparedRequest {
  const { provider, model } = parseModelId(body.model);
  const { system, rest } = splitSystem(body.messages ?? []);

  return {
    model: {
      provider,
      model,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
    },
    systemPrompt: system ?? BASE_SYSTEM_PROMPT.render(),
    messages: toLangchainMessages(rest),
  };
}

/** Resposta única (não-streaming). */
export async function complete(body: ChatCompletionRequest) {
  const { model, systemPrompt, messages } = prepare(body);
  const agent = await agentPool.get({ model, systemPrompt });
  const result = await agent.invoke({ messages });
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
  const { model, systemPrompt, messages } = prepare(body);
  const completionId = newCompletionId();
  const agent = await agentPool.get({ model, systemPrompt });

  return streamSSE(
    c,
    async (sse) => {
      let first = true;
      for await (const chunk of agent.stream({ messages })) {
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
