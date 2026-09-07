import type { Scene } from "@/database/schemas/scene.schema";
import type { Session } from "@/database/schemas/session.schema";
import { sceneService } from "./scene.service";
import { sessionService } from "./session.service";

/**
 * Guarda-corpos + escrita segura das linhas singleton `scenes` / `sessions`.
 *
 * Domínio puro: **não importa `@/llm`**. É o caminho único de escrita
 * compartilhado pelo subagente de reflexão pós-turno
 * (`state-reflection.service.ts`) e pelas tools LangChain
 * (`@/llm/tools/narrative-state.tools.ts`, ainda não ligadas a nenhum agente).
 */

/** Teto para `scenes.name` / `sessions.name` gravados por aqui. */
export const MAX_NAME_LENGTH = 120;
/**
 * Teto (hard) para `scenes.description` / `sessions.description` gravados por
 * aqui. O alvo pedido ao modelo é 350–500 chars; 500 é o corte.
 */
export const MAX_DESCRIPTION_LENGTH = 500;

export interface ScenePatch {
  name?: string;
  description?: string;
  mode?: Scene["mode"];
}

export interface SessionPatch {
  name?: string;
  description?: string;
}

export interface ApplyResult<T> {
  changed: boolean;
  reason: string;
  row?: T;
}

const normalize = (value: string): string => value.trim().replace(/\s+/g, " ");

/** `true` quando `next` é mudança real e não-trivial frente a `current`. */
function isMateriallyDifferent(
  next: string,
  current: string | null | undefined,
): boolean {
  const a = normalize(next);
  const b = normalize(current ?? "");
  if (a === b) return false;
  // near-noop: delta minúsculo e mesmo começo → tratar como "sem mudança".
  if (Math.abs(a.length - b.length) < 8 && a.slice(0, 40) === b.slice(0, 40)) {
    return false;
  }
  return true;
}

/**
 * `trim`, descarta vazio, corta em fronteira de palavra até `max`. Retorna
 * `undefined` para o campo ser ignorado no patch.
 */
function sanitizeText(
  value: string | undefined,
  max: number,
): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).replace(/\s+\S*$/, "");
}

async function resolveSingletons(): Promise<{
  scene?: Scene;
  session?: Session;
}> {
  const [scene] = await sceneService.findAll();
  const [session] = await sessionService.findAll();
  return { scene, session };
}

async function applySceneUpdate(
  patch: ScenePatch,
): Promise<ApplyResult<Scene>> {
  const { scene } = await resolveSingletons();
  if (!scene) return { changed: false, reason: "no scene row" };

  const out: ScenePatch = {};

  const name = sanitizeText(patch.name, MAX_NAME_LENGTH);
  if (name && isMateriallyDifferent(name, scene.name)) out.name = name;

  const description = sanitizeText(patch.description, MAX_DESCRIPTION_LENGTH);
  if (description && isMateriallyDifferent(description, scene.description)) {
    out.description = description;
  }

  if (patch.mode && patch.mode !== scene.mode) out.mode = patch.mode;

  const fields = Object.keys(out);
  if (fields.length === 0) {
    return { changed: false, reason: "no material change" };
  }

  try {
    const row = await sceneService.update(scene.id, out);
    return { changed: true, reason: `updated: ${fields.join(", ")}`, row };
  } catch (error) {
    return { changed: false, reason: `db error: ${(error as Error).message}` };
  }
}

async function applySessionUpdate(
  patch: SessionPatch,
): Promise<ApplyResult<Session>> {
  const { session } = await resolveSingletons();
  if (!session) return { changed: false, reason: "no session row" };

  const out: SessionPatch = {};

  const name = sanitizeText(patch.name, MAX_NAME_LENGTH);
  if (name && isMateriallyDifferent(name, session.name)) out.name = name;

  const description = sanitizeText(patch.description, MAX_DESCRIPTION_LENGTH);
  if (description && isMateriallyDifferent(description, session.description)) {
    out.description = description;
  }

  const fields = Object.keys(out);
  if (fields.length === 0) {
    return { changed: false, reason: "no material change" };
  }

  try {
    const row = await sessionService.update(session.id, out);
    return { changed: true, reason: `updated: ${fields.join(", ")}`, row };
  } catch (error) {
    return { changed: false, reason: `db error: ${(error as Error).message}` };
  }
}

export const narrativeStateService = {
  resolveSingletons,
  applySceneUpdate,
  applySessionUpdate,
};
