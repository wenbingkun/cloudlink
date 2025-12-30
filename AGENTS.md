# Repository Guidelines

## Project Structure & Module Organization

- `src/`: Cloudflare Worker logic (request routing, upload/download, admin, rate limiting).
- `public/`: Static assets served by the Worker (`index.html`, `js/app.js`, `css/styles.css`, `assets/favicon.svg`).
- `wrangler.toml`: Worker configuration and runtime variables.
- `README.md` / `SETUP.md`: setup steps and environment configuration details.

## Build, Test, and Development Commands

- `npm install`: install local dev dependencies.
- `npm run dev`: start a local Worker via Wrangler at `http://localhost:8787`.
- `npm run deploy` or `npm run publish`: deploy to Cloudflare Workers.
- `wrangler tail`: stream live logs from the deployed Worker.

## Coding Style & Naming Conventions

- Indentation: 2 spaces, ES modules (`import/export`) with semicolons.
- Filenames: kebab-case for modules (e.g., `upload-handler.js`).
- Keep handler modules single-responsibility (upload, download, admin, auth).
- No formatter configured; keep changes consistent with surrounding style.

## Testing Guidelines

- No automated test suite is currently configured in `package.json`.
- If adding tests, place them under a `tests/` directory and document the runner in `README.md`.
- Manual verification: run `npm run dev` and exercise `/`, `/upload`, `/admin`, and `/d/:fileId`.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits style seen in history: `fix: ...`, `chore: ...`, `fix(ui): ...`.
- PRs should include a concise summary, test steps (or “not tested”), and any config changes (`wrangler.toml`, secrets).

## Security & Configuration Tips

- Set secrets via Wrangler (`wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL`, `wrangler secret put GOOGLE_PRIVATE_KEY`).
- Avoid committing credentials; use `wrangler.toml` only for non-secret vars like `DRIVE_FOLDER_ID`.
- Change default passwords (`UPLOAD_PASSWORD`, `ADMIN_PASSWORD`) before deployment.
