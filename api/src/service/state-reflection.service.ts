import {
  runStateReflection,
  type ReflectionDecision,
} from "@/llm/agents/state-reflector";
import { narrativeStateService } from "./narrative-state.service";

/**
 * Orquestra a reflexão de estado narrativo pós-turno.
 *
 * Depois de cada resposta do mestre, o `chat.controller` chama
 * `reflectAfterTurn` fire-and-forget. Aqui: gate de tamanho + lock in-flight
 * por sessão + throttle da sessão (macro), chamada ao subagente barato
 * (`runStateReflection`) e aplicação via `narrativeStateService`. Isolamento
 * total de falha — nada propaga para a resposta HTTP.
 *
 * Introduz um acoplamento `@/service -> @/llm` em runtime (import por caminho
 * exato de `@/llm/agents/state-reflector`). Não há ciclo: `@/llm` não importa
 * `@/service`. Este arquivo fica **fora** do barrel `@/service/index.ts`.
 */

/** Respostas do mestre mais curtas que isto (chars) não disparam reflexão. */
const MIN_REPLY_LENGTH = 200;
/** Quantas mensagens do histórico recente entram no transcript. */
const RECENT_MSG_LIMIT = 10;
/** Corte de caracteres por mensagem no transcript. */
const MSG_TRUNC = 500;
/** A sessão (macro) só é reavaliada a cada N turnos (ou após mudança de cena). */
const SESSION_CHECK_EVERY_N = 3;

export interface RecentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReflectAfterTurnParams {
  sessionId: number;
  /** Histórico ANTES da resposta final do mestre. */
  recentMessages: RecentMessage[];
  finalReply: string;
}

const inFlight = new Map<number, Promise<void>>();
const turnsSinceSessionCheck = new Map<number, number>();

function assembleTranscript(
  recent: RecentMessage[],
  finalReply: string,
): string {
  const lines = recent
    .slice(-RECENT_MSG_LIMIT)
    .filter((message) => message.content?.trim())
    .map((message) => {
      const who = message.role === "user" ? "Jogador" : "Mestre";
      return `${who}: ${message.content.slice(0, MSG_TRUNC)}`;
    });
  lines.push(`Mestre (resposta final): ${finalReply.slice(0, MSG_TRUNC * 3)}`);
  return lines.join("\n");
}

async function reflectAfterTurn(
  params: ReflectAfterTurnParams,
): Promise<void> {
  const { sessionId, recentMessages, finalReply } = params;
  try {
    const replyLength = finalReply.trim().length;
    if (replyLength < MIN_REPLY_LENGTH) {
      console.info(
        `[state-reflection] skipped: reply too short (${replyLength})`,
      );
      return;
    }
    if (inFlight.has(sessionId)) {
      console.info(
        `[state-reflection] skipped: in-flight session=${sessionId}`,
      );
      return;
    }

    const run = (async (): Promise<void> => {
      const { scene, session } =
        await narrativeStateService.resolveSingletons();
      if (!scene || !session) {
        console.info("[state-reflection] skipped: no scene/session row");
        return;
      }

      const turnCount =
        (turnsSinceSessionCheck.get(sessionId) ?? SESSION_CHECK_EVERY_N) + 1;
      const sessionInScope = turnCount >= SESSION_CHECK_EVERY_N;

      console.info(
        `[state-reflection] start session=${sessionId} replyLen=${replyLength} sessionInScope=${sessionInScope}`,
      );

      let decision: ReflectionDecision;
      try {
        decision = await runStateReflection({
          sessionName: session.name,
          sessionDescription: session.description ?? "",
          sceneName: scene.name,
          sceneDescription: scene.description ?? "",
          sceneMode: scene.mode,
          sessionInScope,
          transcript: assembleTranscript(recentMessages, finalReply),
        });
      } catch (error) {
        console.error("[state-reflection] reflector failed", error);
        return;
      }

      console.info(
        `[state-reflection] decision reason="${decision.reason}" ` +
          `scene=${Boolean(decision.scene)} session=${Boolean(decision.session)}`,
      );

      let sceneChanged = false;
      if (decision.scene) {
        const result = await narrativeStateService.applySceneUpdate(
          decision.scene,
        );
        sceneChanged = result.changed;
        console.info(
          `[state-reflection] scene ${result.changed ? "applied" : "no-op"}: ${result.reason}`,
        );
      }

      if (sessionInScope) {
        if (decision.session) {
          const result = await narrativeStateService.applySessionUpdate(
            decision.session,
          );
          console.info(
            `[state-reflection] session ${result.changed ? "applied" : "no-op"}: ${result.reason}`,
          );
        }
        turnsSinceSessionCheck.set(sessionId, 0);
      } else if (sceneChanged) {
        // Cena mudou → força reavaliação do macro no próximo turno.
        turnsSinceSessionCheck.set(sessionId, SESSION_CHECK_EVERY_N);
      } else {
        turnsSinceSessionCheck.set(sessionId, turnCount);
      }
    })();

    const guarded = run.catch((error: unknown) => {
      console.error("[state-reflection] run error", error);
    });
    inFlight.set(sessionId, guarded);
    void guarded.finally(() => {
      inFlight.delete(sessionId);
    });
    await guarded;
  } catch (error) {
    console.error("[state-reflection] fatal (swallowed)", error);
  }
}

export const stateReflectionService = { reflectAfterTurn };
