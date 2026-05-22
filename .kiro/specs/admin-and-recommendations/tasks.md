# Implementation Plan: Admin Panel & Improved Recommendations

## Overview

This plan implements two features for EyeGuard: a protected Admin Panel at `/admin/*` and an improved dynamic Recommendation Engine. The work is organized into 10 task groups following the dependency order: database setup → shared libraries → API routes → UI pages → tests.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Database setup and environment configuration — no dependencies"
    },
    {
      "wave": 2,
      "tasks": ["2", "3"],
      "description": "Shared libraries: service role client, admin guard, recommendation engine — depend on task 1"
    },
    {
      "wave": 3,
      "tasks": ["4", "5", "6"],
      "description": "API routes: predict-supabase update, admin API routes, CSV export — depend on tasks 2 and 3"
    },
    {
      "wave": 4,
      "tasks": ["7", "8"],
      "description": "UI pages: admin panel pages and dashboard recommendation rendering — depend on tasks 4, 5, 6"
    },
    {
      "wave": 5,
      "tasks": ["9", "10"],
      "description": "Tests: property-based tests and integration tests — depend on tasks 3, 6, 7, 8"
    }
  ]
}
```

## Tasks

- [ ] 1. Database setup and environment configuration
  - [ ] 1.1 Update the `wellness_tips` table migration to match the design schema: add `symptom_type text` column, change `implementation_steps` to `jsonb`, add `risk_level text` column, and ensure `priority integer NOT NULL DEFAULT 0`. Run the migration SQL in `database/schema.sql` and verify the table structure matches the design document.
  - [ ] 1.2 Seed the `wellness_tips` table with ~30 tips covering all eight categories (`screen_time`, `sleep`, `brightness`, `eye_strain`, `dry_eyes`, `headaches`, `blurry_vision`, `general`), all four risk levels (`Low`, `Moderate`, `High`, `Critical`), and null `symptom_type` for general tips. Each tip must have a non-empty `title`, `description`, `category`, and a numeric `priority`. Add the seed SQL to `database/schema.sql` under a clearly marked section.
  - [ ] 1.3 Add `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_ADMIN_EMAIL` to `.env.local` (with placeholder values) and document both variables in `README.md` under a new "Environment Variables" section. Verify that `SUPABASE_SERVICE_ROLE_KEY` is listed in `.gitignore` patterns (it is already covered by `.env.local`).

- [ ] 2. Service role Supabase client and admin guard
  - [ ] 2.1 Create `lib/supabase/admin.ts` that exports a `createAdminClient()` function. The function must use `createClient` from `@supabase/supabase-js` (not `@supabase/ssr`) with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. If `SUPABASE_SERVICE_ROLE_KEY` is missing, the function must throw an error with the message `"SUPABASE_SERVICE_ROLE_KEY is not configured"`. Add a JSDoc comment warning that this client bypasses RLS and must only be imported from server-side API routes.
  - [ ] 2.2 Create `lib/admin-guard.ts` that exports an `isAdmin(user)` helper function. The function accepts a Supabase `User` object (or `null`) and returns `true` if `user.user_metadata.role === 'admin'` OR if `user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL`. Returns `false` for null input or any other case. Export the function for use in both middleware and Server Components.

- [ ] 3. Recommendation engine (`lib/recommendations.ts`)
  - [ ] 3.1 Create `lib/recommendations.ts` and define the `RecommendationInput` and `RecommendationOutput` TypeScript interfaces exactly as specified in the design document. Export both interfaces.
  - [ ] 3.2 Implement the `selectRecommendations(input: RecommendationInput): Promise<RecommendationOutput[]>` function. The function must use the server Supabase client (anon key) to query the `wellness_tips` table. Implement all eight steps of the selection algorithm in order: (1) symptom-matched tips, (2) threshold-triggered tips (screen_time > 8, sleep_hours < 6, brightness < 40 or > 85), (3) risk-level tips, (4) at least one general tip, (5) deduplication by `id`, (6) sort by `priority` descending, (7) cap at 8 / fill to 3, (8) fallback chain. The function must never throw — all errors must be caught and fall through to the hardcoded fallback.
  - [ ] 3.3 Implement the three-level fallback chain inside `selectRecommendations`: (a) no active symptoms → return top 3 general tips (`symptom_type IS NULL`) by priority; (b) no matches at all → return top 3 tips by priority regardless of filters; (c) empty table → return the three hardcoded strings as `RecommendationOutput` objects: `{ title: "Follow the 20-20-20 rule", description: "...", category: "general" }`, `{ title: "Maintain optimal screen brightness (60-80%)", ... }`, `{ title: "Get 7-9 hours of sleep per night", ... }`.
  - [ ] 3.4 Write unit tests in `lib/recommendations.test.ts` covering: all four symptom flags active, no flags active (fallback to general), threshold triggers (screen_time > 8, sleep_hours < 6, brightness out of range), empty table fallback returning exactly the three hardcoded strings, and result always having 3–8 items. Use a mock Supabase client (inject via a parameter or module mock) so tests do not require a live database.

- [ ] 4. Update `predict-supabase` API route
  - [ ] 4.1 Import `selectRecommendations` and `RecommendationInput` from `lib/recommendations.ts` in `app/api/predict-supabase/route.ts`. Remove all hardcoded `recommendations.push(...)` logic. After computing `riskLevel`, build a `RecommendationInput` object from the parsed form data (mapping `eyeStrain`, `headaches`, `blurryVision`, `dryEyes` symptom flags to `0 | 1` values) and call `await selectRecommendations(input)`. Assign the result to `recommendations`.
  - [ ] 4.2 Verify that the `predictions` insert still passes `recommendations` to the `recommendations` column. Since the schema already defines this column as `jsonb`, no column type migration is needed — but confirm the inserted value is an array of `{ title, description, category }` objects, not strings. Update the `return NextResponse.json(...)` at the end to include the structured recommendation objects.

- [ ] 5. Admin API routes
  - [ ] 5.1 Create `app/api/admin/stats/route.ts`. The `GET` handler must: (1) verify admin status using `isAdmin()` and return `401` if not admin; (2) use `createAdminClient()` to query all `daily_logs` rows; (3) compute `totalRespondents` as distinct `user_id` count plus count of rows where `user_id IS NULL`; (4) compute `riskDistribution` as percentages for each of the four risk levels summing to 100; (5) compute `averageScreenTime` rounded to one decimal; (6) compute `topSymptoms` as the top 2 symptom flags by frequency. Return the `AggregateStats` shape defined in the design document. Return zero values for all fields when the table is empty.
  - [ ] 5.2 Create `app/api/admin/users/route.ts`. The `GET` handler must: (1) verify admin status; (2) accept `page` (default 1), `pageSize` (default 20), and `search` query parameters; (3) use `createAdminClient()` to query `daily_logs` with a subquery or window function to get the most recent log per user; (4) filter by email `ilike` when `search` is provided; (5) return the `UserListResponse` shape with `users`, `page`, `totalPages`, and `totalCount`.
  - [ ] 5.3 Create `app/api/admin/users/[userId]/route.ts`. The `GET` handler must: (1) verify admin status; (2) use `createAdminClient()` to fetch all `daily_logs` rows for the given `userId`, ordered by `date` descending; (3) fetch the matching `user_profiles` row if `userId` is a valid UUID; (4) return `{ profile, logs }`. Return `404` with `{ error: "User not found" }` if no logs exist.
  - [ ] 5.4 Create `app/api/admin/ml-status/route.ts`. The `GET` handler must: (1) verify admin status; (2) fetch `${NEXT_PUBLIC_API_URL}/api/ml/status` from the Flask backend; (3) forward the JSON response to the client. If the fetch throws (Flask unreachable), return `{ error: "ML backend unavailable", modelLoaded: false }` with status `503`. If Flask returns non-2xx, forward the status code and body.
  - [ ] 5.5 Create `app/api/admin/ml-retrain/route.ts`. The `POST` handler must: (1) verify admin status; (2) send a `POST` to `${NEXT_PUBLIC_API_URL}/api/ml/retrain` with the `X-Retrain-Key` header set to `process.env.NEXT_PUBLIC_RETRAIN_KEY`; (3) forward the Flask response. Handle Flask unreachable with `503`.

- [ ] 6. CSV export API route and serialization library
  - [ ] 6.1 Create `app/api/admin/export-csv/route.ts`. The `GET` handler must: (1) verify admin status; (2) use `createAdminClient()` to fetch all `daily_logs` rows ordered by `created_at` ascending; (3) serialize to CSV with the 18 columns in the exact order specified in Requirement 6.2: `id`, `user_id`, `date`, `email`, `age`, `gender`, `year_level`, `field_of_study`, `screen_time`, `breaks_taken`, `eye_strain`, `headaches`, `blurry_vision`, `dry_eyes`, `brightness`, `sleep_hours`, `risk_level`, `created_at`; (4) return a `Response` with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="eyeguard-export.csv"`.
  - [ ] 6.2 Implement CSV serialization as a pure helper function `serializeToCSV(rows: Record<string, unknown>[], columns: string[]): string` in `lib/csv-export.ts`. The function must: wrap fields containing commas, newlines, or double quotes in double quotes; escape internal double quotes as `""`; include a header row; return a valid CSV string even for an empty `rows` array (header only).
  - [ ] 6.3 Write unit tests in `lib/csv-export.test.ts` covering: empty rows array returns header only, field with comma is quoted, field with newline is quoted, field with double quote is escaped as `""`, all 18 columns appear in the header in the correct order.

