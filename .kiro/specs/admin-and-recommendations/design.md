# Design Document: Admin Panel & Improved Recommendations

## Overview

This document describes the technical design for two features added to the EyeGuard Next.js application:

1. **Admin Panel** — a protected `/admin/*` route group that lets a designated admin user monitor all respondents, view aggregate statistics, inspect individual user logs, manage the ML model, and export data as CSV.
2. **Improved Recommendations** — replaces the hardcoded recommendation strings in `predict-supabase/route.ts` with a dynamic engine that queries the `wellness_tips` Supabase table and selects tips based on the user's active symptoms, usage thresholds, and risk level.

Both features are built on the existing Next.js 16 (App Router) / TypeScript / Tailwind CSS / Supabase / Flask ML stack. The admin panel reuses the existing `AdminLayout`, `AdminSidebar`, and `AdminHeader` components. The recommendation engine is extracted into a standalone library module (`lib/recommendations.ts`) and called from the existing `predict-supabase` API route.

---

## Architecture

### High-Level Data Flow

**Admin Panel:**
```
Browser → /admin/* page (Server Component layout — admin guard)
        → fetch /api/admin/* (API route — Service_Role_Client)
        → Supabase (bypasses RLS)
```

**Recommendations:**
```
POST /api/predict-supabase
  → compute risk score (unchanged)
  → call selectRecommendations(input) from lib/recommendations.ts
      → query wellness_tips (server Supabase client, anon key — public read)
      → apply selection + dedup + sort + cap logic
      → return { title, description, category }[]
  → save to predictions.recommendations (JSONB)
  → return to client
```

**ML Status / Retrain (Admin → Flask proxy):**
```
Browser → /api/admin/ml-status or /api/admin/ml-retrain
        → Next.js API route (server-side fetch)
        → Flask backend (GET /api/ml/status or POST /api/ml/retrain)
```

### Two-Layer Admin Guard

Admin route protection uses two complementary layers:

1. **Middleware layer** (`middleware.ts` → `lib/supabase/proxy.ts`): Adds `/admin/*` to the matcher. Refreshes the Supabase session cookie. Checks `user_metadata.role === 'admin'` OR email matches `NEXT_PUBLIC_ADMIN_EMAIL`. Redirects unauthenticated users to `/login` and non-admin authenticated users to `/dashboard?error=access_denied`. This is a fast, early rejection layer.

2. **Server Component layer** (`app/admin/layout.tsx`): A Server Component that calls `createClient()` (server), checks admin status, and redirects if not admin. This is the authoritative guard — it runs even if the middleware is bypassed (e.g., direct server-side navigation).

The two layers are intentionally redundant. The middleware provides fast rejection at the edge; the Server Component provides a reliable server-side guarantee.

---

## Components and Interfaces

### New Files

| File | Type | Purpose |
|---|---|---|
| `lib/supabase/admin.ts` | Library | Service role Supabase client (bypasses RLS) |
| `lib/recommendations.ts` | Library | `selectRecommendations()` — recommendation engine |
| `app/admin/layout.tsx` | Server Component | Admin guard + `AdminLayout` wrapper |
| `app/admin/dashboard/page.tsx` | Client Component | Aggregate stats + ML status + retrain |
| `app/admin/users/page.tsx` | Client Component | Paginated respondent table with search |
| `app/admin/users/[userId]/page.tsx` | Client Component | Individual user detail + log history |
| `app/admin/data/page.tsx` | Client Component | CSV export |
| `app/api/admin/stats/route.ts` | API Route | `GET` — aggregate stats |
| `app/api/admin/users/route.ts` | API Route | `GET` — paginated user list |
| `app/api/admin/users/[userId]/route.ts` | API Route | `GET` — user detail + logs |
| `app/api/admin/export-csv/route.ts` | API Route | `GET` — streaming CSV download |
| `app/api/admin/ml-status/route.ts` | API Route | `GET` — proxy to Flask `/api/ml/status` |
| `app/api/admin/ml-retrain/route.ts` | API Route | `POST` — proxy to Flask `/api/ml/retrain` |

### Modified Files

| File | Change |
|---|---|
| `middleware.ts` | Add `/admin/*` to matcher; add admin role check with redirect logic |
| `lib/supabase/proxy.ts` | Add admin redirect logic for `/admin/*` paths |
| `app/api/predict-supabase/route.ts` | Replace hardcoded recommendations with `selectRecommendations()` call |
| `app/dashboard/page.tsx` | Update recommendation rendering from `string` to `{ title, description, category }` object |

### Key Interfaces

