// Lint (tech_standards §17, E5): Next's recommended rules + Core Web Vitals, Prettier owns formatting.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const config = [
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // E6: no focused tests left behind (tech_standards §14-§15; never weaken tests).
      "no-restricted-properties": [
        "error",
        {
          object: "describe",
          property: "only",
          message: "No dejes tests con .only (tech_standards §17 E6).",
        },
        {
          object: "it",
          property: "only",
          message: "No dejes tests con .only (tech_standards §17 E6).",
        },
        {
          object: "test",
          property: "only",
          message: "No dejes tests con .only (tech_standards §17 E6).",
        },
      ],
    },
  },
  {
    ignores: [
      ".next/**",
      "prototypes/**",
      "public/sw.js",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default config;
