import { identityLayer } from "./layers/identity.layer";
import { gameSystemRulesLayer } from "./layers/game-system-rules.layer";
import { worldStateSnapshotLayer } from "./layers/world-state-snapshot.layer";
import type { SystemPromptLayer } from "./layer.interface";

/** Texto inserido entre camadas na composição do prompt final. */
export const SECTION_SEPARATOR = "\n\n";

/**
 * Camadas do system prompt, **na ordem em que aparecem no prompt final**.
 *
 * Nesta fase há `identity`, `game-system-rules` e `world-state-snapshot`. As
 * próximas camadas (party, NPCs, modo da sessão, ...) entram nesta lista, na
 * posição desejada — o {@link SystemPromptBuilder} não precisa mudar.
 */
export const SYSTEM_PROMPT_LAYERS: readonly SystemPromptLayer[] = [
  identityLayer,
  gameSystemRulesLayer,
  worldStateSnapshotLayer,
];
