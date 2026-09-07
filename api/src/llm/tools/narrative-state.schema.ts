import { z } from "zod";
import { sceneModeEnum } from "@/database/schemas/scene.schema";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
} from "@/service/narrative-state.service";

/** Schema de entrada da tool `update_scene`. */
export const updateSceneToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(MAX_NAME_LENGTH)
    .optional()
    .describe("Novo título da cena — só se mudou."),
  description: z
    .string()
    .min(1)
    .max(MAX_DESCRIPTION_LENGTH)
    .optional()
    .describe("Descrição reescrita (1-3 frases) da situação imediata da cena."),
  mode: z
    .enum(sceneModeEnum)
    .optional()
    .describe("NARRATIVE = exploração/roleplay; COMBAT = combate por turnos."),
});

/** Schema de entrada da tool `update_session`. */
export const updateSessionToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(MAX_NAME_LENGTH)
    .optional()
    .describe("Novo nome da campanha — só se mudou."),
  description: z
    .string()
    .min(1)
    .max(MAX_DESCRIPTION_LENGTH)
    .optional()
    .describe("Resumo macro da campanha. Mude raramente."),
});
