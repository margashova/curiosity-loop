# Curiosity Loop

A small React + Vite app for a curiosity-style quiz and topic list, backed by Supabase. Optional automation: a Telegram bot workflow and a scheduled GitHub Action that runs `telegram-bot.js`.

## Stack

- React 18, Vite 6
- Supabase (client + optional server-side scripts)
- Optional: Anthropic API for generation scripts, Telegram for notifications

## Prerequisites

- Node.js 20+ (matches the GitHub Actions workflow)
- npm
- A Supabase project (URL + anon key for the web app; service role only for server-side scripts and CI—never expose it in the browser)

## Local development

```bash
npm install
cp .env.example .env
# Edit .env: set VITE_* and any script/bot variables you use locally.
npm run dev
```

- **Build:** `npm run build`
- **Preview production build:** `npm run preview`

## Environment variables

| Variable | Where | Purpose |
|----------|--------|--------|
| `VITE_SUPABASE_URL` | Browser (Vite) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser (Vite) | Supabase anon (public) key |
| `ANTHROPIC_API_KEY` | Scripts / CI only | Used by generation logic when you run those scripts |
| `SUPABASE_URL` | Scripts / CI | Same as project URL (non-Vite) |
| `SUPABASE_SERVICE_KEY` | Scripts / CI only | Service role key—**never** commit or expose to the client |
| `TELEGRAM_BOT_TOKEN` | Scripts / CI | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Scripts / CI | Target chat for messages |
| `QUIZ_URL` | Scripts / CI | Public URL of the deployed app (e.g. for links in messages) |

`.env` is gitignored. Use `.env.example` as a template.

## GitHub Actions: daily workflow

Workflow: `.github/workflows/daily-fact.yml` (scheduled + manual `workflow_dispatch`).

Configure these **repository secrets** (Settings → Secrets and variables → Actions):

- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `QUIZ_URL`

## Deploying the web app (overview)

1. Connect the repo to your host (e.g. Vercel, Netlify, Cloudflare Pages) or build `npm run build` and serve the `dist/` folder as static assets.
2. Set **build command** `npm run build` and **output directory** `dist` (or your host’s equivalent).
3. Add **environment variables** for production: at minimum `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. After the first deploy, set `QUIZ_URL` (and any Telegram secrets) to match the live URL.

## Release & deploy checklist

Use this before tagging a release or promoting a deploy to production.

- [ ] `npm run build` succeeds locally; `npm run preview` smoke-test passes.
- [ ] No secrets in committed files (`.env` stays local; service role never in `VITE_*`).
- [ ] Production env vars on the host match `.env.example` names and real values.
- [ ] Supabase RLS/policies reviewed for anything new in this release.
- [ ] If using the daily Action: required repo secrets present; run **Actions → Daily Fact → Run workflow** once to verify.
- [ ] `QUIZ_URL` and Telegram settings point at the intended environment (staging vs production).
- [ ] After deploy: open the live site, run through Quiz and Topics flows.

## License

Private project; no license file included unless you add one.
