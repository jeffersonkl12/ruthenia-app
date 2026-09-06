import { eta } from "./template.engine";
import type { DynamicLayer, SystemPromptContext } from "./layer.interface";

/**
 * Descrição declarativa de uma camada dinâmica baseada em template Eta.
 *
 * `Data` é o objeto que o template `.eta` consome via `it`. A camada **não busca
 * dados**: `select` apenas recorta, do contexto já montado pela borda, o que
 * aquele template precisa.
 */
export interface EtaDynamicLayerSpec<Data extends object> {
  /** Id estável e único da camada, ex.: `"party"`. */
  id: string;
  /** Nome do arquivo em `prompts/templates/` (sem a extensão `.eta`). */
  template: string;
  /**
   * Recorta do contexto os dados esperados pelo template.
   * Retorne `null` quando a informação não estiver disponível — a camada é
   * então omitida do prompt final.
   */
  select(ctx: SystemPromptContext): Data | null;
}

/**
 * Cria uma {@link DynamicLayer} que renderiza `templates/<template>.eta` com o
 * recorte de contexto devolvido por `select`.
 *
 * ```ts
 * export const partyLayer = etaDynamicLayer({
 *   id: "party",
 *   template: "party",
 *   select: (ctx) => (ctx.party ? { members: ctx.party.members } : null),
 * });
 * ```
 */
export function etaDynamicLayer<Data extends object>(
  spec: EtaDynamicLayerSpec<Data>,
): DynamicLayer {
  return {
    id: spec.id,
    kind: "dynamic",
    render: (ctx) => {
      const data = spec.select(ctx);
      if (data === null) return "";
      return eta.render(spec.template, data).trim();
    },
  };
}
