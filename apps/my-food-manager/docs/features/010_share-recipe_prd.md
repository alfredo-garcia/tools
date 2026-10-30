# PRD: Share Recipe

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; `tech_foundations` re-checked and approved 2026-10-30)
> Source feature doc: `010_share-recipe.md`
> Master doc referenced: `docs/functional-spec.md` (domains `recipes`, `profile`, `plan`; screen SCR-recipe-detail; components CMP-favorite-button, CMP-detail-layer)
> Status: Approved (2026-10-30)
> Branch: `my-food-manager/010-share-recipe`; commits start with `[my-food-manager/010]`

## 1. Summary
Adds a "Compartir" button to the recipe detail. It opens the device's share menu (Web Share API) with the recipe's title, its photo and the link to its detail; where the browser cannot share, it copies the link. It is for Al, mostly on a phone, and it appears wherever the detail is shown (Recetas, Perfil favorites, Plan) but not in the list.

## 2. Background & Context
- SCR-recipe-detail is shown full screen (small), as a modal (medium) or as a side panel (large); it is also opened over Perfil (favorites tab) and over the Plan with `overlay`. Feature `my-food-manager/009` put the favorite heart on the title row on small windows and a labeled button under the photo (in the photo's column on large) on medium and large windows (CMP-favorite-button).
- Each recipe has an address, `/recipes/<id>`, that opens the detail directly (CMP-recipe-link, FLW-open-recipe). Reads are open: no login (functional spec §6 "Access").
- Photos are served by `GET /api/photo/<id>?v=<version>` as JPEG with long cache headers (tech_standards §6); a recipe has a photo when it has `photoVersion`, otherwise the category tile is shown.
- The Web Share API is a standard browser API; no library, service or dependency is needed (tech_standards §2 is unchanged).
- Trigger: user request on 2026-10-30. Not in Product Vision §7 backlog (decided: new feature, vision unchanged).

## 3. Goals & Success Metrics
- G1: from the detail, one tap opens the share menu on a phone that supports it.
- G2: a recipe shared to a chat arrives with its title, its photo (if it has one) and a link that opens that recipe.
- G3: in a browser without a share menu, one tap puts the link in the clipboard and says so.
- Metric (manual, on a real phone and on a desktop browser): share a recipe with a photo and one without, from Recetas, from Perfil and from the Plan; check what the receiving app shows.

## 4. Non-Goals / Out of Scope
- No button in the recipe list, the plan, the pantry or the shopping list.
- No sharing of several recipes, nor of ingredients, steps or notes as text.
- No writes to Drive, no new API route, no data model change.
- No private, expiring or tracked links; no share history or counts.
- No sharing of recipes that have no address (all have one).

## 5. User Stories & Acceptance Criteria

**US-1 Share from the detail.** As Al, I want to send a recipe from its detail.
1. Given a recipe detail in any mode (full screen, modal, panel), then a "Compartir" control is visible: on small windows an icon button at the right of the title row, next to the heart; on medium and large windows a button with the share icon and the text "Compartir", beside "Añadir a favoritos"/"Quitar de favoritos" under the photo.
2. Given the detail opened from the Perfil favorites tab or over the Plan, then the same control is present.
3. Given the recipe list, Perfil rows or the Plan, then no share control is shown.
4. Given a device whose browser can share, when I tap the control, then the system share menu opens with the title, the photo (when available, see US-2) and the link to the recipe's detail.

**US-2 Photo.** As Al, I want the photo to travel with the recipe.
1. Given a recipe with a photo and a browser that can share image files, then the menu offers the photo as a file named `<recipe id>.jpg`, the title as title, and a text that holds the title and the link.
2. Given a recipe without photo, or a browser that cannot share files, or the photo cannot be loaded (offline and not cached, server error), then the menu opens without the photo, with the title and the link, and no error is shown.
3. Given a photo that takes longer than a moment to fetch, then the control shows a busy state (disabled, with `aria-busy`) until the menu opens or the attempt ends.

**US-3 Link.** As a receiver, I want the link to open the recipe.
1. Given a shared recipe, then the link is the absolute address of the detail, `<app origin>/recipes/<recipe id>`, which opens that recipe in the app.

**US-4 No share menu.** As Al on a computer, I want the button to still help.
1. Given a browser without a share menu, when I tap "Compartir", then the link is copied to the clipboard and a notice says "Enlace copiado".
2. Given the clipboard cannot be written, then a notice says "No se pudo copiar el enlace".

**US-5 Cancel and failure.** As Al, I want no noise when I change my mind.
1. Given the share menu is open, when I cancel it, then nothing changes and no notice is shown.
2. Given the menu fails to open for any other reason, then a notice says "No se pudo compartir".

## 6. Functional Requirements
1. FR-1: The detail renders a share control in the same places as the favorite control (title row on small windows, under the photo on medium and large windows, hidden/shown per detail mode as the favorite control is); it is rendered by the detail itself, so it appears in every place the detail opens.
2. FR-2: The share control has the accessible name "Compartir" followed by the recipe title in its icon-only variant, and the visible text "Compartir" in its labeled variant; touch area of at least 44 px.
3. FR-3: Sharing uses the browser's share capability when present; otherwise it copies the link.
4. FR-4: The link is `window.location.origin` + `/recipes/` + the URL-encoded recipe id.
5. FR-5: When the recipe has `photoVersion`, the app fetches `/api/photo/<id>?v=<version>` (same address the detail shows, served from the cache when cached), builds an image file `<recipe id>.jpg` of type `image/jpeg`, and includes it only if the browser reports it can share that file.
6. FR-6: The shared data is: `title` = the recipe title; with a photo, `files` = the photo and `text` = the title and the link on separate lines (no separate `url`, because some receiving apps drop the link when a file is attached); without a photo, `text` = the recipe title and `url` = the link.
7. FR-7: The share menu is opened directly from the tap's own event handler path, so the browser accepts it; the photo is fetched before the tap is consumed only if the fetch is already complete, otherwise the control prefetches the photo when the detail opens and uses it on tap (FR-8).
8. FR-8: The photo is prefetched when the detail opens (once per recipe) and held in memory; on tap, a prefetched photo is used, and one still loading is awaited briefly before sharing without it.
9. FR-9: A cancelled share (the browser reports an abort) is silent; any other failure shows "No se pudo compartir".
10. FR-10: The fallback shows a notice "Enlace copiado" when the clipboard write succeeds and "No se pudo copiar el enlace" when it fails; notices last 4 seconds, as the other notices of the app.
11. FR-11: The control writes nothing to Drive, creates no operation in the outbox and needs no write key or connection.
12. FR-12: Pure logic (building the share payload and the link) lives in `src/lib/domain` with unit tests.

## 7. Data Model / Schema Changes
Not applicable: no data is created, changed or stored. The photo is read through the existing photo route.

## 8. API / Interface Contracts
- No new or changed endpoints. The existing `GET /api/photo/<id>?v=<version>` is used as it is.
- Client contract (domain): `buildShare(recipe, origin, photo?)` returns `{ title, text, url?, files? }` as in FR-6, and `shareLink(origin, id)` returns the link of FR-4.

## 9. UI/UX Requirements
- **Control:** a share button reusing the shape language of CMP-favorite-button: icon-only (lucide `Share2`) in the title row on small windows, labeled "Compartir" on medium and large windows, in the same row as the favorite button, with a gap between them and wrapping if there is no room.
- **States:** idle; busy while the photo is being awaited (disabled, `aria-busy`); a notice (Toast) for "Enlace copiado", "No se pudo copiar el enlace" and "No se pudo compartir".
- **Copy (Spanish):** "Compartir", "Enlace copiado", "No se pudo copiar el enlace", "No se pudo compartir".
- Reuses `Toast`; extends the kit with a share button next to `FavoriteButton` (to be defined with ux-designer).

## 10. Edge Cases & Error Handling
- Recipe with no photo: shares title and link.
- Photo fails to load or is not cached while offline: shares without the photo, silently.
- Browser can share text but not files: shares without the photo.
- Browser without a share capability (most desktop browsers): copies the link.
- Insecure context (no clipboard, no share): "No se pudo copiar el enlace".
- Tapping twice quickly: the second tap is ignored while busy.
- Detail not found or still loading: no control.
- User cancels the menu: silent.
- Detail opened over the Plan or Perfil: the control works the same; the link still points to `/recipes/<id>`, not to the underlying screen.
- Recipe id with special characters: the link encodes it as the detail address does.

## 11. Non-Functional Requirements
- Performance: tapping opens the menu without a noticeable wait when the photo is prefetched; the prefetch is one request per opened recipe and uses the cache.
- Accessibility: labeled, 44 px target, busy state exposed, notices announced politely (as Toast).
- Security and privacy: the link and photo contain nothing beyond what the app already shows publicly; no personal data.
- Offline: sharing works offline for the link; the photo only if cached.

## 12. Dependencies & Existing System Touchpoints
- SCR-recipe-detail (domain `recipes`) and CMP-favorite-button / FavoriteButton placement (feature `my-food-manager/009`); CMP-detail-layer modes.
- SCR-profile (favorites tab) and SCR-plan open the same detail; no change there.
- `GET /api/photo/<id>`; `Toast`.
- No blocking dependencies.

## 13. Assumptions & Open Questions
All assumptions confirmed by the user on 2026-10-30.
- A1: The share control sits beside the favorite control in the same row (title row on small windows, under the photo on medium and large).
- A2: With a photo, the link goes inside `text` together with the title, and `url` is omitted, so receiving apps that drop `url` next to a file still show the link.
- A3: The photo is prefetched when the detail opens so the tap can open the menu at once (browsers require the share call to follow the tap closely).
- A4: The link is the app's own origin, so it works on production and on a preview; whoever receives it needs that address to be reachable.
- A5: The fallback for browsers without a share menu is copying the link only (confirmed by the user); the photo is not copied.
- Open: none blocking.

## 14. Rollout & Testing Considerations
- No flag or migration.
- Unit tests: share payload with and without a photo, link building and encoding, fallback selection.
- Manual: a real phone (share menu with photo, title and link, from Recetas, Perfil and Plan), a recipe without photo, offline, and a desktop browser (copy link).

## 15. Appendix
- Glossary: share menu = the operating system's sheet of apps to send content to; fallback = copying the link.
- References: `docs/functional-spec.md` (SCR-recipe-detail, CMP-favorite-button), tech_standards §6, feature `my-food-manager/009` PRD and UX Flow.
