# ADR 002: Drive access through a service account

> Project: `my-food-manager`
> Status: Accepted (2026-10-28)
> Triggered by: Vision §9 (Drive is the data source, no logins, server secret acceptable, $0)

## Context
The Vercel server must read and write the `food` Drive folder without anyone signing in, and without exposing credentials to the browser.

## Options Considered
- **OAuth refresh token for Al's account.** No sharing step, but grants access to all of Al's Drive and expires/revokes in awkward ways.
- **Service account with the folder shared to its email.** Access limited to one folder, no expiry, standard free API use. Needs a one-time Google Cloud setup and sharing the folder.
- **Public "anyone with the link" folder.** Zero credentials, but read-only and exposes the data.

## Decision
Service account, with the `food` folder shared to its email as Editor. Credentials in the Vercel env var `GOOGLE_SERVICE_ACCOUNT_JSON`; folder id in `GOOGLE_DRIVE_FOLDER_ID`.

## Consequences
Defines tech_standards §1 (Other services) and §9. Files created by the service account would be owned by it, so the app only edits existing files and never creates new ones except new per-user reviews files if ever needed (to be decided then). One-time setup steps go in the project README.