- [ ] 7. Admin panel pages and layout
  - [ ] 7.1 Update `middleware.ts` to add admin route protection. In `lib/supabase/proxy.ts`, add logic after the existing `getUser()` call: if `request.nextUrl.pathname.startsWith('/admin')`, check `isAdmin(user)`. If `!user`, redirect to `/login`. If `user` but not admin, redirect to `/dashboard?error=access_denied`. Otherwise continue. Preserve all existing session-refresh behavior.
  - [ ] 7.2 Create `app/admin/layout.tsx` as a Server Component. It must: (1) call `createClient()` (server) and `supabase.auth.getUser()`; (2) call `isAdmin(user)` — redirect to `/login` if not authenticated, redirect to `/dashboard?error=access_denied` if authenticated but not admin; (3) wrap children in the existing `AdminLayout` component from `components/admin-layout.tsx`.
  - [ ] 7.3 Create `app/admin/dashboard/page.tsx` as a Client Component. It must: (1) fetch `/api/admin/stats` on mount and display `AggregateStats` (total respondents, risk distribution as a percentage breakdown, average screen time, top 2 symptoms); (2) fetch `/api/admin/ml-status` and display ML status (model loaded boolean, training row count, new logs since retrain); (3) render a "Retrain Model" button that POSTs to `/api/admin/ml-retrain`, shows a loading spinner while in-flight, disables during loading, and shows a success toast on completion or an error message if Flask is unreachable. Use `aria-busy` on loading states and `role="alert"` on error messages.
  - [ ] 7.4 Create `app/admin/users/page.tsx` as a Client Component. It must: (1) fetch `/api/admin/users` with `page` and `search` query params; (2) render a `<table>` with `<th scope="col">` headers for the 7 columns (email, age, gender, year level, field of study, last log date, last risk level); (3) implement debounced search (300ms) that updates the `search` param; (4) render pagination controls showing current page and total pages; (5) display "No respondents found." when the table is empty; (6) make each row clickable, navigating to `/admin/users/[userId]`.
  - [ ] 7.5 Create `app/admin/users/[userId]/page.tsx` as a Client Component. It must: (1) fetch `/api/admin/users/[userId]` on mount; (2) display the user's profile info (email, age, gender, year level, field of study) — use the email from `daily_logs` if no `user_profiles` row exists; (3) render a table of all logs ordered by date descending with columns: date, screen time, sleep hours, brightness, active symptoms (comma-separated), risk level; (4) display "No logs found for this user." if the logs array is empty.
  - [ ] 7.6 Create `app/admin/data/page.tsx` as a Client Component. It must: (1) render an "Export CSV" button; (2) on click, fetch `/api/admin/export-csv` and trigger a browser download using a Blob URL; (3) show a loading spinner on the button while the download is in progress; (4) handle errors by displaying an error message.

