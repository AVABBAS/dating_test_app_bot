# Vibe Mini App — Architecture & Refactor Plan

## Goal

Keep the Telegram Mini App fast, predictable, secure, visually consistent, and easy to evolve without mixing UI, API, business rules, persistence, or financial concerns.

## System layers

```text
Telegram WebApp
      |
      v
React UI / Routes
      |
      +--> Design System (tokens + components + sections)
      |
      +--> API client (frontend/src/api.js)
      |
      v
Express API
      |
      +--> Authentication / authorization middleware
      +--> Rate limiting / validation
      +--> Domain endpoints
      +--> Notification / engagement services
      |
      v
Prisma data layer
      |
      v
PostgreSQL
```

## Frontend domains

- **Core shell:** App, Telegram chrome, navigation, onboarding gate.
- **Discovery:** Discover, Explore, Filters, Top Picks, Likes You.
- **Social:** Matches, Chat, Stories, Gifts, Notifications.
- **Identity:** Profile, Prompts, Verification, Passport.
- **Engagement:** Events, Leaderboard.
- **Account:** More, Settings, Safety.
- **Monetization UI:** Premium and Store pages only. Financial backend behavior is out of scope for the current engineering pass.

## Backend domains

- **Identity:** user/profile/onboarding.
- **Discovery:** discover, preferences, likes/actions.
- **Social:** matches, messages, stories, gifts.
- **Trust & safety:** verification, reports, blocks, settings/privacy.
- **Engagement:** events, leaderboard, notifications, passport.
- **Monetization boundary:** existing ledger/purchase code is isolated from the current refactor and must not be expanded unless financial backend work is explicitly requested.

## Refactor order

### Phase 0 — Baseline / safety

1. Preserve working behavior.
2. Inventory routes, API calls, database models, migrations and workflows.
3. Run frontend build/lint and backend tests before high-risk changes.
4. Never combine unrelated frontend, backend and schema changes in one commit.

### Phase 1 — Foundation

1. Establish one canonical design-token vocabulary.
2. Remove undefined CSS variables and token collisions.
3. Keep compatibility aliases temporarily while page CSS migrates.
4. Centralize API request behavior.
5. Centralize route/navigation behavior.

### Phase 2 — Frontend architecture

1. Convert pages to shared UI primitives.
2. Remove duplicated page-level CSS.
3. Standardize loading, empty, error and success states.
4. Standardize buttons, cards, headers, modals, forms and navigation.
5. Keep secondary routes lazy-loaded.

### Phase 3 — API contract

1. Audit every frontend API call against an actual backend endpoint.
2. Remove dead endpoints and UI actions.
3. Normalize request/response/error shapes.
4. Add abort/cancellation for stale requests.
5. Prevent duplicate requests and unnecessary polling.

### Phase 4 — Backend/domain architecture

1. Separate authentication middleware from business logic.
2. Separate endpoint handlers from domain services.
3. Centralize validation with Zod.
4. Optimize repeated read/write paths such as `lastSeen`.
5. Keep authorization checks at the API boundary.

### Phase 5 — Database

1. Verify every Prisma relation and migration.
2. Audit indexes against real query patterns.
3. Optimize discovery and match/message queries.
4. Preserve unique constraints for idempotent social actions.
5. Do not add speculative indexes without a query justification.

### Phase 6 — Performance

1. Measure production build sizes.
2. Cache immutable frontend assets safely.
3. Optimize `/api/user` startup work.
4. Reduce unnecessary `lastSeen` writes.
5. Reduce chat/notification polling when possible.
6. Avoid unnecessary Telegram API calls.

### Phase 7 — Security & reliability

1. Re-audit Telegram authentication.
2. Verify every user-controlled ID is authorized.
3. Validate action payloads.
4. Review rate limits and request sizes.
5. Test self-actions, duplicate actions, unauthorized reads and writes.

### Phase 8 — UX / visual QA

1. Review every route on mobile dimensions.
2. Check color hierarchy and contrast.
3. Check RTL layout and safe areas.
4. Check keyboard/input behavior.
5. Check loading, empty, error and offline states.

## Commit discipline

Each phase should produce small, reversible commits. Preferred prefixes:

- `refactor(ui): ...`
- `refactor(api): ...`
- `refactor(server): ...`
- `perf(frontend): ...`
- `perf(api): ...`
- `fix(security): ...`
- `fix(db): ...`
- `test: ...`

## Current first implementation

The design-token compatibility layer was added first. Existing CSS currently uses multiple generations of variable names (`--text-1`, `--text-primary`, `--primary`, `--brand-primary`, etc.). The compatibility aliases prevent undefined values while the pages are migrated to the canonical token system.

The next implementation step is the frontend API-contract audit, followed by the shared UI/page migration. Backend and database changes should then be made endpoint-by-endpoint with tests.
