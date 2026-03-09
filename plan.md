# ConsenStat Implementation Plan

## Product Direction

- ConsenStat is an anonymous, real-time sentiment voting app for exams.
- Each exam has exactly two vote states:
  - `TOUCHING` = warm hug
  - `TOUCHY` = got wrecked
- Identity is anonymous, but each device can vote once per exam and can update its vote.

## Final Tech Stack

- Frontend: `React` + `TypeScript` + `Vite` + `shadcn/ui` + `Tailwind CSS`
- Backend/API: `Cloudflare Workers` (TypeScript, Hono router)
- Database: `Cloudflare D1` (SQLite)
- Real-time: `Cloudflare Durable Objects` with WebSocket broadcast per exam
- Bot/abuse protection: `Cloudflare Turnstile`
- Hosting/edge delivery: `Cloudflare Pages` (frontend) + Worker bindings
- Package manager/runtime tooling: `bun` + `wrangler`

## Architecture

- React app served from Cloudflare Pages.
- API requests hit a Worker (`/api/*`).
- Durable Object keyed by `examId` manages live room connections and immediate tally push.
- Worker writes authoritative vote records to D1.
- Durable Object sends updated counts to all connected clients for instant gauge/bar updates.
- Search and duplicate detection are performed in Worker against normalized D1 data.

## Data Model (D1)

- `courses`
  - `id`, `code`, `name`, `institution`
  - unique: `(institution, code)`
- `terms`
  - `id`, `name` (`Fall 2026`), `year`, `season`
  - unique: `(year, season)`
- `exams`
  - `id`, `course_id`, `term_id`, `exam_name`, `exam_name_normalized`, `exam_name_phonetic`, `created_at`
  - unique: `(course_id, term_id, exam_name_normalized)`
- `votes`
  - `id`, `exam_id`, `device_id_hash`, `vote_type` (`TOUCHING|TOUCHY`), `updated_at`
  - unique: `(exam_id, device_id_hash)` to enforce one active vote per device per exam
- `exam_stats` (materialized)
  - `exam_id`, `touching_count`, `touchy_count`, `updated_at`

## Duplicate Detection (Strong Rule Set)

- Normalize exam names (lowercase, punctuation stripped, whitespace collapsed, roman numeral normalization).
- Candidate pool:
  1. same course + same term (primary)
  2. same course across all terms (secondary)
- surface list of similar courses on input
- Behavior:
  - high score: warning modal, explicit "Create anyway".
  - low score: allow direct create.

## API Contract

- `POST /api/exams/duplicate-check`
  - input: course, term, exam_name
  - output: ranked similar exams + scores + `warn|ok`
- `POST /api/exams`
  - creates exam
- `GET /api/exams/search?q=&course=&term=&page=`
  - full-text style search + exact filters
- `GET /api/exams/:id`
  - exam metadata + tally snapshot
- `POST /api/exams/:id/vote`
  - upsert user vote by `device_id_hash`, return updated stats
- `GET /api/exams/:id/ws`
  - WebSocket upgrade for live tally stream

## Frontend (React + shadcn)

- Pages:
  - `/` Search + trending exams
  - `/exam/:id` Live gauge/bar + vote controls
  - `/create` Add exam with duplicate detection modal
- shadcn components used:
  - `Button`, `Input`, `Combobox`, `Dialog`, `Card`, `Badge`, `Toast`, `Progress`
- Visualization:
  - labels fixed to `Touching` and `Touchy`
  - live animated transitions on incoming WebSocket updates
- State management:
  - TanStack Query for API cache
  - lightweight local state for live WebSocket events merged into query cache

## Anti-Abuse + Integrity

- `device_id` persisted in httpOnly signed cookie; Worker stores only hashed value.
- Cloudflare rate limits:
  - vote endpoint: 20 req/min/IP
  - create endpoint: 5 req/10 min/IP
- Server-side validation with strict schema (`zod`) for all payloads.
- Device can only vote once per exam
