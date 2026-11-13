/**
 * Synthetic copy of the `fitness` Drive folder, shaped by fitness/_system/schema.md
 * (exercises 1, routines 3, program 1, sessions 1). Never real data: every text is invented.
 *
 * Marker strings (HEALTH_MARKERS) let tests check that health content never reaches logs,
 * error bodies or the `skipped` list.
 */

export type KbFile = { path: string; content: string };

export const HEALTH_MARKERS = {
  constraintText: "MARCADOR-RESTRICCION-SINTETICA",
  journalText: "MARCADOR-DIARIO-SINTETICO",
  routineHistory: "MARCADOR-HISTORIAL-SINTETICO",
  brokenRoutineTitle: "MARCADOR-RUTINA-ROTA",
} as const;

const vocab = (entries: Record<string, string>) =>
  Object.entries(entries)
    .map(([id, label]) => `${id}: { label: "${label}" }`)
    .join("\n") + "\n";

export const vocabularyFiles: KbFile[] = [
  {
    path: "_system/regions.yaml",
    content:
      "# Body regions\n" +
      'core:       { folder: 01-core,       label: "Core" }\n' +
      'lower-body: { folder: 02-lower-body, label: "Tren inferior" }\n' +
      'upper-body: { folder: 03-upper-body, label: "Tren superior" }\n' +
      'full-body:  { folder: 04-full-body,  label: "Cuerpo completo" }\n',
  },
  {
    path: "_system/zones.yaml",
    content:
      'abdomen: { label: "Abdomen", region: core }\n' +
      'legs: { label: "Piernas", region: lower-body }\n' +
      'back: { label: "Espalda", region: upper-body }\n',
  },
  {
    path: "_system/muscles.yaml",
    content:
      'rectus-abdominis: { label: "Recto abdominal", zone: abdomen }\n' +
      'quadriceps: { label: "Cuádriceps", zone: legs }\n' +
      'latissimus-dorsi: { label: "Dorsal ancho", zone: back }\n',
  },
  { path: "_system/goals.yaml", content: vocab({ strength: "Fuerza", stability: "Estabilidad", mobility: "Movilidad" }) },
  { path: "_system/patterns.yaml", content: vocab({ "anti-extension": "Antiextensión", squat: "Sentadilla", pull: "Tirón" }) },
  { path: "_system/positions.yaml", content: vocab({ prone: "Boca abajo", standing: "De pie" }) },
  { path: "_system/equipment.yaml", content: vocab({ mat: "Esterilla", band: "Banda elástica" }) },
  { path: "_system/resistances.yaml", content: vocab({ light: "Ligera", medium: "Media" }) },
  { path: "_system/stresses.yaml", content: vocab({ "spinal-flexion": "Flexión lumbar", "axial-load": "Carga axial" }) },
  { path: "_system/levels.yaml", content: vocab({ beginner: "Inicial", intermediate: "Intermedio" }) },
  {
    path: "routines/_system/categories.yaml",
    content:
      'strength: { folder: 02-strength, label: "Fuerza" }\n' +
      'mobility: { folder: 03-mobility, label: "Movilidad" }\n' +
      'express: { folder: 04-express, label: "Exprés" }\n',
  },
];

const exercise = (id: string, folder: string, fm: string, body: string): KbFile => ({
  path: `exercises/items/${folder}/${id}.md`,
  content:
    "---\n" +
    `id: ${id}\n` +
    "domain: exercises\n" +
    "created: 2026-10-01T10:00:00-05:00\n" +
    "updated: 2026-10-01T10:00:00-05:00\n" +
    fm +
    "---\n\n" +
    body,
});