```typescript
// lib/recommendations.ts

export interface RecommendationInput {
  screenTime: number;       // hours
  sleepHours: number;
  brightness: number;       // 0–100
  riskLevel: string;        // 'Low' | 'Moderate' | 'High' | 'Critical'
  eyeStrain: 0 | 1;
  headaches: 0 | 1;
  blurryVision: 0 | 1;
  dryEyes: 0 | 1;
}

export interface RecommendationOutput {
  title: string;
  description: string;
  category: string;
}

export async function selectRecommendations(
  input: RecommendationInput
): Promise<RecommendationOutput[]>
```

```typescript
// app/api/admin/stats/route.ts — response shape

interface AggregateStats {
  totalRespondents: number;
  riskDistribution: {
    Low: number;       // percentage
    Moderate: number;
    High: number;
    Critical: number;
  };
  averageScreenTime: number;  // rounded to 1 decimal
  topSymptoms: Array<{ symptom: string; count: number }>;  // top 2
}
```

```typescript
// app/api/admin/users/route.ts — response shape

interface UserListResponse {
  users: Array<{
    userId: string | null;
    email: string;
    age: number | null;
    gender: string | null;
    yearLevel: string | null;
    fieldOfStudy: string | null;
    lastLogDate: string;
    lastRiskLevel: string;
  }>;
  page: number;
  totalPages: number;
  totalCount: number;
}
```

---

## Data Models

### `wellness_tips` Table (new)

```sql
CREATE TABLE wellness_tips (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category         text        NOT NULL,
  -- 'screen_time' | 'sleep' | 'brightness' | 'eye_strain'
  -- | 'dry_eyes' | 'headaches' | 'blurry_vision' | 'general'
  risk_level       text,
  -- 'Low' | 'Moderate' | 'High' | 'Critical' | NULL (general)
  symptom_type     text,
  -- 'eye_strain' | 'dry_eyes' | 'headaches' | 'blurry_vision' | NULL
  title            text        NOT NULL,
  description      text        NOT NULL,
  implementation_steps jsonb,  -- string[]
  priority         integer     NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);
```

The table is seeded with ~30 tips covering all symptom types, risk levels, and threshold categories. RLS is not required on this table — it is public read (anon key can read it). The recommendation engine uses the server Supabase client with the anon key.

### `predictions.recommendations` Column Change

The `recommendations` column in the `predictions` table changes from `text[]` (array of strings) to `jsonb` (array of objects). Each object has the shape:

```json
{ "title": "string", "description": "string", "category": "string" }
```

This is a breaking change for the dashboard page, which currently renders `prediction.recommendations?.map((rec: string, idx) => ...)`. The dashboard must be updated to render `rec.title` and `rec.description` instead of `rec` directly.

### Environment Variables

| Variable | Usage |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Existing — all Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Existing — browser + server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | New — admin client in API routes only |
| `NEXT_PUBLIC_ADMIN_EMAIL` | New — fallback admin email check |
| `NEXT_PUBLIC_RETRAIN_KEY` | Existing — retrain endpoint auth header |
| `NEXT_PUBLIC_API_URL` | Existing — Flask backend URL |

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser. It is only used in `lib/supabase/admin.ts`, which is only imported from API routes under `app/api/admin/`.

### Recommendation Selection Algorithm

`selectRecommendations(input)` applies the following logic in order:

1. **Symptom-matched tips**: Query `wellness_tips` where `symptom_type` matches any active flag (`eye_strain`, `dry_eyes`, `headaches`, `blurry_vision`).
2. **Threshold-triggered tips**: If `screen_time > 8`, add one tip from `category = 'screen_time'`. If `sleep_hours < 6`, add one from `category = 'sleep'`. If `brightness < 40 OR brightness > 85`, add one from `category = 'brightness'`.
3. **Risk-level tips**: Add tips where `risk_level` matches the user's risk level string.
4. **General tips**: Always include at least one tip where `symptom_type IS NULL`.
5. **Deduplication**: Remove duplicates by `id`.
6. **Sort**: Order by `priority` descending.
7. **Cap**: If more than 8 tips remain, keep the top 8. If fewer than 3, fill with top-priority general tips until 3 are reached.
8. **Fallback chain**:
   - No active symptoms → return top 3 general tips (`symptom_type IS NULL`) by priority.
   - No matches at all → return top 3 tips by priority regardless of filters.
   - Empty table → return hardcoded 3 strings as `RecommendationOutput` objects.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Recommendation count bounds

*For any* valid `RecommendationInput`, `selectRecommendations(input)` SHALL return a list with length between 3 and 8 inclusive.

