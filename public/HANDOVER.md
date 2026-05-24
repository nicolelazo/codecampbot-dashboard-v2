# CodeCamp HQ — Developer Handover

This document covers everything you need to understand, run, and continue developing CodeCamp HQ.

---

## 1. Project Overview

**CodeCamp HQ** (`suicodecamp`) is an internal operations dashboard for managing the **Sui × DEVCON "Build Beyond DEVCON"** initiative — a multi-city coding bootcamp campaign across the Philippines.

**What it does:**
- Tracks event chapters (Manila, Iloilo, etc.) with status, dates, venue, and lead info
- Manages per-chapter checklists, tasks, and progress
- Displays and edits KPIs, risks, merchandise, contacts, and resource links
- Runs a Telegram bot that delivers AI-generated Daily Standup Updates (DSUs) to a designated group chat

**Who uses it:** DEVCON partnership coordinators and Sui Foundation stakeholders. Single admin access only.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS v4 + inline React styles |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — password login, single admin |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5`) |
| Bot | Telegram Bot API (webhook-based) |
| Hosting | Vercel (Singapore `sin1` region) |

> **Important:** This uses **Next.js 16**, which has breaking API changes from Next.js 13/14/15. Before touching routing, layout, or data fetching patterns, read the relevant guide in `node_modules/next/dist/docs/`.

---

## 3. Prerequisites & Local Setup

### Requirements
- Node.js 18+
- A Supabase project (free tier works)
- A Telegram bot token (via [@BotFather](https://t.me/BotFather))
- An Anthropic API key

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd codecampbot
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Fill in all values (see Section 4)

# 3. Bootstrap the database
# - Go to your Supabase project → SQL Editor
# - Paste the full contents of supabase/schema.sql and run it
# - This creates all tables, indexes, and RLS policies

# 4. Start the dev server
npm run dev
# App runs at http://localhost:3000

# 5. Log in
# Navigate to /auth/login
# Enter the admin password for the configured Supabase account
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 4. Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase — get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # Safe to expose in browser
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # Secret — server-side only, bypasses RLS

# Telegram — get from @BotFather
TELEGRAM_BOT_TOKEN=12345:ABC...
TELEGRAM_CHAT_ID=-521543XXXX               # Group chat ID for DSU messages

# Anthropic — for AI status summaries in DSU
ANTHROPIC_API_KEY=sk-ant-api03-...
```

`NEXT_PUBLIC_*` vars are embedded in the client bundle. All others are server-only.

---

## 5. Database

**Platform:** Supabase (PostgreSQL). No ORM — raw Supabase JS client queries.

**Schema file:** [`supabase/schema.sql`](supabase/schema.sql) — run this manually in the Supabase SQL Editor to set up a fresh project.

### Tables

| Table | Purpose |
|-------|---------|
| `chapters` | Chapter metadata: city, venue, lead, dates, status, pax targets, merch status, progress |
| `chapter_tasks` | Per-chapter task checklist items with owner, description, and status |
| `kpis` | Editable KPI metrics with label, value, and color |
| `risks` | Risk register with severity (`high`/`medium`/`low`) and open/resolved status |
| `contacts` | Team directory: Sui Foundation, chapter leads, content team |
| `merch_items` | Merchandise inventory by category (jcr/lazada/shopee) and distribution status |
| `resource_links` | Categorized links with icon and description |
| `bot_settings` | Key-value config store (Telegram token, chat ID, auto_standup toggle) |

**RLS policies:**
- All tables: public read, authenticated write (insert/update/delete)
- `bot_settings`: anon + authenticated full access
- Server-side API routes use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS entirely

### Adding Migrations

There is no migration framework. To change the schema:
1. Write your SQL
2. Run it in the Supabase SQL Editor
3. Append it to `supabase/schema.sql` for future reference

---

## 6. Project Structure

