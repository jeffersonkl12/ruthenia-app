/**
 * Subconjunto do protocolo OpenAI Chat Completions que o shim precisa entender.
 * Só o que a LibreChat envia/consome — não é a especificação completa.
 */

export type ChatRole = "system" | "user" | "assistant" | "tool" | "function";

/** Parte de conteúdo multimodal (a LibreChat manda texto puro na maioria dos casos). */
export interface ChatContentPart {
  type: string;
  text?: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string | ChatContentPart[] | null;
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  /** Campos extras enviados pela LibreChat são ignorados. */
  [key: string]: unknown;
}

export interface ChatCompletionChoice {
  index: number;
  message: { role: "assistant"; content: string };
  finish_reason: "stop" | "length" | null;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: { role?: "assistant"; content?: string };
  finish_reason: "stop" | "length" | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface OpenAIErrorBody {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface ModelListResponse {
  object: "list";
  data: Array<{
    id: string;
    object: "model";
    created: number;
    owned_by: string;
  }>;
}
