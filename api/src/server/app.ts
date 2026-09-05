import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AgentInvocationError,
  LlmError,
  ModelCreationError,
  ProviderNotConfiguredError,
  providerRegistry,
  UnknownProviderError,
} from "@/llm";
import { complete, streamChat } from "./chat.controller";
import type {
  ChatCompletionRequest,
  ModelListResponse,
  OpenAIErrorBody,
} from "./openai.types";
import { serverConfig } from "./server.config";

export const app = new Hono();

/** Autenticação por bearer estático — só ativa se `AGENT_API_KEY` estiver setado. */
app.use("/v1/*", async (c, next) => {
  const expected = serverConfig.apiKey;
  if (!expected) return next();

  const header = c.req.header("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";

  if (token !== expected) {
    return c.json<OpenAIErrorBody>(
      { error: { message: "Credencial inválida.", type: "invalid_request_error" } },
      401,
    );
  }
  return next();
});

app.get("/health", (c) => c.json({ status: "ok" }));

/** Catálogo de modelos (`fetch: false` na LibreChat, mas útil para inspeção via curl). */
app.get("/v1/models", (c) => {
  const created = Math.floor(Date.now() / 1000);
  const ids = new Set<string>();
  for (const provider of providerRegistry.list()) {
    ids.add(`${provider.name}/${provider.defaultModel}`);
    for (const model of provider.recommendedModels) {
      ids.add(`${provider.name}/${model}`);
    }
  }

  return c.json<ModelListResponse>({
    object: "list",
    data: [...ids].map((id) => ({
      id,
      object: "model",
      created,
      owned_by: "ruthenia",
    })),
  });
});

app.post("/v1/chat/completions", async (c) => {
  const body = await c.req.json<ChatCompletionRequest>();

  if (!body?.model || !Array.isArray(body.messages)) {
    return c.json<OpenAIErrorBody>(
      {
        error: {
          message: "Campos obrigatórios: `model` (string) e `messages` (array).",
          type: "invalid_request_error",
        },
      },
      400,
    );
  }

  if (body.stream) {
    return await streamChat(c, body);
  }

  return c.json(await complete(body));
});

/** Converte erros de domínio no envelope de erro OpenAI. */
app.onError((err, c) => {
  const [status, type]: [ContentfulStatusCode, string] =
    err instanceof UnknownProviderError || err instanceof ProviderNotConfiguredError
      ? [400, "invalid_request_error"]
      : err instanceof ModelCreationError || err instanceof AgentInvocationError
        ? [502, "upstream_error"]
        : err instanceof LlmError
          ? [500, "internal_error"]
          : [500, "internal_error"];

  if (status >= 500) console.error(err);

  return c.json<OpenAIErrorBody>(
    { error: { message: err.message, type } },
    status,
  );
});