```
codecampbot/
├── app/
│   ├── api/
│   │   ├── auth/login/          # POST — password login
│   │   ├── chapters/            # PATCH — update chapter fields
│   │   ├── chapter-checklist/   # GET/PATCH — checklist template overrides
│   │   ├── chapter-tasks/       # GET/POST/PATCH/DELETE — task CRUD
│   │   ├── contacts/            # GET/POST/DELETE — contacts CRUD
│   │   ├── cron/dsu/            # POST — trigger daily standup (called by cron)
│   │   ├── kpis/                # GET/POST/PATCH/DELETE — KPI CRUD
│   │   ├── merch-items/         # GET/POST/DELETE — merch CRUD
│   │   ├── resource-links/      # GET/POST/DELETE — links CRUD
│   │   ├── risks/               # GET/POST/PATCH/DELETE — risks CRUD
│   │   ├── settings/            # GET/PATCH — generic settings
│   │   ├── settings/dsu/        # GET/PATCH — DSU-specific settings
│   │   └── telegram/            # POST — Telegram webhook handler
│   ├── auth/
│   │   ├── callback/            # Supabase auth callback
│   │   └── login/               # Login page
│   ├── chapters/[id]/           # Chapter detail page
│   ├── dashboard/               # Main dashboard page
│   ├── login/                   # Redirect → /auth/login
│   ├── layout.tsx               # Root layout (font, metadata)
│   ├── page.tsx                 # Root → redirects to /dashboard
│   └── globals.css              # Global styles + Tailwind imports
│
├── components/
│   ├── Dashboard.tsx            # Main orchestrator — all tabs, state, data fetch
│   ├── panels/                  # One component per dashboard tab
│   │   ├── ChaptersPanel.tsx
│   │   ├── ChapterDetailPanel.tsx
│   │   ├── ContactsPanel.tsx
│   │   ├── ContentPanel.tsx
│   │   ├── DsuPanel.tsx
│   │   ├── KpiPanel.tsx
│   │   ├── LinksPanel.tsx
│   │   ├── MerchPanel.tsx
│   │   ├── MilestonesPanel.tsx
│   │   ├── RisksPanel.tsx
│   │   └── SettingsPanel.tsx
│   └── ui/                      # Reusable primitives
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── ConfirmDialog.tsx
│       ├── FormField.tsx
│       ├── KpiTile.tsx
│       ├── PanelHeader.tsx
│       ├── ProgressBar.tsx
│       ├── SectionTitle.tsx
│       └── SlideOver.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── admin.ts             # Service-role client (server only)
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # RSC server client
│   │   └── queries.ts           # All data-fetching functions
│   ├── telegram/
│   │   ├── bot.ts               # Bot webhook handler, DSU builder, Claude calls
│   │   └── dsu.ts               # DSU message formatting
│   ├── checklist-data.ts        # Hardcoded checklist template (T-35 → T+7)
│   ├── data.ts                  # Static data: PAX_ROWS, MILESTONE_ROWS
│   ├── types.ts                 # All TypeScript interfaces
│   └── utils.ts                 # liveCountdown() helper
│
├── supabase/
│   └── schema.sql               # Full database schema — run to bootstrap DB
│
├── middleware.ts                # Auth guard for all routes except /auth/*
├── vercel.json                  # Vercel deployment config
├── next.config.ts               # Minimal Next.js config
├── tsconfig.json                # TypeScript config (strict, @/* alias)
└── postcss.config.mjs           # Tailwind CSS v4 PostCSS config
```

---

## 7. Authentication

Single admin user only — no multi-user support.

**Admin email:** `ctambis@devcon.ph` (hardcoded in `/app/api/auth/login/route.ts`)

**Flow:**
1. All routes are protected by `middleware.ts` — unauthenticated requests redirect to `/auth/login`
2. User submits password on `/auth/login`
3. `POST /api/auth/login` validates credentials via Supabase Auth
4. On success: Supabase sets a session cookie
5. Middleware reads the cookie on subsequent requests to verify the session

**To change the admin password:** update it directly in Supabase Dashboard → Authentication → Users.

---

## 8. Key Features

### Dashboard Panels (tabs)

| Tab | Panel | What it does |
|-----|-------|-------------|
| Overview | inline in Dashboard.tsx | Chapter summary cards, active risks, KPI snapshot |
| KPI | KpiPanel | Edit KPI metrics with labels and color coding |
| Milestones | MilestonesPanel | Campaign timeline checklist across all chapters |
| Chapters | ChaptersPanel | Chapter list with status, dates, and progress |
| Chapter Detail | ChapterDetailPanel | Per-chapter tasks, checklist, and metadata editor |
| Risks | RisksPanel | Risk register with severity and open/resolved toggle |
| Merch | MerchPanel | Merchandise tracking by category |
| Links | LinksPanel | Resource link catalog with icons |
| Contacts | ContactsPanel | Team directory filtered by role group |
| Content | ContentPanel | Content team coordination (in progress) |
| Settings | SettingsPanel | Bot config: Telegram token, chat ID, auto-standup toggle |

### Telegram Bot

