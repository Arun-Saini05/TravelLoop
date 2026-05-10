# AGENTS.md — Traveloop Coding Agent Briefing

> Read this file fully before writing a single line of code.
> This is the single source of truth for architecture, stack, conventions, and feature scope.

---

## 1. Project Overview

**Traveloop** is a personalized, multi-city travel planning web application built for a hackathon. It lets users dream, design, and organize trips end-to-end — from picking cities and activities, to tracking budgets, packing checklists, sharing itineraries, and writing trip journals.

The goal is a **functional, well-designed, relational-database-backed** full-stack app. Every feature must be wired to real data — no mock/hardcoded UI.

---

## 2. Tech Stack

| Layer                | Technology                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**        | [Next.js 15 (App Router)](https://nextjs.org/)                                                                                                |
| **Language**         | TypeScript throughout                                                                                                                         |
| **Database**         | PostgreSQL via **Supabase**                                                                                                                   |
| **ORM**              | Prisma (schema already finalized — do NOT modify it)                                                                                          |
| **Auth**             | [better-auth](https://better-auth.com/) (`pi.dev` compatible)                                                                                 |
| **Styling**          | Tailwind CSS + shadcn/ui                                                                                                                      |
| **AI / Agent layer** | [antigravity](https://antigravity.dev/) (used for AI-powered features like activity suggestions, budget estimation, and itinerary generation) |
| **External APIs**    | Google Places API (city + activity search, photo refs)                                                                                        |
| **File uploads**     | Supabase Storage                                                                                                                              |
| **Deployment**       | Vercel (or pi.dev hosted environment)                                                                                                         |

### Key package notes

- Prisma client is generated to `app/generated/prisma` (already set in `schema.prisma` — don't change the output path).
- Use `prisma.$transaction` for any multi-table writes.
- Never expose `passwordHash` in API responses — always `omit` it.
- Currency default is `USD`; store all money as `Decimal` (already typed in schema).

---

## 3. Database Schema — Mental Model

The schema is final. Here is a plain-English map of every model and its role:

### Core entities

| Model            | What it represents                                                        |
| ---------------- | ------------------------------------------------------------------------- |
| `User`           | Platform account. Has `role` (USER / ADMIN), soft-delete via `deletedAt`. |
| `UserPreference` | 1-to-1 with User. Language, currency, timezone, notification prefs.       |
| `Country`        | Seeded once. Used for cost multiplier data.                               |
| `City`           | Cached from Google Places on first search. Linked to Country.             |
| `Activity`       | Cached from Google Places. Typed by `ActivityType` enum. Linked to City.  |

### Trip hierarchy

```
Trip
 ├── TripMember[]       (collaborators with roles: OWNER / EDITOR / VIEWER)
 ├── TripShareLink[]    (public share URLs, expiry, visit count)
 ├── TripStop[]         (ordered city stops with dates)
 │    ├── TripStopActivity[]   (scheduled activities inside each stop)
 │    ├── TripExpense[]        (expenses scoped to a stop)
 │    └── TripNote[]           (notes scoped to a stop)
 ├── TripExpense[]      (trip-level expenses)
 ├── ChecklistCategory[]
 │    └── ChecklistItem[]
 ├── TripNote[]         (trip-level notes)
 └── CommunityPost[]    (public posts linked to this trip)
```

### Community

| Model               | What it represents                                   |
| ------------------- | ---------------------------------------------------- |
| `CommunityPost`     | Public post optionally linked to a Trip or City.     |
| `CommunityComment`  | Comment on a post.                                   |
| `CommunityReaction` | LIKE / LOVE / INSIGHTFUL per user per post (unique). |

### Admin

| Model        | What it represents                                          |
| ------------ | ----------------------------------------------------------- |
| `AdminLog`   | Audit trail of admin actions (BAN_USER, DELETE_TRIP, etc.). |
| `AppSetting` | Key-value config (maintenance mode, limits, feature flags). |

### Important enums to keep in mind

- `TripVisibility`: PRIVATE | FRIENDS | PUBLIC
- `TripStatus`: DRAFT | PLANNED | ONGOING | COMPLETED | ARCHIVED
- `ActivityType`: SIGHTSEEING | FOOD | ADVENTURE | CULTURE | NATURE | NIGHTLIFE | SHOPPING | WELLNESS | TRANSPORT | OTHER
- `ExpenseCategory`: TRANSPORT | STAY | ACTIVITIES | MEALS | DOCUMENTS | SHOPPING | MISC
- `MemberRole`: OWNER | EDITOR | VIEWER

---

## 4. Authentication — better-auth

- Use **better-auth** for all auth flows.
- Flows required: email+password signup, login, forgot password, session management.
- Protected routes via middleware — any route under `/dashboard`, `/trips`, `/admin` requires a valid session.
- `User.role === "ADMIN"` gates the Admin Analytics screen.
- After signup, auto-create `UserPreference` row with defaults in the same transaction.
- Never trust the client for `userId` — always read from the session server-side.

---

## 5. AI Features — antigravity

Antigravity powers the intelligent layer of the app. Use it for:

1. **Activity suggestions** — given a city and trip duration, suggest relevant activities from the DB or via AI generation.
2. **Budget estimation** — given stop cities, dates, and activity types, estimate costs per category (TRANSPORT, STAY, ACTIVITIES, MEALS).
3. **Itinerary generation** — given a trip name, city list, and date range, generate a day-by-day itinerary draft that populates `TripStop` and `TripStopActivity` records.
4. **Packing checklist suggestions** — given destination countries and trip duration, suggest checklist items grouped by category.
5. **Trip notes / journal assist** — optional: help users write or expand their journal notes.

Antigravity calls should be server-side only (Next.js Server Actions or Route Handlers). Never expose API keys to the client.

---

## 6. Screens & Features to Build

Build all 14 screens described below. Each screen maps to one or more DB models. Screens marked **(optional)** are bonus — build core ones first.

### Screen 1 — Login / Signup

- Email + password fields, login button, signup link, forgot password.
- better-auth handles the logic; this is just the UI + wiring.
- Redirect to Dashboard on success.

### Screen 2 — Dashboard / Home

- Welcome message with user's first name.
- List of recent trips (last 3–5, from `Trip` where `ownerId = session.userId`).
- "Plan New Trip" CTA button → Create Trip screen.
- Recommended destinations section (top cities by `popularityScore` from `City`).
- Budget highlights (sum of `totalBudget` across active trips).

### Screen 3 — Create Trip

- Form: trip name, start date, end date, description, optional cover photo upload (Supabase Storage → `coverPhotoUrl`).
- On submit: create `Trip` row + auto-create `TripMember` row with `role = OWNER`.
- Redirect to Itinerary Builder after creation.

### Screen 4 — My Trips (Trip List)

- Card list of all trips owned by or shared with the current user.
- Each card: name, date range, destination count (count of `TripStop`), status badge, cover photo.
- Actions: View, Edit (if OWNER/EDITOR), Delete (if OWNER), Duplicate ("Copy Trip" — creates a new `Trip` with `parentTripId` set).

### Screen 5 — Itinerary Builder

- "Add Stop" button → opens city search modal (Screen 7).
- Each stop shows city name, date range, list of assigned activities.
- Drag-to-reorder stops (update `sortOrder` on `TripStop`).
- Per stop: assign activities (Screen 8), set transport mode and cost.
- All mutations via Server Actions or API routes.

### Screen 6 — Itinerary View

- Read-only (or view-mode) of the full trip plan.
- Day-wise timeline grouped by city/stop.
- Each day shows activity blocks with time, duration, and estimated cost.
- Toggle between calendar view and list view.
- Shows total estimated cost pulled from `TripExpense` + `TripStop.estimatedCost`.

### Screen 7 — City Search

- Search bar that calls Google Places API and caches results in `City` table.
- Results list: city name, country, price level, photo.
- "Add to Trip" button → creates `TripStop` for the active trip.
- Filter by country/region.

### Screen 8 — Activity Search

- Search bar per stop that calls Google Places API and caches in `Activity` table.
- Filter by `ActivityType`, cost, duration.
- "Add to Stop" button → creates `TripStopActivity`.
- Quick-view card: description, photo, estimated cost, duration.

### Screen 9 — Trip Budget & Cost Breakdown

- Pull all `TripExpense` rows for the trip.
- Display: total budget vs total actual/estimated spend.
- Breakdown by `ExpenseCategory` — pie chart + bar chart (use recharts or similar).
- Average cost per day.
- Highlight over-budget categories (actual > budget).

### Screen 10 — Packing Checklist

- Per trip. Grouped by `ChecklistCategory` (Clothing, Documents, Electronics, etc.).
- Add/remove items (`ChecklistItem`), mark as packed (`isPacked`, `packedAt`).
- Bulk "reset checklist" — sets all `isPacked = false`.
- Optional: AI-suggest items via antigravity based on destinations.

### Screen 11 — Shared / Public Itinerary View

- Accessible via `TripShareLink.token` URL (e.g. `/share/[token]`).
- Read-only view of the trip itinerary.
- Shows trip name, cities, activities, dates — no costs if PRIVATE user data.
- "Copy Trip" button → duplicate the trip into the viewer's account (increment `Trip.copyCount`).
- Social sharing meta tags (og:title, og:image).

### Screen 12 — User Profile / Settings

- Editable: first name, last name, profile photo (Supabase Storage → `profilePhotoUrl`).
- `UserPreference` fields: language, currency, timezone, email notifications toggle.
- Saved destinations list (`SavedDestination` rows with linked `City`).
- Danger zone: Delete account (soft delete via `deletedAt`).

### Screen 13 — Trip Notes / Journal

- Per trip + per stop notes.
- List of `TripNote` rows sorted by `noteDate` descending.
- Add/edit/delete notes inline.
- Optional: AI-assist to expand or rewrite notes via antigravity.

### Screen 14 — Admin / Analytics Dashboard (optional)

- Gated to `User.role === "ADMIN"` only.
- Tables: all users, all trips, top cities/activities by popularity.
- Charts: trips created over time, user signups, most-copied trips.
- User management: soft-ban user (set `isActive = false`), log action in `AdminLog`.
- Read from `AppSetting` for feature flags.

---

## 7. Folder Structure (Recommended)

```
app/
  (auth)/
    login/
    signup/
    forgot-password/
  (dashboard)/
    layout.tsx          ← protected layout, checks session
    page.tsx            ← Dashboard / Home
    trips/
      page.tsx          ← My Trips list
      new/page.tsx      ← Create Trip
      [tripId]/
        page.tsx        ← Itinerary View
        builder/page.tsx
        budget/page.tsx
        checklist/page.tsx
        notes/page.tsx
  share/[token]/page.tsx ← Public itinerary view (unprotected)
  profile/page.tsx
  admin/page.tsx
  api/
    auth/[...all]/route.ts    ← better-auth handler
    cities/route.ts
    activities/route.ts
    ai/suggest/route.ts       ← antigravity endpoints

components/
  ui/                   ← shadcn components
  trips/
  itinerary/
  budget/
  checklist/
  community/
  admin/

lib/
  prisma.ts             ← singleton Prisma client
  auth.ts               ← better-auth config
  antigravity.ts        ← antigravity client setup
  google-places.ts      ← Google Places API helpers

generated/
  prisma/               ← Prisma generated client (gitignore output, not the schema)
```

---

## 8. API & Data Conventions

- **All data fetching inside Server Components** where possible. Use `async/await` directly.
- **Mutations** via Next.js Server Actions (preferred) or `/api` Route Handlers.
- **Never return `passwordHash`** in any response. Use Prisma `omit` or manual exclusion.
- **Soft deletes**: check `deletedAt IS NULL` on all user queries.
- **Pagination**: use cursor-based pagination for lists (trips, community posts). Default page size: 20.
- **Error handling**: all server actions return `{ success: boolean, error?: string, data?: T }`.
- **Optimistic UI**: use `useOptimistic` for checklist toggles and reaction buttons.

---

## 9. Google Places Integration

Cities and Activities are **cached** in the DB after first search — don't hit the Places API on every request.

Flow:

1. User types in City Search.
2. Call Google Places Text Search API.
3. For each result, upsert into `City` table using `googlePlaceId` as unique key.
4. Return the cached `City` rows to the frontend.
5. Same pattern for `Activity`.

Use `GOOGLE_PLACES_API_KEY` from env. Never expose to client — proxy through a Route Handler.

---

## 10. Environment Variables

```env
DATABASE_URL=                  # Supabase PostgreSQL connection string
DIRECT_URL=                    # Supabase direct URL (for migrations)
BETTER_AUTH_SECRET=            # Random secret for better-auth
BETTER_AUTH_URL=               # App base URL
GOOGLE_PLACES_API_KEY=         # Google Places API
NEXT_PUBLIC_SUPABASE_URL=      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key (for Storage only)
ANTIGRAVITY_API_KEY=           # Antigravity API key
```

---

## 11. Do's and Don'ts

**Do:**

- Run `npx prisma migrate dev --name init` to apply the schema — never hand-edit the DB.
- Use Prisma transactions for multi-step writes (e.g. create Trip + TripMember atomically).
- Cache Google Places results aggressively — update `popularityScore` on each add-to-trip.
- Use Supabase Storage for all file uploads (cover photos, profile photos, receipt URLs).
- Keep antigravity calls on the server only.
- Add loading skeletons for all async data fetches.
- Handle the case where a user accesses a trip they're not a member of — return 403.

**Don't:**

- Don't modify the Prisma schema — it is finalized.
- Don't hardcode any user IDs, city data, or prices.
- Don't call Google Places from the client side.
- Don't skip the `MemberRole` check — VIEWER members cannot edit trips.
- Don't allow trip deletion to orphan related data — Prisma cascade rules handle this, but test it.
- Don't expose admin routes to non-admin users — always verify `session.user.role === "ADMIN"` server-side.

---

## 12. Priority Build Order

Build in this order to always have a working demo at each stage:

1. Auth (signup/login/session)
2. Create Trip + My Trips list
3. City Search + Add Stop (Itinerary Builder)
4. Activity Search + Add Activity to Stop
5. Itinerary View (read-only)
6. Budget & Cost Breakdown
7. Packing Checklist
8. Trip Notes / Journal
9. Public Share Link
10. User Profile / Settings
11. Antigravity AI features (budget estimation, activity suggestions)
12. Community Posts
13. Admin Dashboard

---

## 13. Prisma Schema File Location

The finalized schema is at:

```
prisma/schema.prisma
```

Do not move it, do not regenerate it from scratch. Run:

```bash
npx prisma generate        # regenerate client after any schema view
npx prisma migrate dev     # apply migrations (only if schema changes — it won't)
npx prisma db seed         # seed Country data and AppSettings
```

---

_Last updated: May 2026 | Hackathon project — Odoo × Traveloop_