**Validates: Requirements 8.6**

---

### Property 2: No duplicate recommendations

*For any* valid `RecommendationInput`, all `id` values in the result of `selectRecommendations(input)` SHALL be distinct — no tip appears more than once.

**Validates: Requirements 9.1**

---

### Property 3: Recommendation idempotence

*For any* valid `RecommendationInput`, calling `selectRecommendations(input)` twice with the same input SHALL return the same ordered list of recommendations.

**Validates: Requirements 9.2**

---

### Property 4: Symptom coverage

*For any* valid `RecommendationInput` where at least one symptom flag is active, the result of `selectRecommendations(input)` SHALL contain at least one tip whose `symptom_type` matches each active flag.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6**

---

### Property 5: No-symptom fallback returns only general tips

*For any* valid `RecommendationInput` where all four symptom flags equal 0, the result of `selectRecommendations(input)` SHALL contain only tips where `symptom_type IS NULL`, ordered by priority descending, with exactly 3 tips.

**Validates: Requirements 10.1**

---

### Property 6: Empty-table fallback is constant

*For any* valid `RecommendationInput` when the `wellness_tips` table is empty, `selectRecommendations(input)` SHALL return the same hardcoded fallback list regardless of the input values.

**Validates: Requirements 10.3**

---

### Property 7: Result objects have required fields

*For any* valid `RecommendationInput`, every object in the result of `selectRecommendations(input)` SHALL have non-empty `title`, `description`, and `category` string fields.

**Validates: Requirements 9.3**

---

### Property 8: Priority ordering invariant

*For any* valid `RecommendationInput`, the result of `selectRecommendations(input)` SHALL be sorted such that each tip's `priority` is greater than or equal to the next tip's `priority` (descending order).

**Validates: Requirements 8.5**

---

### Property 9: CSV round-trip fidelity

*For any* valid set of `daily_logs` rows, serializing the rows to CSV via the export endpoint and then parsing the resulting CSV SHALL produce a dataset with the same row count and the same field values for every row.

**Validates: Requirements 6.7**

---

### Property 10: CSV column completeness

*For any* valid `daily_logs` dataset (including empty), the exported CSV header row SHALL contain all 18 required columns in the specified order: `id`, `user_id`, `date`, `email`, `age`, `gender`, `year_level`, `field_of_study`, `screen_time`, `breaks_taken`, `eye_strain`, `headaches`, `blurry_vision`, `dry_eyes`, `brightness`, `sleep_hours`, `risk_level`, `created_at`.

**Validates: Requirements 6.2, 6.4**

---

### Property 11: Aggregate stats risk percentages sum to 100

*For any* non-empty `daily_logs` dataset, the four risk-level percentages returned by the stats endpoint (Low + Moderate + High + Critical) SHALL sum to 100 (within floating-point rounding tolerance of ±0.1).

**Validates: Requirements 3.3**

---

### Property 12: User logs ordered by date descending

*For any* user with one or more `daily_logs` rows, the user detail API endpoint SHALL return those logs ordered by `date` descending — each log's date is greater than or equal to the next log's date.

**Validates: Requirements 4.2**

---

## Error Handling

### Admin Guard Failures

| Condition | Behavior |
|---|---|
| Unauthenticated request to `/admin/*` | Middleware redirects to `/login` |
| Authenticated non-admin to `/admin/*` | Middleware redirects to `/dashboard?error=access_denied` |
| Supabase auth check throws network error | Server Component catches error, redirects to `/login` |
| `SUPABASE_SERVICE_ROLE_KEY` missing | API routes return `500` with message "Server configuration error" |

### Admin API Routes

All admin API routes (`/api/admin/*`) perform an admin check at the start of each handler using the server Supabase client. If the check fails, they return `401 Unauthorized`. This is a defense-in-depth measure in case the middleware is bypassed.

### Recommendation Engine Failures

| Condition | Behavior |
|---|---|
| Supabase query error | Log error, fall through to hardcoded fallback |
| Empty `wellness_tips` table | Return hardcoded 3-item fallback list |
| No matching tips for user's profile | Return top 3 tips by priority regardless of filters |
| Result would be < 3 tips | Fill with top-priority general tips until count = 3 |

The recommendation engine never throws — it always returns a valid `RecommendationOutput[]` of length 3–8. Errors are logged server-side but do not fail the prediction request.

### ML Backend Proxy

| Condition | Behavior |
|---|---|
| Flask unreachable (fetch throws) | Return `{ error: 'ML backend unavailable', modelLoaded: false }` with `503` |
| Flask returns non-2xx | Forward the status code and error message to the client |
| Retrain key mismatch | Flask returns `401`; proxy forwards it to the client |

