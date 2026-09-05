import "dotenv/config";
import { z } from "zod";
import { LlmError } from "@/llm";

/**
 * Variável exportada porém vazia (`FOO=`) é tratada como ausente — mesmo padrão
 * de `llm.config.ts`.
 */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  AGENT_API_PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(8787),
  ),
  AGENT_API_HOST: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("0.0.0.0"),
  ),
  AGENT_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export interface ServerConfigValues {
  port: number;
  host: string;
  /** Se definido, requisições precisam de `Authorization: Bearer <apiKey>`. */
  apiKey: string | null;
}

/**
 * Configuração do shim HTTP. Construtor privado + `getInstance`, como o resto
 * do backend; valida o ambiente uma única vez.
 */
export class ServerConfig {
  private static instance: ServerConfig;

  public readonly values: ServerConfigValues;

  private constructor() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new LlmError(
        `Configuração do servidor inválida:\n${z.prettifyError(parsed.error)}`,
      );
    }
    this.values = {
      port: parsed.data.AGENT_API_PORT,
      host: parsed.data.AGENT_API_HOST,
      apiKey: parsed.data.AGENT_API_KEY ?? null,
    };
  }

  public static getInstance(): ServerConfig {
    if (!ServerConfig.instance) {
      ServerConfig.instance = new ServerConfig();
    }
    return ServerConfig.instance;
  }

  public get port(): number {
    return this.values.port;
  }

  public get host(): string {
    return this.values.host;
  }

  public get apiKey(): string | null {
    return this.values.apiKey;
  }
}

export const serverConfig = ServerConfig.getInstance();
