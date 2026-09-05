import { randomUUID } from "node:crypto";
import type { BaseMessageLike } from "@langchain/core/messages";
import type {
  ChatCompletionChunk,
  ChatCompletionResponse,
  ChatMessage,
} from "./openai.types";

/** Achata `content` (string | partes multimodais | null) num texto simples. */
export function extractText(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("");
  }
  return "";
}

/**
 * Separa as mensagens `system` do restante. Todas as `system` são concatenadas
 * (a LibreChat normalmente manda no máximo uma).
 */
export function splitSystem(messages: ChatMessage[]): {
  system?: string;
  rest: ChatMessage[];
} {
  const systemParts: string[] = [];
  const rest: ChatMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const text = extractText(message.content).trim();
      if (text) systemParts.push(text);
    } else {
      rest.push(message);
    }
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    rest,
  };
}

/** Converte mensagens OpenAI (sem `system`) para o formato do LangChain. */
export function toLangchainMessages(
  messages: ChatMessage[],
): BaseMessageLike[] {
  return messages.map((message) => {
    const content = extractText(message.content);
    const role =
      message.role === "assistant"
        ? "assistant"
        : message.role === "tool" || message.role === "function"
          ? "assistant"
          : "user";
    return { role, content };
  });
}

const now = (): number => Math.floor(Date.now() / 1000);
const newId = (): string => `chatcmpl-${randomUUID()}`;

const ZERO_USAGE = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
} as const;

/** Resposta completa (não-streaming). */
export function buildCompletion(
  text: string,
  model: string,
): ChatCompletionResponse {
  return {
    id: newId(),
    object: "chat.completion",
    created: now(),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop",
      },
    ],
    usage: { ...ZERO_USAGE },
  };
}

/** Um chunk de streaming. `first` inclui o `role`; `done` fecha com `finish_reason`. */
export function buildChunk(
  delta: string,
  model: string,
  opts: { id: string; first?: boolean; done?: boolean } = { id: newId() },
): ChatCompletionChunk {
  return {
    id: opts.id,
    object: "chat.completion.chunk",
    created: now(),
    model,
    choices: [
      {
        index: 0,
        delta: opts.done
          ? {}
          : {
              ...(opts.first ? { role: "assistant" as const } : {}),
              content: delta,
            },
        finish_reason: opts.done ? "stop" : null,
      },
    ],
  };
}

export { newId as newCompletionId };
