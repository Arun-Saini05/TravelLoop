# Current User Trips Page Plan

## Context
- Build a polished **Current User Trips** experience for logged-in users, using real trip data from our Prisma/Postgres schema.
- Current app state: auth is implemented (`/login`, `/signup`) and `/dashboard` is still a placeholder.
- The provided reference image suggests:
  - grouped sections by trip lifecycle (Ongoing, Upcoming, Completed),
  - top controls (search + grouping/filter/sort),
  - compact trip overview cards.
- Goal is to upgrade this into a production-quality, responsive, accessible page with strong state handling (loading / empty / error).

## Approach
- Implement **`/dashboard/trips`** as the dedicated Current User Trips route (per your choice), while keeping `/dashboard` as-is and adding a clear link/CTA to Trips from there.
- Build the page server-first (App Router) with:
  - `requireSession()` auth gate,
  - one Prisma query scoped to user-visible trips (`ownerId = session.userId` OR `members.some({ userId: session.userId })`),
  - URL-query-driven controls for search/filter/sort so state is sharable and back/forward friendly.
- Use a **responsive card layout** (better for destination + booking metadata and mobile ergonomics than a dense table).
- Default rendering will be **grouped sections** (your final choice):
  - Ongoing,
  - Upcoming,
  - Completed,
  with per-section sorting and counts.
- Booking info strategy: **inferred booking progress** from current schema data (Trip/Stops/Expenses/Receipts/Transport fields), exposed as a simple badge + supporting metrics.
- Include practical UX interactions:
  - search by trip name/description/destination city,
  - filters (status, role, visibility),
  - sort options (nearest start, latest update, newest created, highest budget),
  - quick actions (open trip, create trip CTA, clear filters).
- Provide complete UX states:
  - route `loading.tsx` skeleton cards,
  - route `error.tsx` with retry action,
  - tailored empty states for both “no trips yet” and “no results for current filters”.

## Files to modify
- `app/dashboard/page.tsx`
  - keep dashboard route, add strong CTA/link into `/dashboard/trips`.
- `app/dashboard/trips/page.tsx`
  - main server-rendered trips page with data fetch + grouped rendering.
- `app/dashboard/trips/loading.tsx`
  - accessible skeleton for controls + cards while loading.
- `app/dashboard/trips/error.tsx`
  - user-friendly retryable error boundary.
- `app/dashboard/trips/trips-controls.tsx`
  - client controls (search/filter/sort) that update URL params.
- `app/dashboard/trips/trip-card.tsx`
  - card UI for trip metadata + quick actions.
- `app/dashboard/trips/trip-group-section.tsx`
  - grouped section wrapper for Ongoing/Upcoming/Completed lists.
- `app/dashboard/trips/utils.ts`
  - helpers for date formatting, lifecycle grouping, booking-progress inference, and derived summaries.

## Reuse
- `lib/session.ts`
  - `requireSession()` for server-side auth gating.
- `lib/db.ts`
  - shared Prisma singleton (`db`) for trip queries.
- `prisma/schema.prisma`
  - `Trip`, `TripMember`, `TripStop`, `TripExpense`, `TripShareLink`, `TripNote` relationships for metadata shown on cards.
- Existing Tailwind + global tokens in `app/globals.css` for visual consistency.

## Steps
- [ ] Add navigation entry from `/dashboard` to `/dashboard/trips`.
- [ ] Define a typed trip view-model containing:
  - destination preview (from ordered `TripStop -> City`),
  - date range + duration,
  - status + visibility + membership role,
  - budget/spend summary (`totalBudget`, estimated/actual expenses),
  - booking progress badge inferred from stops/transport/expense receipts.
- [ ] Implement Prisma fetch for current user-visible trips with only required relations/selects and counts.
- [ ] Implement URL-param logic (`q`, `status`, `role`, `visibility`, `sort`) and default grouped lifecycle sections.
- [ ] Build the responsive card UI + grouped sections + quick actions (Open Trip, Create Trip, Clear Filters).
- [ ] Add `loading.tsx`, route `error.tsx`, and dual empty states (no data vs no matches).
- [ ] Run accessibility pass: keyboard flow, focus visibility, semantic landmarks/headings, readable contrast, and label coverage.

## Verification
- Manual checks:
  - authenticated user can open trips page and only sees owned/member trips,
  - search/filter/sort/group combinations update results correctly,
  - cards show expected metadata from DB,
  - quick actions route correctly,
  - loading, empty, and error states render correctly.
- Device checks:
  - mobile (small width), tablet, desktop layouts.
- Accessibility checks:
  - keyboard navigation through controls + cards,
  - visible focus states,
  - semantic headings/lists/buttons and screen-reader labels.

## Decisions locked
- Route strategy: keep `/dashboard`; implement Trips at **`/dashboard/trips`**.
- Default layout: **grouped sections** (Ongoing / Upcoming / Completed).
- Booking info: use inferred booking-progress from existing schema fields for practical UX.