import { identityLayer } from "./layers/identity.layer";
import { gameSystemRulesLayer } from "./layers/game-system-rules.layer";
import { worldStateSnapshotLayer } from "./layers/world-state-snapshot.layer";
import { partyCharacterContextLayer } from "./layers/party-character-context.layer";
import { sceneContextLayer } from "./layers/scene-context.layer";
import type { SystemPromptLayer } from "./layer.interface";

/** Texto inserido entre camadas na composição do prompt final. */
export const SECTION_SEPARATOR = "\n\n";

/**
 * Camadas do system prompt, **na ordem em que aparecem no prompt final**.
 *
 * Nesta fase há `identity`, `game-system-rules`, `world-state-snapshot`,
 * `party-character-context` e `scene-context`. As próximas camadas (NPCs
 * avulsos, ...) entram nesta lista, na posição desejada — o
 * {@link SystemPromptBuilder} não precisa mudar.
 */
export const SYSTEM_PROMPT_LAYERS: readonly SystemPromptLayer[] = [
  identityLayer,
  gameSystemRulesLayer,
  worldStateSnapshotLayer,
  partyCharacterContextLayer,
  sceneContextLayer,
];
