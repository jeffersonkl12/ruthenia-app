import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LlmError } from "@/llm/errors";

/** Pasta onde ficam os templates de system prompt em Markdown. */
export const PROMPT_TEMPLATES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "templates",
);

/**
 * Carregador de templates de prompt em Markdown.
 *
 * Hoje: lê arquivos `.md` de {@link PROMPT_TEMPLATES_DIR} sob demanda, com cache
 * em memória. Amanhã: é a base para o agente puxar prompts dinamicamente (por
 * cena, persona ou módulo de regras) sem recompilar nada.
 */
export class PromptLoader {
  private static instance: PromptLoader;

  private readonly cache = new Map<string, string>();

  private constructor() {}

  public static getInstance(): PromptLoader {
    if (!PromptLoader.instance) {
      PromptLoader.instance = new PromptLoader();
    }
    return PromptLoader.instance;
  }

  /**
   * Lê `templates/<name>.md` (informe `name` sem extensão).
   * O conteúdo é cacheado após a primeira leitura.
   */
  public load(name: string): string {
    const cached = this.cache.get(name);
    if (cached !== undefined) {
      return cached;
    }

    const file = join(PROMPT_TEMPLATES_DIR, `${name}.md`);
    let content: string;
    try {
      content = readFileSync(file, "utf8").trim();
    } catch (cause) {
      throw new LlmError(`Template de prompt não encontrado: "${name}.md".`, {
        cause,
      });
    }

    this.cache.set(name, content);
    return content;
  }

  /** Descarta o cache (útil em hot-reload de dev e em testes). */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const promptLoader = PromptLoader.getInstance();
