# Profile Page UI Redesign Plan

## Context
- The current `/profile` page is a minimal placeholder and does not match the richer UI language used on dashboard and trips pages.
- You want a polished redesign that feels consistent with existing app styles (spacing, typography, colors, card treatment, nav structure) and is visually similar to the provided wireframe reference.
- The wireframe suggests:
  - top app nav,
  - a prominent user details panel with avatar + key metadata + action area,
  - two trip sections: **Preplanned Trips** and **Previous Trips**, each with card grids and "View" actions.

## Approach
- Keep the page server-rendered and session-protected.
- Reuse existing dashboard visual patterns (logo/nav shell, user menu behavior, token colors, rounded cards, border rhythm).
- Implement a dedicated profile layout with:
  1. **Profile Hero Card**
     - avatar/photo fallback with initials,
     - user identity + account metadata,
     - practical actions (e.g., My Trips, Create Trip, optional edit affordance).
  2. **Preplanned Trips Section**
     - trips classified as active/future-facing (DRAFT/PLANNED/ONGOING + date-aware fallback).
  3. **Previous Trips Section**
     - completed/archived/past trips.
- Keep card visuals consistent with dashboard/trips components (status badge, date info, destination summary, clear CTA button).
- Ensure responsive behavior from mobile to desktop and preserve keyboard/focus accessibility.

## Files to modify
- `app/profile/page.tsx`
  - replace placeholder with full profile layout and DB-backed sections.
- `app/profile/Profile.module.css` (new)
  - profile-specific styles aligned with dashboard theme and tokens.

## Reuse
- `lib/session.ts`
  - `requireSession()` for route protection.
- `lib/db.ts`
  - Prisma access for user + trip queries.
- `app/dashboard/user-menu.tsx`
  - keep account dropdown behavior consistent across dashboard/profile.
- `app/dashboard/Dashboard.module.css`
  - reuse visual language cues (nav/logo patterns).
- DB models from `prisma/schema.prisma`
  - `User`, `Trip`, `TripStop`, `City` for profile and trip summaries.

## Steps
- [ ] Build profile data query layer in `app/profile/page.tsx`:
  - fetch current user profile details,
  - fetch user-owned trips with minimal related stop/city info,
  - split trips into preplanned vs previous buckets.
- [ ] Implement redesigned page structure:
  - top nav + user menu,
  - profile details hero card,
  - preplanned trips grid,
  - previous trips grid,
  - empty states for each section.
- [ ] Add `Profile.module.css` with consistent spacing, card styles, badges, and responsive rules.
- [ ] Wire card CTAs (`View`) to existing trip route(s) and align action buttons with available pages.
- [ ] Accessibility pass:
  - semantic headings/sections,
  - keyboard-friendly links/buttons,
  - visible focus states,
  - readable text contrast.

## Verification
- Manual UX checks:
  - `/profile` loads for authenticated users and uses real session/user data,
  - preplanned/previous sections classify trips correctly,
  - card “View” actions navigate correctly,
  - empty states appear when section has no trips.
- Responsive checks:
  - mobile, tablet, desktop layouts remain balanced and readable.
- Accessibility checks:
  - keyboard navigation works through nav/actions/cards,
  - focus styles are visible,
  - section and action labels are clear.
