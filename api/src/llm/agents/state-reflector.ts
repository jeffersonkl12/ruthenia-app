import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { sceneModeEnum } from "@/database/schemas/scene.schema";
import { REFLECTION_PROMPT } from "@/llm/prompts";
import { modelFactory } from "@/llm/providers";

/**
 * Subagente de reflexão de estado narrativo: uma única chamada a um modelo
 * barato (Haiku por padrão), sem grafo e sem acesso ao banco. Dado o estado
 * atual da sessão/cena + o transcript recente, decide se `scene` e/ou
 * `session` precisam ser reescritos. A aplicação fica com
 * `@/service/state-reflection.service`.
 */

const REFLECTION_PROVIDER =
  process.env.LLM_REFLECTION_PROVIDER?.trim() || "anthropic";
const REFLECTION_MODEL =
  process.env.LLM_REFLECTION_MODEL?.trim() || "claude-haiku-4-5";
const REFLECTION_MAX_TOKENS = 512;

export const reflectionDecisionSchema = z.object({
  session: z
    .object({
      name: z.string().min(1).max(120).optional(),
      // Alvo 350–500 chars; 500 é o corte (ver MAX_DESCRIPTION_LENGTH).
      description: z.string().min(1).max(500).optional(),
    })
    .nullable()
    .describe(
      "Non-null só se o macro da campanha mudou de forma duradoura. Viés forte para null.",
    ),
  scene: z
    .object({
      name: z.string().min(1).max(120).optional(),
      description: z.string().min(1).max(500).optional(),
      mode: z.enum(sceneModeEnum).optional(),
    })
    .nullable()
    .describe("Non-null só se a situação imediata da cena mudou."),
  reason: z
    .string()
    .max(500)
    .describe("Uma frase: por que essas mudanças (ou por que nenhuma)."),
});

export type ReflectionDecision = z.infer<typeof reflectionDecisionSchema>;

export interface ReflectionInput {
  sessionName: string;
  sessionDescription: string;
  sceneName: string;
  sceneDescription: string;
  sceneMode: string;
  /** Throttle: quando `false`, o modelo deve devolver sempre `session: null`. */
  sessionInScope: boolean;
  /** Pré-montado: últimas ~10 mensagens + "Mestre (resposta final): ...". */
  transcript: string;
}

async function buildStructuredModel() {
  const model = await modelFactory.create({
    provider: REFLECTION_PROVIDER,
    model: REFLECTION_MODEL,
    temperature: 0,
    maxTokens: REFLECTION_MAX_TOKENS,
  });
  console.info(
    `[state-reflection] reflector model = ${REFLECTION_PROVIDER}:${REFLECTION_MODEL}`,
  );
  return model.withStructuredOutput(reflectionDecisionSchema, {
    name: "narrative_state_reflection",
  });
}

let structuredModelPromise:
  | ReturnType<typeof buildStructuredModel>
  | undefined;

function getStructuredModel(): ReturnType<typeof buildStructuredModel> {
  if (!structuredModelPromise) {
    structuredModelPromise = buildStructuredModel().catch((error: unknown) => {
      // Não deixa uma criação falha "grudar" — a próxima tentativa refaz.
      structuredModelPromise = undefined;
      throw error;
    });
  }
  return structuredModelPromise;
}

/**
 * Roda a reflexão. Lança se o modelo/credencial falharem ou se a saída não
 * casar com o schema — quem chama trata como no-op.
 */
export async function runStateReflection(
  input: ReflectionInput,
): Promise<ReflectionDecision> {
  const model = await getStructuredModel();
  const prompt = REFLECTION_PROMPT.render({
    sessionName: input.sessionName,
    sessionDescription: input.sessionDescription || "(vazia)",
    sceneName: input.sceneName,
    sceneDescription: input.sceneDescription || "(vazia)",
    sceneMode: input.sceneMode,
    sessionInScope: input.sessionInScope ? "sim" : "não",
    transcript: input.transcript,
  });
  return model.invoke([new HumanMessage(prompt)]);
}
