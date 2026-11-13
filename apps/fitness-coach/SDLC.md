# SDLC — Fitness Coach

> Configuration read by the SDLC skills (product-manager, tech-lead, ux-designer,
> document-manager) at the start of every run. Belongs to this project only. Never copy
> it into another project; run Project Init there instead.

## Project
- project_id: fitness-coach
- type: app
- name: Fitness Coach               # PWA name shown on the phone: "My Coach"
- docs_language: es                 # UI copy in Spanish; KB scaffolding (keys, ids) stays English per fitness/_system/schema.md
- rigor: personal
- surfaces: web                     # mobile-first PWA, fully offline

## Paths
- docs_root: docs
- features_root: docs/features
- web_app: src/app
- web_components: src/components
- mobile_app: none
- mobile_components: none
- prototypes: prototypes

## Shared dependencies (type: app only)
- shared_deps: none

## Git
- base_branch: main
- branch_pattern: <project_id>/<id>-<slug>
- commit_tag: [<project_id>/<id>]

## Conventions
- slug_case: kebab-case

## Phase 0
- product_vision: approved (2026-11-12)
- tech_foundations: approved (2026-11-12)
- test_strategy: pending            # short (personal)
- standards_enforcement: approved (2026-11-12)   # §17; blocking via `npm run check` + fitness-coach-pr-reviewer (no CI yet)
- ui_foundations: approved (2026-11-12)
- platform_foundations: pending     # optional (personal)
- release_process: pending          # optional (personal)

## Design
- claude_design: available
- claude_design_system: "My Coach" (https://claude.ai/artifact/CwGT2o2CejLzMpW7PQ7GHf), working copy of docs/context/ui_standards.md + ui_kit_registry.md

## Work tracking
- work_tracker: none

## Subagents (Claude Code)
- subagents: fitness-coach-pr-reviewer   # .claude/agents/, mandatory independent PR review

## Isolation exception (approved by the user, 2026-11-12)
- reference_reads: apps/my-food-manager/docs/context/ui_standards.md, apps/my-food-manager/docs/context/ui_kit_registry.md, apps/my-food-manager/docs/context/tech_standards.md, apps/my-food-manager/docs/architecture/hl_architecture.md, apps/my-food-manager/docs/architecture/adr/
  # Read-only, for reference only: imitate my-food-manager's design language and its way of reading/writing Google Drive.
  # Never write to my-food-manager, never read its features or code, never treat its facts as facts of this project.

## Notes
- Data source: Google Drive folder `fitness` (local mirror at ~/knowledge-base/fitness), contract in fitness/_system/schema.md (exercises 1, routines 3, program 1, sessions 1).
- The `fitness-manager` skill (knowledge-base-suite) owns exercises, routines, vocabularies, program and the schema; this app writes sessions.
- Single user: Al, no logins.