export const exerciseFiles: KbFile[] = [
  exercise(
    "plancha-sintetica",
    "01-core",
    'title: "Plancha sintética"\n' +
      "region: core\n" +
      'zones: ["abdomen"]\n' +
      'muscles: { primary: ["rectus-abdominis"], secondary: [] }\n' +
      'goals: ["stability"]\n' +
      "pattern: anti-extension\n" +
      "position: prone\n" +
      'equipment: ["mat"]\n' +
      "laterality: bilateral\n" +
      "measure: time\n" +
      "level: beginner\n" +
      "stresses: []\n" +
      "default_dose: { sets: 3, time: 30 }\n" +
      "custom_unknown_field: conservar\n",
    "## Execution\n\nTexto de ejecución inventado.\n\n## Common mistakes\n\n- Error inventado.\n\n## Progression\n\nProgresión inventada.\n\n## Notes\n\nNota inventada.\n",
  ),
  exercise(
    "sentadilla-sintetica",
    "02-lower-body",
    'title: "Sentadilla sintética"\n' +
      "region: lower-body\n" +
      'zones: ["legs"]\n' +
      'muscles: { primary: ["quadriceps"], secondary: [] }\n' +
      'goals: ["strength"]\n' +
      "pattern: squat\n" +
      "position: standing\n" +
      "equipment: []\n" +
      "laterality: bilateral\n" +
      "measure: reps\n" +
      "level: beginner\n" +
      'stresses: ["axial-load"]\n' +
      "default_dose: { sets: 3, reps: 12 }\n" +
      "variants:\n" +
      '  silla: { label: "Con silla", level: beginner, equipment: [] }\n',
    "## Execution\n\nOtra ejecución inventada.\n",
  ),
  exercise(
    "remo-sintetico",
    "03-upper-body",
    'title: "Remo sintético"\n' +
      "region: upper-body\n" +
      'zones: ["back"]\n' +
      'muscles: { primary: ["latissimus-dorsi"], secondary: [] }\n' +
      'goals: ["strength"]\n' +
      "pattern: pull\n" +
      "position: standing\n" +
      'equipment: ["band"]\n' +
      "laterality: bilateral\n" +
      "measure: reps\n" +
      "level: beginner\n" +
      "stresses: []\n",
    "## Execution\n\nRemo inventado.\n",
  ),
];

const routine = (
  id: string,
  folder: string,
  status: string,
  extraFm: string,
  blocks: string | null,
): KbFile => ({
  path: `routines/items/${folder}/${id}.md`,
  content:
    "---\n" +
    `id: ${id}\n` +
    "domain: routines\n" +
    "created: 2026-10-01T10:00:00-05:00\n" +
    "updated: 2026-10-01T10:00:00-05:00\n" +
    extraFm +
    "user: al\n" +
    `status: ${status}\n` +
    (blocks ?? "") +
    "---\n\n" +
    "## Guidelines\n\n- Pauta inventada.\n\n" +
    "## Progression\n\n- Progresión inventada.\n\n" +
    `## History\n\n- 2026-10-01: ${HEALTH_MARKERS.routineHistory}\n`,
});

const strengthBlocks =
  "blocks:\n" +
  "  - id: strength\n" +
  '    label: "Fuerza"\n' +
  "    items:\n" +
  '      - { ex: "sentadilla-sintetica", sets: 3, reps: 10, variant: "silla" }\n' +
  '      - { ex: "remo-sintetico", sets: 3, reps: 12, resistance: "light" }\n';

export const routineFiles: KbFile[] = [
  routine(
    "fuerza-sintetica",
    "02-strength",
    "active",
    'title: "Fuerza sintética"\ncategory: strength\ndays: ["mon", "thu"]\nduration_min: 30\n',
    strengthBlocks,
  ),
  routine(
    "expres-sintetica",
    "04-express",
    "active",
    'title: "Exprés sintética"\ncategory: express\ndays: []\nduration_min: 10\n',
    "blocks:\n" +
      "  - id: mat\n" +
      '    label: "Esterilla"\n' +
      "    items:\n" +
      '      - { ex: "plancha-sintetica", sets: 2, time: 20 }\n' +
      '      - { ex: "ejercicio-que-no-existe", sets: 1, reps: 5 }\n',
  ),
  routine(
    "movilidad-sintetica",
    "03-mobility",
    "paused",
    'title: "Movilidad sintética"\ncategory: mobility\ndays: ["sun"]\n',
    "blocks:\n  - id: mobility\n    items:\n      - { ex: \"plancha-sintetica\" }\n",
  ),
  routine(
    "borrador-sintetico",
    "02-strength",
    "draft",
    'title: "Borrador sintético"\ncategory: strength\ndays: []\n',
    strengthBlocks,
  ),
  routine(
    "archivada-sintetica",
    "02-strength",
    "archived",
    'title: "Archivada sintética"\ncategory: strength\ndays: []\n',
    strengthBlocks,
  ),
];

