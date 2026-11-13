#!/usr/bin/env node
// Standards checks for fitness-coach (tech_standards §17, Enforcement Map).
// Run with `npm run check:standards` (part of `npm run check`). Exits 1 on any violation.
//   E1  approved dependencies only ............ tech_standards §1 "Librerías aprobadas" / "No permitido"
//   E2  TypeScript strict ...................... tech_standards §1 "Lenguaje"
//   E3  no secrets or credentials in the repo .. tech_standards §10
// Changing APPROVED or FORBIDDEN is a standards change: ADR first (tech_standards §16).
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

// --- E1: approved dependencies (§1) -------------------------------------------------------
const APPROVED = new Set([
  // Stack (§1)
  "next",
  "react",
  "react-dom",
  "typescript",
  // Approved libraries (§1)
  "tailwindcss",
  "lucide-react",
  "@googleapis/drive",
  "yaml",
  "zod",
  "idb-keyval",
  "serwist",
  "@serwist/next",
  "vitest",
  "@playwright/test",
  "eslint",
  "eslint-config-next",
  "prettier",
  // Companions required by the approved tools (listed in §1 since 2026-11-12)
  "@tailwindcss/postcss",
  "postcss",
  "eslint-config-prettier",
]);
const APPROVED_PREFIXES = ["@types/"];
const FORBIDDEN = [
  [
    /^(pg|postgres|@supabase\/.*|firebase|firebase-admin|prisma|@prisma\/.*|drizzle-orm|mongoose|sequelize|typeorm)$/,
    "bases de datos y ORMs",
  ],
  [/^(next-auth|@auth\/.*|@clerk\/.*|lucia)$/, "proveedores de auth"],
  [/^(@mui\/.*|@chakra-ui\/.*|antd|@mantine\/.*)$/, "kits de componentes pesados"],
  [/^(next-pwa|@ducanh2912\/next-pwa|workbox-.*)$/, "next-pwa / Workbox (se usa serwist)"],
  [
    /^(redux|@reduxjs\/.*|zustand|jotai|recoil|mobx|swr|@tanstack\/react-query|axios)$/,
    "gestores de estado y librerías de fetching",
  ],
  [/^(moment|moment-timezone|dayjs|date-fns|luxon)$/, "librerías de fechas"],
  [/^googleapis$/, "el paquete completo googleapis (se usa @googleapis/drive)"],
];

const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) {
  errors.push("E1: no hay package.json en apps/fitness-coach");
} else {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      const forbidden = FORBIDDEN.find(([re]) => re.test(name));
      if (forbidden) {
        errors.push(`E1: ${name} (${field}) está prohibido en tech_standards §1: ${forbidden[1]}`);
      } else if (!APPROVED.has(name) && !APPROVED_PREFIXES.some((p) => name.startsWith(p))) {
        errors.push(
          `E1: ${name} (${field}) no está en las librerías aprobadas de tech_standards §1; hace falta un ADR`,
        );
      }
    }
  }
}

// --- E2: TypeScript strict (§1) -----------------------------------------------------------
const tsconfigPath = join(root, "tsconfig.json");
if (existsSync(tsconfigPath)) {
  // tsconfig allows comments and trailing commas; strip them outside strings before parsing
  // (a naive regex would eat "@/*" path aliases).
  const raw = readFileSync(tsconfigPath, "utf8").replace(
    /("(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (m, str) => str ?? "",
  );
  const ts = JSON.parse(raw.replace(/,(\s*[}\]])/g, "$1"));
  if (ts?.compilerOptions?.strict !== true)
    errors.push("E2: tsconfig.json debe tener compilerOptions.strict = true (tech_standards §1)");
}

// --- E3: no secrets in tracked files (§10) ------------------------------------------------
let tracked = [];
try {
  tracked = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "."],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
} catch {
  errors.push("E3: no se pudo listar los ficheros con git");
}
const SECRET_PATTERNS = [
  [/-----BEGIN (RSA |EC |)PRIVATE KEY-----/, "clave privada"],
  [/"type"\s*:\s*"service_account"/, "credencial de service account de Google"],
  [/"private_key_id"\s*:\s*"[0-9a-f]{20,}"/, "private_key_id de Google"],
  [/^\s*APP_ACCESS_KEY\s*=\s*\S+/m, "valor de APP_ACCESS_KEY"],
];
for (const file of tracked) {
  if (/(^|\/)\.env(\..*)?$/.test(file) && !file.endsWith(".example")) {
    errors.push(`E3: ${file} no debe estar en el repo (solo .env*.example)`);
    continue;
  }
  if (
    /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf)$/i.test(file) ||
    file === "scripts/check-standards.mjs"
  )
    continue;
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  for (const [re, what] of SECRET_PATTERNS) {
    if (re.test(text))
      errors.push(`E3: ${file} parece contener un secreto (${what}); tech_standards §10`);
  }
}

if (errors.length) {
  console.error(`check-standards: ${errors.length} problema(s)\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log("check-standards: OK (E1 dependencias, E2 strict, E3 secretos)");
