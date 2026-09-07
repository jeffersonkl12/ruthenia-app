/**
 * Tools LangChain de escrita de estado narrativo. Construídas e prontas, mas
 * **não ligadas a nenhum agente** (decisão de design — ver plano). O escritor
 * ativo hoje é o subagente de reflexão pós-turno
 * (`@/service/state-reflection.service`). Para ligar no futuro: `tools?` em
 * `AgentSpec`, `bindTools` + `ToolNode` em `base.agent.ts`, e passar
 * `narrativeStateTools` em `agent.pool.ts`.
 *
 * Este é o único ponto de acoplamento `@/llm -> @/service` em runtime: mantido
 * fora do barrel `@/llm/index.ts` e importado sempre por caminho exato.
 */
import { tool } from "@langchain/core/tools";
import { narrativeStateService } from "@/service/narrative-state.service";
import {
  updateSceneToolSchema,
  updateSessionToolSchema,
} from "./narrative-state.schema";

export const updateSceneTool = tool(
  async (input) => {
    const result = await narrativeStateService.applySceneUpdate(input);
    console.info(
      `[narrative-state] scene.update -> changed=${result.changed} (${result.reason})`,
    );
    return result.changed
      ? `Cena atualizada (${result.reason}).`
      : `Nenhuma atualização aplicada (${result.reason}).`;
  },
  {
    name: "update_scene",
    description:
      "Atualiza nome, descrição e/ou modo da cena atual quando a situação " +
      "imediata mudou materialmente. Omita campos que não mudaram.",
    schema: updateSceneToolSchema,
  },
);

export const updateSessionTool = tool(
  async (input) => {
    const result = await narrativeStateService.applySessionUpdate(input);
    console.info(
      `[narrative-state] session.update -> changed=${result.changed} (${result.reason})`,
    );
    return result.changed
      ? `Sessão atualizada (${result.reason}).`
      : `Nenhuma atualização aplicada (${result.reason}).`;
  },
  {
    name: "update_session",
    description:
      "Atualiza nome/descrição da campanha (sessão). Use raramente — só para " +
      "viradas duradouras de nível macro. Omita campos que não mudaram.",
    schema: updateSessionToolSchema,
  },
);

/** Conjunto pronto para `bindTools` / `ToolNode` quando o wiring for feito. */
export const narrativeStateTools = [updateSceneTool, updateSessionTool];
