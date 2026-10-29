# My Food Manager

Personal recipe, pantry and shopping-list app. Mobile-first PWA that reads your Google Drive `food` folder and works offline.

- Product: [docs/product/product_vision.md](docs/product/product_vision.md)
- Tech: [docs/context/tech_standards.md](docs/context/tech_standards.md), [docs/architecture/hl_architecture.md](docs/architecture/hl_architecture.md)
- Design: [docs/context/ui_standards.md](docs/context/ui_standards.md), [prototypes/style-guide.html](prototypes/style-guide.html)
- Features: [docs/features/](docs/features/)

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run dev                  # http://localhost:3000
```

The service worker (offline shell) only runs in a production build:

```bash
npm run build && npm start
```

Checks before merging: `npm run lint`, `npm run typecheck`, `npm test`.

### Without Google Drive (development only)

Point the app at a local copy of the folder (for example the synced `~/knowledge-base/food`) instead of Drive:

```bash
echo "LOCAL_FOOD_DIR=$HOME/knowledge-base/food" > .env.local
```

This is ignored on Vercel (`VERCEL` is set there), so production always reads Drive.

## Connect Google Drive (one-time, ~10 minutes)

The server reads the folder with a Google *service account*: a robot identity that only sees what you share with it.

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project (for example `my-food-manager`).
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **IAM & Admin → Service Accounts → Create service account** (name `my-food-manager-reader`, no roles needed).
4. Open it → **Keys → Add key → Create new key → JSON**. A `.json` file downloads.
5. In Google Drive, share the `food` folder with the service account's email (`…@….iam.gserviceaccount.com`) as **Viewer**. This feature only reads. Later features that write will need **Editor**.
6. Copy the folder id: open the `food` folder, the id is the last part of the URL (`drive.google.com/drive/folders/<ID>`).
7. Set the two environment variables, locally in `.env.local` and on Vercel (below):
   - `GOOGLE_DRIVE_FOLDER_ID` = the folder id.
   - `GOOGLE_SERVICE_ACCOUNT_JSON` = the whole JSON file on a single line (for example `jq -c . key.json`).

Never commit the key file or `.env.local` (both are gitignored by default; keep the key file outside the repo).

## Deploy to Vercel (free Hobby plan)

1. Import the Git repository in Vercel.
2. **Root Directory:** `apps/my-food-manager` (the app lives inside the `tools` monorepo).
3. Framework preset: Next.js. The build command comes from `package.json` (`next build --webpack`).
4. Add the two environment variables for **Production** (and **Preview** if you want branch previews).
5. Deploy. Open the URL on your phone and use **Add to Home Screen**.

## How it works (feature my-food-manager/001)

- `GET /api/snapshot` lists the Drive folder, returns `304` when nothing changed (ETag from file ids and modified times), and otherwise builds one JSON library (recipes, ingredients, pantry, reviews, vocabularies, people).
- The browser stores that snapshot in IndexedDB, renders it first, then refreshes on open, every 5 minutes while visible, on reconnect, and on pull-to-refresh / the refresh button.
- `GET /api/photo/<recipe-id>` proxies the Drive photo; the service worker keeps up to 200 viewed photos.
- Read-only: nothing is written to Drive.