- Webhook endpoint: `POST /api/telegram`
- Register webhook with: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/telegram`
- Handles commands for chapter status, task updates, and DSU delivery
- Uses inline keyboards for interactive navigation

### Daily Standup Update (DSU)

- Triggered by: `GET /api/cron/dsu`
- Builds a chapter-by-chapter status summary
- Uses Claude Haiku to generate 1-sentence AI summaries per chapter
- Sends the formatted message to the configured Telegram group chat
- Can also be triggered manually from the Settings panel in the dashboard

### AI Integration

- File: `lib/telegram/bot.ts` → `generateChapterStatusSummary()`
- Model: `claude-haiku-4-5`, max 60 tokens
- Purpose: 20-word status blurb per chapter for the DSU message
- Falls back to static text if the API call fails

### Checklist Template System

- Defined in `lib/checklist-data.ts` — hardcoded per-chapter checklist from T-35 days to T+7
- Statuses: `done`, `executed`, `overdue`, `in_progress`, `upcoming`, `pending`, `confirm`
- Individual item status overrides are stored in `bot_settings` table via the `chapter-checklist` API

---

## 9. API Routes Reference

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/auth/login` | POST | Password auth |
| `/api/chapters` | PATCH | Update chapter fields |
| `/api/chapter-tasks` | GET, POST, PATCH, DELETE | Chapter task CRUD |
| `/api/chapter-checklist` | GET, PATCH | Checklist template overrides |
| `/api/contacts` | GET, POST, DELETE | Contact CRUD |
| `/api/kpis` | GET, POST, PATCH, DELETE | KPI CRUD |
| `/api/risks` | GET, POST, PATCH, DELETE | Risk CRUD |
| `/api/merch-items` | GET, POST, DELETE | Merch CRUD |
| `/api/resource-links` | GET, POST, DELETE | Link CRUD |
| `/api/settings` | GET, PATCH | Generic key-value settings |
| `/api/settings/dsu` | GET, PATCH | DSU-specific settings |
| `/api/cron/dsu` | GET | Trigger DSU (cron job) |
| `/api/telegram` | POST | Telegram webhook |

All write endpoints use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.

---

## 10. Deployment

**Platform:** Vercel. Config in `vercel.json`.

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["sin1"]
}
```

**Deploy steps:**
1. Push to `main` — Vercel auto-deploys via Git integration
2. Set all environment variables in Vercel Dashboard → Project → Settings → Environment Variables

**Cron job setup:**
- Use an external cron service (e.g., EasyCron, cron-job.org, or Vercel Cron)
- Call `GET https://<your-domain>/api/cron/dsu` daily at your desired time

**Telegram webhook registration** (do once after deploying):
```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-domain>/api/telegram
```

---

## 11. Data Models

Defined in [`lib/types.ts`](lib/types.ts):

```ts
ChapterStatus = 'completed' | 'rescheduling' | 'in_progress' | 'activating' | 'pencil_booked' | 'tbc'
TaskStatus    = 'pending' | 'done' | 'urgent'
RiskSeverity  = 'high' | 'medium' | 'low'

Chapter       { id, number, name, city, region, venue, lead_name, date_text, date_iso,
                status, pax_target, pax_actual, merch_status, progress_percent,
                countdown_text, todos: ChapterTask[] }
ChapterTask   { id, short_id, chapter_id, owner, description, status }
Kpi           { id, key, label, sublabel, value, color }
Risk          { id, code, title, description, owner, chapter_tag, severity, status }
Contact       { id, name, role, handle, team, chapter_number, emoji, note }
MerchItem     { id, name, quantity, distribution, status, category }
ResourceLink  { id, name, description, url, icon, icon_color, category }
```

---

## 12. State Management & Patterns

- **No state management library** — plain `useState` / `useEffect` throughout
- `Dashboard.tsx` is the single top-level client component; it owns all data state and passes it down to panels as props
- All mutations go through the REST API routes, which return updated data; the UI then refreshes state locally
- No real-time subscriptions — data updates on user action or page reload
- Design tokens (colors, spacing) are defined as a `const C = {}` object at the top of `Dashboard.tsx`

---

## 13. Known Limitations & Tech Debt

- **No tests** — zero test coverage. Adding Vitest + React Testing Library is recommended.
- **`Dashboard.tsx` is large** (~4600 lines). It works, but splitting into smaller modules would improve maintainability.
- **No error boundaries** — unhandled render errors will crash the full dashboard.
- **Single admin user** — auth is not designed for multi-user access. Expanding this requires Supabase RLS updates and a user profile system.
- **No migration framework** — schema changes are manual. Consider adding Supabase migrations CLI.
- **Hardcoded admin email** — `ctambis@devcon.ph` is hardcoded in the login API route. Move to an env var if the admin changes.
- **Checklist template is static** — `checklist-data.ts` needs a code change to update the template structure. Individual item status overrides exist, but the template itself is not database-driven.

---

## 14. Contacts & Ownership

| Role | Name | Contact |
|------|------|---------|
| Builder / Current Owner | Dale Tambis | plusmemberplatform@devcon.ph |
| Admin Account | ctambis@devcon.ph | Supabase Auth (password) |
| Sui Foundation | — | See Contacts panel in dashboard |

**Repository:** Check `git remote -v` for the current remote URL.
