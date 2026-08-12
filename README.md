# ConsenStat

Anonymous, real-time exam sentiment voting for University of Waterloo students.

Users can search exams, create new ones with duplicate detection, and vote on whether an exam was `TOUCHING` or `TOUCHY`. Tallies are stored in D1 and pushed live over Durable Object WebSockets.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Cloudflare Workers with Hono
- Data: Cloudflare D1
- Real-time: Cloudflare Durable Objects + WebSockets
- Tooling: pnpm, Wrangler

## Features

- Search recent or matching exams
- Create new exam entries by faculty, course number, term, and exam name
- Duplicate detection before exam creation
- One vote per browser per exam, with vote updates allowed
- Live tally updates on exam pages
- Anonymous vote tracking via signed httpOnly cookie + hashed device ID

## Repo Layout

```text
src/client/        React app
src/worker/        Cloudflare Worker, API routes, Durable Object logic
migrations/        D1 schema
public/            Static assets
wrangler.toml      Worker, D1, Durable Object, and asset bindings
```

## Scripts

- `pnpm dev` - start the Vite frontend on port `5173`
- `pnpm build` - build the frontend into `dist/`
- `pnpm check` - run TypeScript type-checking
- `pnpm worker:types` - regenerate Wrangler environment types
- `pnpm deploy` - deploy the Worker and static assets with Wrangler

## Local Development

1. Install dependencies:

```bash
pnpm install
```

1. Type-check the project:

```bash
pnpm check
```

1. Build the frontend bundle:

```bash
pnpm build
```

### Running the full stack locally

`pnpm dev` starts the Vite frontend only. There is no Vite proxy, so `/api/*`
and the WebSocket tally feed return 404 there. To exercise the real backend,
run the Worker with Wrangler, which serves the API, D1, the Durable Object, and
the built assets from `dist/` on one origin:

```bash
echo "COOKIE_SECRET=$(openssl rand -hex 32)" > .dev.vars
pnpm exec wrangler d1 migrations apply consenstat --local
pnpm build
pnpm exec wrangler dev
```

The app is then at `http://localhost:8787`. Wrangler serves the prebuilt
`dist/`, so re-run `pnpm build` after frontend changes; it does not pick up
new `.dev.vars` values without a restart.

### Important local setup notes

- The app expects a Cloudflare D1 database bound as `DB`.
- The Worker expects a `COOKIE_SECRET` secret binding. It is unset by default
  locally, and voting fails with a zero-length HMAC key error until you create
  `.dev.vars` as shown above. `.dev.vars` is gitignored.
- The Durable Object binding is `EXAM_ROOMS`.
- The SQL schema lives in [migrations/0001_initial.sql](migrations/0001_initial.sql).
- Local D1 state lives in `.wrangler/state/v3/d1`; delete it to reset.

## Runtime Architecture

- `src/client/main.tsx` mounts a `HashRouter` app with three routes:
  - `/` recent exams and search
  - `/create` exam creation flow
  - `/exam/:id` live results and voting
- `src/worker/index.ts` serves the API under `/api/*` and falls through to static assets for everything else.
- `src/worker/room.ts` keeps the latest tally snapshot per exam room and broadcasts updates to connected WebSocket clients.
- Votes are stored in `votes`, while `exam_stats` maintains the aggregate counters used by the UI.

## Data Model

Defined in [migrations/0001_initial.sql](migrations/0001_initial.sql):

- `courses`
- `terms`
- `exams`
- `votes`
- `exam_stats`

## Deployment Notes

- Worker entrypoint: [src/worker/index.ts](src/worker/index.ts)
- Static asset directory: `dist`
- Wrangler config: [wrangler.toml](wrangler.toml)
- Before deploy, make sure the D1 database exists, the schema has been applied, and `COOKIE_SECRET` has been set in Wrangler.

## Current Scope

Implemented now:

- exam creation
- duplicate checking
- search and recent listings
- anonymous voting
- live tally updates