### CSV Export

| Condition | Behavior |
|---|---|
| Empty `daily_logs` table | Return valid CSV with header row only |
| Field value contains comma | Wrap field in double quotes |
| Field value contains newline | Wrap field in double quotes |
| Field value contains double quote | Escape as `""` within double-quoted field |

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and pure logic:

- `lib/recommendations.ts`: Test each branch of the selection algorithm with concrete inputs (all flags active, no flags active, threshold triggers, empty table fallback, no-match fallback).
- Admin guard logic: Test `isAdmin()` helper with various `user_metadata` shapes (role = 'admin', role = undefined, email match, email mismatch).
- CSV serialization: Test proper quoting of fields containing commas, newlines, and double quotes.
- Aggregate stats computation: Test the respondent count formula (distinct user_id + null user_id rows) with concrete datasets.

### Property-Based Tests

Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) (TypeScript). Each test runs a minimum of 100 iterations.

**Recommendation engine properties** (mock Supabase client to return generated tip sets):

- **Property 1** — Count bounds: Generate arbitrary `RecommendationInput` values; assert `3 <= result.length <= 8`.
  - Tag: `Feature: admin-and-recommendations, Property 1: recommendation count bounds`
- **Property 2** — No duplicates: Generate arbitrary inputs; assert all tip IDs in result are unique.
  - Tag: `Feature: admin-and-recommendations, Property 2: no duplicate recommendations`
- **Property 3** — Idempotence: Generate arbitrary inputs; call `selectRecommendations` twice; assert results are deeply equal.
  - Tag: `Feature: admin-and-recommendations, Property 3: recommendation idempotence`
- **Property 4** — Symptom coverage: Generate inputs with at least one active flag; assert result contains at least one tip per active symptom type.
  - Tag: `Feature: admin-and-recommendations, Property 4: symptom coverage`
- **Property 5** — No-symptom fallback: Generate inputs with all flags = 0; assert result length = 3 and all tips have `symptom_type = null`.
  - Tag: `Feature: admin-and-recommendations, Property 5: no-symptom fallback returns only general tips`
- **Property 6** — Empty-table fallback: Generate arbitrary inputs with empty tip set; assert result equals hardcoded fallback.
  - Tag: `Feature: admin-and-recommendations, Property 6: empty-table fallback is constant`
- **Property 7** — Required fields: Generate arbitrary inputs; assert every result object has non-empty `title`, `description`, `category`.
  - Tag: `Feature: admin-and-recommendations, Property 7: result objects have required fields`
- **Property 8** — Priority ordering: Generate arbitrary inputs; assert result is sorted by priority descending.
  - Tag: `Feature: admin-and-recommendations, Property 8: priority ordering invariant`

**CSV round-trip property**:

- **Property 9** — Round-trip fidelity: Generate arbitrary arrays of `daily_logs`-shaped objects; serialize to CSV string; parse back; assert row count and field values match.
  - Tag: `Feature: admin-and-recommendations, Property 9: CSV round-trip fidelity`
- **Property 10** — Column completeness: Generate arbitrary datasets (including empty); assert CSV header contains all 18 required columns in order.
  - Tag: `Feature: admin-and-recommendations, Property 10: CSV column completeness`

**Aggregate stats properties**:

- **Property 11** — Risk percentages sum to 100: Generate arbitrary non-empty log arrays with risk levels; assert sum of four percentages = 100 ± 0.1.
  - Tag: `Feature: admin-and-recommendations, Property 11: aggregate stats risk percentages sum to 100`

**User detail ordering property**:

- **Property 12** — Logs ordered by date descending: Generate arbitrary arrays of log objects with dates; assert returned order is date descending.
  - Tag: `Feature: admin-and-recommendations, Property 12: user logs ordered by date descending`

### Integration Tests

Integration tests verify wiring between components with 1–3 representative examples:

- Admin API routes return `401` when called without admin credentials.
- `/api/admin/ml-status` proxies the Flask response correctly (mock Flask with `msw` or `nock`).
- `/api/admin/ml-retrain` sends the `X-Retrain-Key` header to Flask.
- `predict-supabase` route saves `recommendations` as JSONB objects (not strings) to the `predictions` table.

### Accessibility

Admin panel pages use semantic HTML (`<table>`, `<th scope="col">`, `<caption>`) for the respondent table. Buttons have `aria-label` attributes. Loading states use `aria-busy`. Error messages use `role="alert"`.
