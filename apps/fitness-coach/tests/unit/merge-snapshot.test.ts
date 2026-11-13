/**
 * [fitness-coach/001] Client keeps the previous version of a single-file domain that failed (FR-4, AC-16).
 *
 * Seam required from the implementation (test contract, see tests/README.md):
 *   src/lib/offline/merge.ts
 *     export function mergeSnapshot(previous: Snapshot | null, incoming: Snapshot): Snapshot
 *   Returns the snapshot to store: `incoming`, except that a single-file domain listed in
 *   `incoming.skipped` (program/al.yaml, sessions/al.yaml, a vocabulary file) keeps its value from
 *   `previous`.
 */
import { describe, expect, it } from "vitest";
import { mergeSnapshot } from "@/lib/offline/merge";
import { makeSnapshot } from "../fixtures/snapshot";

describe("[fitness-coach/001] mergeSnapshot", () => {
  it("[fitness-coach/001] AC-16: an unreadable program keeps the previous program; exercises and routines update", () => {
    const previous = makeSnapshot({ exercises: 3, activeRoutines: 2 });
    const incoming = {
      ...makeSnapshot({ exercises: 4, activeRoutines: 3 }),
      program: null,
      skipped: [{ path: "program/al.yaml", reason: "parse_error" as const }],
    };
    const merged = mergeSnapshot(previous, incoming);
    expect(merged.program).toEqual(previous.program);
    expect(merged.exercises).toHaveLength(4);
    expect(merged.routines).toHaveLength(3);
    expect(merged.skipped).toEqual(incoming.skipped);
  });

  it("[fitness-coach/001] AC-16: with no previous copy, an unreadable program stays empty", () => {
    const incoming = {
      ...makeSnapshot(),
      program: null,
      skipped: [{ path: "program/al.yaml", reason: "parse_error" as const }],
    };
    expect(mergeSnapshot(null, incoming).program).toBeNull();
  });

  it("[fitness-coach/001] FR-4: an unreadable sessions file keeps the previous sessions", () => {
    const previous = { ...makeSnapshot(), sessions: [{ date: "2026-11-10", routine: "x", status: "completed" }] };
    const incoming = {
      ...makeSnapshot(),
      sessions: [],
      skipped: [{ path: "sessions/al.yaml", reason: "schema_error" as const }],
    };
    expect(mergeSnapshot(previous, incoming).sessions).toEqual(previous.sessions);
  });

  it("[fitness-coach/001] FR-4: an unreadable vocabulary keeps the previous one", () => {
    const previous = makeSnapshot();
    const incoming = makeSnapshot();
    const { regions: _dropped, ...rest } = incoming.vocabularies;
    const broken = {
      ...incoming,
      vocabularies: rest,
      skipped: [{ path: "_system/regions.yaml", reason: "parse_error" as const }],
    };
    expect(mergeSnapshot(previous, broken as typeof incoming).vocabularies.regions).toEqual(
      previous.vocabularies.regions,
    );
  });

  it("[fitness-coach/001] FR-4: with nothing skipped, the incoming snapshot wins entirely", () => {
    const previous = makeSnapshot({ exercises: 2 });
    const incoming = makeSnapshot({ exercises: 5 });
    expect(mergeSnapshot(previous, incoming)).toEqual(incoming);
  });
});
