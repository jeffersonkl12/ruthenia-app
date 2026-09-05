import { promptLoader } from "./prompt.loader";
import type { PromptModule, PromptVars } from "./prompt.interface";

/** Interpola `{{chave}}` no template. Placeholders sem valor viram string vazia. */
export function renderPrompt(template: string, vars: PromptVars = {}): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value === undefined ? "" : String(value);
  });
}

/** Implementação padrão de {@link PromptModule} baseada em template. */
export class TemplatePrompt implements PromptModule {
  constructor(
    public readonly id: string,
    public readonly template: string,
  ) {}

  /** Cria um {@link TemplatePrompt} a partir de `templates/<name>.md`. */
  static fromFile(id: string, name: string): TemplatePrompt {
    return new TemplatePrompt(id, promptLoader.load(name));
  }

  render(vars: PromptVars = {}): string {
    return renderPrompt(this.template, vars).trim();
  }
}

/**
 * Prompt de sistema base — assistente genérico e neutro.
 * Conteúdo em `prompts/templates/system.base.md`; é a fundação sobre a qual o
 * mestre narrador será construído.
 */
export const BASE_SYSTEM_PROMPT = TemplatePrompt.fromFile(
  "system.base",
  "system.base",
);
