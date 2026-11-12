## Project sources of truth (SDLC)
- Project configuration: @SDLC.md
- Tech standards (stack, conventions; mandatory): @docs/context/tech_standards.md
- Architecture and ADRs: docs/architecture/hl_architecture.md, docs/architecture/adr/
- Product vision and MVP scope: docs/product/product_vision.md
- Feature specs: docs/features/ (`<id>_<slug>_prd.md` + `<id>_<slug>_ux_flow.md`)
- Data contract: Google Drive folder `fitness` (local mirror ~/knowledge-base/fitness), `fitness/_system/schema.md`
- Reference only (read-only, see "Isolation exception" in SDLC.md): my-food-manager's ui_standards, ui_kit_registry, tech_standards, hl_architecture and ADRs. Never write to it, never read its code or features.

Rules:
- Never introduce a language, framework, library or service not listed in tech_standards.md.
  If one seems necessary, stop and propose an ADR (tech-lead skill) instead.
- Project knowledge comes only from this repository and from what I say in this session,
  never from other projects or other conversations.
- When implementing a feature, follow its PRD and UX Flow; flag any contradiction instead of
  resolving it silently.
- Build features through their implementation plan (docs/features/<id>_<slug>_impl_plan.md):
  one task, one small PR, linked to its FR/ACs and tests. If a spec is ambiguous or contradicts
  itself, stop and say so; never resolve it in code.
- Code is never approved by the session or agent that wrote it; every PR is reviewed by the
  project's pr-reviewer subagent against the PRD, UX Flow, test plan and the review-only rules in
  tech_standards §17. High-risk PRs (personal/health data, infrastructure/secrets, changes to the
  standards, checks or CI) are never merged without my explicit approval.
- Never silence, bypass or weaken an automated check from the Enforcement Map
  (tech_standards §17). Never add a dependency that isn't in the approved lists.
- Tests define done. A feature is done only when its acceptance tests pass.
- Never delete, skip or weaken a failing test to make it pass, without my explicit approval.
  A bug fix starts with a test that reproduces the bug.
- Never implement UI for a feature without an approved UX Flow (docs/features/<id>_<slug>_ux_flow.md),
  unless its PRD header says `Prototype: exempt (date): reason`. If neither exists, stop and say so.
- UI uses only components in docs/context/ui_kit_registry.md and the `Tmp` components listed in the
  feature's UX Flow. Never create any other new component silently: announce it first.
  docs/context/ui_standards.md is the source of truth for visual decisions.
- The app writes to Drive only what tech_standards §9 allows (append completed sessions to
  `sessions/al.yaml`). Never write exercises, routines, program or vocabularies.
- Never log or put in URLs any health data (program, constraints, notes).
- Documentation (functional spec, changelog) is updated only after the feature is merged into
  the base branch, via the document-manager skill.
- Feature branches follow `branch_pattern` and feature commits start with `commit_tag` from SDLC.md
  (e.g. `fitness-coach/001-offline-data`, `[fitness-coach/001] …`). Always qualify Feature IDs
  with the project_id.
