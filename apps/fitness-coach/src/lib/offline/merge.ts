/**
 * FR-4 on the client: a single-file domain listed in `incoming.skipped` (program, sessions, a
 * vocabulary) keeps its value from the previous copy. Everything else comes from `incoming`.
 */
import { PROGRAM_FILE, SESSIONS_FILE, VOCABULARY_FILES, type Skipped } from "@/lib/schema/snapshot";

/** The fields merge touches; any snapshot document has them. */
type Mergeable = {
  program: unknown;
  sessions: unknown[];
  vocabularies: Partial<Record<string, unknown>>;
  skipped: readonly Skipped[];
};

const VOCABULARY_BY_PATH = new Map<string, string>(
  Object.entries(VOCABULARY_FILES).map(([name, path]) => [path, name]),
);

export function mergeSnapshot<I extends Mergeable>(previous: Mergeable | null, incoming: I): I {
  if (!previous || incoming.skipped.length === 0) return incoming;
  const skippedPaths = new Set(incoming.skipped.map((s) => s.path));
  const merged: I = { ...incoming, vocabularies: { ...incoming.vocabularies } };
  if (skippedPaths.has(PROGRAM_FILE)) merged.program = previous.program as I["program"];
  if (skippedPaths.has(SESSIONS_FILE)) merged.sessions = previous.sessions as I["sessions"];
  for (const path of skippedPaths) {
    const name = VOCABULARY_BY_PATH.get(path);
    if (name && previous.vocabularies[name] !== undefined) {
      merged.vocabularies[name] = previous.vocabularies[name];
    }
  }
  return merged;
}
