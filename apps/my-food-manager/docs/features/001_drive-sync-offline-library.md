# Drive Sync & Offline Library

> Project: `my-food-manager`
> MVP: yes (Product Vision §5/§7). Backlog item: #1, narrowed to read-only.

* **Feature Name:** Drive Sync & Offline Library.

* **Goal:** Whenever Al or his partner opens the app, they see their whole recipe library at once, even with no signal, and new recipes added through Claude or Telegram show up without any manual step. Success: with the phone in airplane mode, every previously synced recipe, with its ingredient and pantry data, is visible. A recipe added to Drive appears within a few minutes.

* **The Delta:** Today there is no app. The recipe library exists only as files in the Drive folder, readable only by asking Claude or opening files by hand. This feature creates the app's only data path: the library moves from Drive into the app and stays available offline.

* **User Persona:** Al (primary) and his household partner, on phone or desktop, often in places with poor signal such as the supermarket.

* **Core Mechanics (High Level):**
  - On first open on a new device, the app loads the full library from Drive, shows progress, and needs no setup or key to read.
  - After the first sync, it always shows the stored copy instantly, then refreshes from Drive in the background on every open.
  - While the app is open, it also refreshes in the background every few minutes. A pull-to-refresh gesture forces a sync.
  - A visible status shows "last synced" time, and an offline badge appears when there is no connection. If a sync fails, the stored copy keeps working and the failure is visible but not blocking.
  - Recipe photos are stored on the device once seen, so they stay available offline. Recipes without a photo use the category fallback tile.
  - The library covers recipes, ingredients, pantry contents, each person's reviews, and the category, tag and family vocabularies.
  - The app can be installed to the phone's home screen and opens offline.

* **Constraints / Out of Scope:**
  - **Read-only.** The app writes nothing to Drive in this feature, so there is no write key and no change queue yet. Those arrive with the pantry and reviews features.
  - No browsing UI beyond a minimal proof (a plain list of recipes with sync status). The grid, filters and search belong to backlog #2.
  - No editing or deleting of recipes or ingredients, ever, from the app.
  - No "download all photos" mode, and no photo resizing or processing.
  - No login or user accounts. Nothing is stored on a server besides what Vercel and Drive already hold.
  - Do not build a database, a separate backend, or real-time sync. The refresh is periodic.
  - Do not touch the food-manager skill's files or change the Drive folder structure.
