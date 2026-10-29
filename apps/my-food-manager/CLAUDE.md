## Project sources of truth (SDLC)
- Project configuration: @SDLC.md
- Tech standards (stack, conventions; mandatory): @docs/context/tech_standards.md
- UI standards and kit registry: docs/context/ui_standards.md, docs/context/ui_kit_registry.md
- Product vision and MVP scope: docs/product/product_vision.md
- Feature specs: docs/features/ (`<id>_<slug>_prd.md` + `<id>_<slug>_ux_flow.md`)

Rules:
- Never introduce a language, framework, library or service not listed in tech_standards.md.
  If one seems necessary, stop and propose an ADR (tech-lead skill) instead.
- Project knowledge comes only from this repository and from what I say in this session,
  never from other projects or other conversations.
- When implementing a feature, follow its PRD and UX Flow; flag any contradiction instead of
  resolving it silently.
- Documentation (functional spec, changelog) is updated only after the feature is merged into
  the base branch, via the document-manager skill.
- Feature branches follow `branch_pattern` and feature commits start with `commit_tag` from SDLC.md
  (e.g. `my-food-manager/004-shopping-list`, `[my-food-manager/004] …`). Feature IDs repeat across projects in
  this repo, so always qualify them with the project_id.