- [ ] 8. Update dashboard recommendation rendering
  - [ ] 8.1 Update `app/dashboard/page.tsx` to handle the new `RecommendationOutput` object shape. Change the recommendations render from `{rec}` (string) to `{rec.title}` and optionally `{rec.description}`. Update the TypeScript type annotation from `rec: string` to `rec: { title: string; description: string; category: string }`. Ensure the change is backward-compatible with any existing `string[]` data already in the database by adding a type guard: if `typeof rec === 'string'`, render it as-is.

- [ ] 9. Property-based tests
  - [ ] 9.1 Install `fast-check` as a dev dependency: `npm install --save-dev fast-check`. Verify it appears in `package.json` devDependencies. Also install a test runner if not present — check for `vitest` or `jest` in `package.json`; if neither exists, install `vitest` and `@vitest/coverage-v8` and add a `"test": "vitest run"` script to `package.json`.
  - [ ] 9.2 Write property test for **Property 1 (Recommendation count bounds)** in `lib/recommendations.pbt.test.ts`. Use `fc.record(...)` to generate arbitrary valid `RecommendationInput` values. Assert `result.length >= 3 && result.length <= 8`. Tag: `Feature: admin-and-recommendations, Property 1: recommendation count bounds`. **Validates: Requirements 8.6**
  - [ ] 9.3 Write property test for **Property 2 (No duplicate recommendations)** in the same file. Generate arbitrary inputs; assert all tip IDs in the result are unique (use a `Set`). Tag: `Feature: admin-and-recommendations, Property 2: no duplicate recommendations`. **Validates: Requirements 9.1**
  - [ ] 9.4 Write property test for **Property 3 (Recommendation idempotence)** in the same file. Generate arbitrary inputs; call `selectRecommendations` twice with the same input; assert the two results are deeply equal. Tag: `Feature: admin-and-recommendations, Property 3: recommendation idempotence`. **Validates: Requirements 9.2**
  - [ ] 9.5 Write property test for **Property 4 (Symptom coverage)** in the same file. Generate inputs where at least one symptom flag is 1; assert the result contains at least one tip per active symptom type. Tag: `Feature: admin-and-recommendations, Property 4: symptom coverage`. **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6**
  - [ ] 9.6 Write property test for **Property 5 (No-symptom fallback returns only general tips)** in the same file. Generate inputs with all four symptom flags = 0; assert `result.length === 3` and every tip has `symptom_type === null`. Tag: `Feature: admin-and-recommendations, Property 5: no-symptom fallback returns only general tips`. **Validates: Requirements 10.1**
  - [ ] 9.7 Write property test for **Property 6 (Empty-table fallback is constant)** in the same file. Generate arbitrary inputs with an empty tip set (mock Supabase to return `[]`); assert the result equals the three hardcoded fallback items regardless of input. Tag: `Feature: admin-and-recommendations, Property 6: empty-table fallback is constant`. **Validates: Requirements 10.3**
  - [ ] 9.8 Write property test for **Property 7 (Result objects have required fields)** in the same file. Generate arbitrary inputs; assert every object in the result has non-empty `title`, `description`, and `category` string fields. Tag: `Feature: admin-and-recommendations, Property 7: result objects have required fields`. **Validates: Requirements 9.3**
  - [ ] 9.9 Write property test for **Property 8 (Priority ordering invariant)** in the same file. Generate arbitrary inputs; assert the result is sorted such that each tip's `priority >= next tip's priority`. Tag: `Feature: admin-and-recommendations, Property 8: priority ordering invariant`. **Validates: Requirements 8.5**
  - [ ] 9.10 Write property test for **Property 9 (CSV round-trip fidelity)** in `lib/csv-export.pbt.test.ts`. Use `fc.array(fc.record(...))` to generate arbitrary arrays of `daily_logs`-shaped objects; serialize with `serializeToCSV`; parse the resulting CSV string back; assert row count and field values match the original. Tag: `Feature: admin-and-recommendations, Property 9: CSV round-trip fidelity`. **Validates: Requirements 6.7**
  - [ ] 9.11 Write property test for **Property 10 (CSV column completeness)** in the same file. Generate arbitrary datasets including empty arrays; assert the CSV header row contains all 18 required columns in the exact specified order. Tag: `Feature: admin-and-recommendations, Property 10: CSV column completeness`. **Validates: Requirements 6.2, 6.4**
  - [ ] 9.12 Write property test for **Property 11 (Aggregate stats risk percentages sum to 100)** in `app/api/admin/stats.pbt.test.ts`. Generate arbitrary non-empty arrays of log objects with `risk_level` values from `['Low', 'Moderate', 'High', 'Critical']`; compute the risk distribution using the same logic as the stats route; assert `Low + Moderate + High + Critical === 100` within ±0.1. Tag: `Feature: admin-and-recommendations, Property 11: aggregate stats risk percentages sum to 100`. **Validates: Requirements 3.3**
  - [ ] 9.13 Write property test for **Property 12 (User logs ordered by date descending)** in `app/api/admin/users.pbt.test.ts`. Generate arbitrary arrays of log objects with `date` string fields; sort them using the same logic as the user detail route; assert each log's date is `>=` the next log's date. Tag: `Feature: admin-and-recommendations, Property 12: user logs ordered by date descending`. **Validates: Requirements 4.2**

- [ ] 10. Integration tests and final wiring verification
  - [ ] 10.1 Write integration tests in `app/api/admin/__tests__/admin-auth.test.ts` verifying that each admin API route (`/api/admin/stats`, `/api/admin/users`, `/api/admin/users/[userId]`, `/api/admin/export-csv`, `/api/admin/ml-status`, `/api/admin/ml-retrain`) returns `401 Unauthorized` when called without admin credentials. Use a mock Supabase client that returns a non-admin user.
  - [ ] 10.2 Write an integration test in `app/api/admin/__tests__/ml-proxy.test.ts` verifying that `/api/admin/ml-status` correctly proxies the Flask response (mock the Flask fetch with `jest.fn()` or `vi.fn()`), and that `/api/admin/ml-retrain` sends the `X-Retrain-Key` header to Flask.
  - [ ] 10.3 Write an integration test in `app/api/predict-supabase/__tests__/recommendations-wiring.test.ts` verifying that the `predict-supabase` route saves `recommendations` as an array of `{ title, description, category }` objects (not strings) to the `predictions` table. Mock `selectRecommendations` to return a known set of `RecommendationOutput` objects and assert the Supabase insert receives them.
  - [ ] 10.4 Run the full test suite (`npm test`) and confirm all unit tests, property-based tests, and integration tests pass. Fix any TypeScript compilation errors. Verify the Next.js build completes without errors (`npm run build`).

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser. It is only used in `lib/supabase/admin.ts`, which is only imported from API routes under `app/api/admin/`.
- The `predictions.recommendations` column changes from `text[]` to `jsonb`. The dashboard update in task 8 includes a backward-compatibility type guard for any existing string-array data.
- All admin API routes perform an admin check at the start of each handler as defense-in-depth, even though the middleware and layout guard already protect the routes.
- The recommendation engine never throws — all Supabase errors fall through to the hardcoded fallback so prediction requests always succeed.
- Property-based tests use a mock Supabase client and do not require a live database connection.