export const programFile: KbFile = {
  path: "program/al.yaml",
  content:
    "# Synthetic program\n" +
    "user: al\n" +
    "updated: 2026-10-01T10:00:00-05:00\n" +
    "phase:\n" +
    '  label: "Fase sintética"\n' +
    "  since: 2026-10-01\n" +
    '  goal: "Objetivo inventado"\n' +
    "constraints:\n" +
    '  avoid_stresses: ["spinal-flexion"]\n' +
    `  avoid_text: ["${HEALTH_MARKERS.constraintText}"]\n` +
    '  rules: ["Regla inventada"]\n' +
    "schedule:\n" +
    "  sessions_per_week: [3, 5]\n" +
    "  week:\n" +
    '    mon: ["fuerza-sintetica"]\n' +
    "    tue: []\n" +
    "    wed: []\n" +
    '    thu: ["fuerza-sintetica"]\n' +
    "    fri: []\n" +
    "    sat: []\n" +
    '    sun: ["movilidad-sintetica"]\n' +
    '  note: "Nota inventada"\n' +
    "journal:\n" +
    `  - { date: 2026-10-02, type: checkin, text: "${HEALTH_MARKERS.journalText}" }\n`,
};

/** `now` for unit tests: 2026-11-12 12:00 in America/Bogota (UTC-5). */
export const NOW = new Date("2026-11-12T12:00:00-05:00");

export const sessionsFile: KbFile = {
  path: "sessions/al.yaml",
  content:
    "# Synthetic sessions\n" +
    "user: al\n" +
    "updated: 2026-11-10T10:00:00-05:00\n" +
    "sessions:\n" +
    // 24 days before NOW: out of the 14-day window
    '  - { date: 2026-10-19, start: "08:00", routine: fuerza-sintetica, status: completed, duration_min: 30, exercises: [] }\n' +
    // exactly 14 days before NOW: inside the window (date >= today - 14 days)
    '  - { date: 2026-10-29, start: "08:00", routine: fuerza-sintetica, status: completed, duration_min: 30, exercises: [] }\n' +
    // 3 days before NOW
    '  - { date: 2026-11-09, start: "08:00", routine: expres-sintetica, status: partial, duration_min: 8, exercises: [] }\n',
};

export function kbFiles(): KbFile[] {
  return [...vocabularyFiles, ...exerciseFiles, ...routineFiles, programFile, sessionsFile].map(
    (f) => ({ ...f }),
  );
}

/** Returns a copy of `files` with the file at `path` replaced (or removed if content is null). */
export function withFile(files: KbFile[], path: string, content: string | null): KbFile[] {
  const rest = files.filter((f) => f.path !== path);
  return content === null ? rest : [...rest, { path, content }];
}

export const BROKEN_YAML_ROUTINE: KbFile = {
  path: "routines/items/02-strength/rota-yaml.md",
  content: `---\nid: rota-yaml\ntitle: "${HEALTH_MARKERS.brokenRoutineTitle}\nstatus: [active\n---\n\n## Guidelines\n`,
};

/** Valid YAML, but `blocks` (required by routines 3) is missing. */
export const SCHEMA_INVALID_ROUTINE: KbFile = {
  path: "routines/items/02-strength/sin-bloques.md",
  content:
    "---\nid: sin-bloques\ndomain: routines\ncreated: 2026-10-01T10:00:00-05:00\n" +
    `updated: 2026-10-01T10:00:00-05:00\ntitle: "${HEALTH_MARKERS.brokenRoutineTitle}"\n` +
    "category: strength\nuser: al\nstatus: active\n---\n\n## Guidelines\n\n- x\n",
};
