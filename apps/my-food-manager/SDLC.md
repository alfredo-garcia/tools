# SDLC — My Food Manager

> Configuration read by the SDLC skills (product-manager, tech-lead, ux-designer,
> document-manager) at the start of every run. Belongs to this project only. Never copy
> it into another project; run Project Init there instead.

## Project
- project_id: my-food-manager
- type: app
- name: My Food Manager
- docs_language: en                 # recipe content and UI copy stay in Spanish (knowledge-base schema)
- platforms: web                    # responsive, mobile-first PWA

## Paths
- docs_root: docs
- features_root: docs/features
- web_app: .
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
- product_vision: approved (2026-10-28)
- tech_foundations: approved (2026-10-28)
- ui_foundations: approved (2026-10-28)

## Notes
- Data source: Google Drive folder `food` (local mirror at ~/knowledge-base/food), contract in food/_system/schema.md (recipes schema 3, ingredients, pantry, per-user reviews).
- Users: Al + household, no logins.
