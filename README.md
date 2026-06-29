# NIAT SPI — Skill Performance Index Platform

Full‑stack platform for NIAT attendance, eligibility and (soon) the Skill Performance Index.
**Next.js 14 (App Router) · MongoDB (Mongoose) · Google BigQuery (live) · Tailwind · Vercel (Mumbai `bom1`).**

## What it does

- **Public student SPI report** — `/spi/<studentUserId>`, no login. Live from BigQuery. Donut, standing,
  recovery banner, course‑wise attendance + per‑session drilldown. Quiz/assessment/SPI sections show
  **“Coming soon”** until those feeds land.
- **Staff console** — 6 roles, one‑time login that stays valid for **30 days** (httpOnly JWT cookie).
  - **Super Admin** – full CRUD over everyone + all data.
  - **Admin** – manages HODs / Capability Managers / BOAs / Instructors across all campuses + student pages.
  - **HOD** – read‑only, all campuses.
  - **Capability Manager** – read‑only, assigned campuses + subjects.
  - **BOA** – read‑only, assigned campus.
  - **Instructor** – read‑only, own campus + subject.
  - Only **Super Admin & Admin** can create/update/delete.
- **Live dashboards** — campus / subject / section rollups + student lists, all **scoped server‑side**
  to the signed‑in role (BigQuery `WHERE` filters from the session).
- **Nightly safety sync** — Vercel Cron at **02:00 IST** snapshots BigQuery attendance into MongoDB
  (`StudentSnapshot`) as a fallback/backup.

## Data sources (by design)

| Data | Source |
|------|--------|
| Student SPI page, all staff dashboards | **BigQuery, live** (`asia-south1`) |
| Users, roles, campus/subject assignments | **MongoDB** |
| Nightly attendance backup | **MongoDB** (`StudentSnapshot`, written by the 2 AM cron) |

BigQuery table: `kossip-helpers.niat_post_onboarding_engagement_ai_analytics_workspace.z_niat_student_session_wise_attendance_details`

## Local setup

```bash
npm install
node scripts/genenv.cjs   # writes .env.local from the service-account JSON (one-off)
npm run seed              # creates sample staff users + campuses in MongoDB
npm run sync              # initial BigQuery -> MongoDB snapshot (optional)
npm run dev               # http://localhost:3000
```

### Environment variables (`.env.local`, also set these in Vercel)

| Var | Notes |
|-----|-------|
| `MONGODB_URI` | Atlas, **Mumbai `ap-south-1`** to match Vercel `bom1` |
| `BIGQUERY_SERVICE_ACCOUNT_JSON` | Full service-account JSON on **one line, single-quoted** |
| `BQ_PROJECT_ID` | `kossip-helpers` |
| `BQ_LOCATION` | `asia-south1` |
| `JWT_SECRET` | long random string (30-day session signing) |
| `CRON_SECRET` | protects `/api/cron/sync`; Vercel sends it as `Authorization: Bearer …` |
| `NEXT_PUBLIC_APP_URL` | deployed URL |

## Sample accounts (after `npm run seed`)

Password for all: **`Niat@2026`** · 3 users per role.

| Role | Example email |
|------|---------------|
| Super Admin | `superadmin1@nxtwave.co.in` |
| Admin | `admin1@nxtwave.co.in` |
| HOD | `hod1@nxtwave.co.in` |
| Capability Manager | `cm1@nxtwave.co.in` |
| BOA | `boa1@nxtwave.co.in` |
| Instructor | `instructor1@nxtwave.co.in` |

## Deploy to Vercel

1. Push to Git, import the repo in Vercel.
2. **Settings → Functions → Region:** `bom1` (already pinned in `vercel.json`).
3. Add all env vars above (Production + Preview).
4. Deploy. `vercel.json` registers the **02:00 IST** cron (`30 20 * * *` UTC) → `/api/cron/sync`.
5. After first deploy, optionally trigger one sync:
   `curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/sync`

> The Vercel **Hobby** plan allows only 1 region and limits cron to once/day — both fit. Cron `maxDuration`
> is set to 300s; on Hobby that is capped lower, but the sync completes in ~7s for ~1,900 students.

## Project map

```
app/
  spi/[studentId]/        public live SPI report
  login/                  one-time staff login (30-day cookie)
  dashboard/              overview · students · campuses (scoped per role)
  admin/                  users · campuses CRUD (superadmin/admin only)
  api/
    attendance/           live BigQuery student endpoints (public)
    dashboard/            scoped campus/subject/section/student rollups
    auth/                 login · logout · me
    admin/                users · campuses · meta (CRUD, guarded)
    cron/sync/            nightly BigQuery -> MongoDB
lib/        bigquery · queries · auth · rbac · mongodb · sync · constants · cache
models/     User · Campus · StudentSnapshot
scripts/    seed · sync · genenv (env loader for tsx scripts)
middleware.ts  protects /dashboard and /admin
```

## Coming next (2 days out)

Classroom Quizzes, Module Quizzes, Skill Assessments and the Final Skill Assessment land in BigQuery.
The SPI section on the student page and score columns on dashboards are already designed as placeholders —
wire the new feeds into `lib/queries.ts` + `lib/sync.ts` and replace the “Coming soon” blocks.
