import { identityLayer } from "./layers/identity.layer";
import type { SystemPromptLayer } from "./layer.interface";

/** Texto inserido entre camadas na composição do prompt final. */
export const SECTION_SEPARATOR = "\n\n";

/**
 * Camadas do system prompt, **na ordem em que aparecem no prompt final**.
 *
 * Nesta fase só há `identity`. As próximas camadas (mundo, party, location,
 * NPCs, modo da sessão, ...) entram nesta lista, na posição desejada — o
 * {@link SystemPromptBuilder} não precisa mudar.
 */
export const SYSTEM_PROMPT_LAYERS: readonly SystemPromptLayer[] = [
  identityLayer,
];
