# Requirements Document

## Introduction

EyeGuard needs two improvements to support both administrators and end users more effectively.

The **Admin Panel** gives a designated admin user a protected `/admin` route where they can monitor all respondents, view aggregate eye health statistics across the user base, inspect individual user logs, check the ML model's health, trigger retraining, and export data as CSV. The admin panel reuses the existing `AdminLayout`, `AdminSidebar`, and `AdminHeader` components already present in the codebase.

The **Improved Recommendations** feature replaces the current hardcoded, risk-level-only recommendation strings with a dynamic engine that queries the `wellness_tips` Supabase table and selects tips based on the user's specific active symptoms (dry eyes, headaches, blurry vision, eye strain), screen time, sleep hours, brightness, and risk level. This makes recommendations actionable and relevant to each user's actual data.

Both features operate within the existing Next.js 16 / Supabase / Flask ML stack and must respect the existing Row Level Security (RLS) policies.

---

## Glossary

- **Admin_User**: An authenticated Supabase user whose `user_metadata.role` equals `"admin"`, or whose email matches the `NEXT_PUBLIC_ADMIN_EMAIL` environment variable.
- **Admin_Panel**: The protected Next.js route group at `/admin/*` accessible only to Admin_User.
- **Admin_Guard**: The client-side and server-side mechanism that verifies Admin_User identity before rendering Admin_Panel pages.
- **Respondent**: Any row in the `daily_logs` table, including rows with a `user_id` (authenticated users) and rows where `user_id IS NULL` (survey imports).
- **Aggregate_Stats**: Computed summary metrics across all Respondents: total count, risk distribution, average screen time, and most common symptoms.
- **ML_Status**: The current state of the Flask ML backend, including whether a model is loaded, the count of training rows in Supabase, and the number of new logs since the last retrain.
- **Recommendation_Engine**: The Next.js API route logic that selects `wellness_tips` rows based on a user's symptom flags, screen time, sleep hours, brightness, and risk level.
- **Wellness_Tip**: A row in the `wellness_tips` Supabase table with fields: `category`, `risk_level`, `symptom_type`, `title`, `description`, `implementation_steps`, and `priority`.
- **Symptom_Flag**: A binary field in `daily_logs` (value 0 or 1) indicating whether a symptom was present: `eye_strain`, `headaches`, `blurry_vision`, `dry_eyes`.
- **Service_Role_Client**: A Supabase client initialized with `SUPABASE_SERVICE_ROLE_KEY` that bypasses RLS, used exclusively in Next.js API routes for admin data access.

---

## Requirements

### Requirement 1: Admin Route Protection

**User Story:** As an admin user, I want the `/admin` routes to be inaccessible to non-admin users, so that respondent data and system controls are protected.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any `/admin/*` path, THE Admin_Guard SHALL redirect the user to `/login`.
2. WHEN an authenticated non-admin user navigates to any `/admin/*` path, THE Admin_Guard SHALL redirect the user to `/dashboard` and display an "Access denied" message.
3. WHEN an Admin_User navigates to any `/admin/*` path, THE Admin_Guard SHALL render the requested Admin_Panel page.
4. THE Admin_Guard SHALL verify admin status by checking the authenticated user's `user_metadata.role` field against the value `"admin"` using the Supabase server client, and SHALL treat any verification failure or unexpected result as non-admin access.
5. IF the Supabase auth check fails with a network error, THEN THE Admin_Guard SHALL redirect the user to `/login`.

---

### Requirement 2: Respondent List View

**User Story:** As an admin user, I want to see all respondents in a paginated table, so that I can understand who is using the system.

#### Acceptance Criteria

1. WHEN Admin_User loads `/admin/users`, THE Admin_Panel SHALL display a table of Respondents fetched from the `daily_logs` table using the Service_Role_Client.
2. THE Admin_Panel SHALL display the following columns for each Respondent: email, age, gender, year level, field of study, most recent log date, and risk level from the most recent log.
3. THE Admin_Panel SHALL paginate the Respondent table with 20 rows per page and display the current page number and total page count.
4. WHEN Admin_User types in the search field, THE Admin_Panel SHALL filter the displayed Respondents to those whose email contains the search string, within 300ms of the last keystroke, and SHALL display an empty table with column headers when data exists but no Respondents match the search criteria.
5. IF the `daily_logs` table contains zero rows, THEN THE Admin_Panel SHALL display the table column headers and an empty-state message: "No respondents found."

---

### Requirement 3: Aggregate Statistics

**User Story:** As an admin user, I want to see system-wide statistics at a glance, so that I can understand overall eye health trends across all respondents.

#### Acceptance Criteria

1. WHEN Admin_User loads `/admin/dashboard`, THE Admin_Panel SHALL display Aggregate_Stats computed from all rows in the `daily_logs` table.
2. THE Admin_Panel SHALL display the total Respondent count as the number of distinct `user_id` values plus the count of rows where `user_id IS NULL`.
3. THE Admin_Panel SHALL display risk distribution as the percentage of logs in each risk level (Low, Moderate, High, Critical), where the four percentages sum to 100%, and SHALL display percentages even when all logs share the same risk level.
4. THE Admin_Panel SHALL display average screen time as the mean of the `screen_time` column across all rows, rounded to one decimal place.
5. THE Admin_Panel SHALL display the most common symptoms as the top 2 Symptom_Flags by frequency (count of rows where the flag equals 1), with their occurrence counts.
6. WHEN the `daily_logs` table is empty, THE Admin_Panel SHALL display zero values for all Aggregate_Stats fields.

---

### Requirement 4: Individual User Detail View

**User Story:** As an admin user, I want to view a specific respondent's full log history, so that I can investigate individual eye health patterns.

#### Acceptance Criteria

1. WHEN Admin_User clicks a Respondent row in the user table, THE Admin_Panel SHALL navigate to `/admin/users/[userId]` and display that Respondent's log history.
2. THE Admin_Panel SHALL display all `daily_logs` rows for the selected Respondent, ordered by `date` descending, showing: date, screen time, sleep hours, brightness, active symptoms, and risk level.
3. THE Admin_Panel SHALL display the Respondent's profile information from `user_profiles` if a matching `user_id` exists.
4. IF the selected Respondent has no `user_id` (survey import), THEN THE Admin_Panel SHALL display the email from the `daily_logs` row as the identifier.
5. IF no logs exist for the given `userId`, THEN THE Admin_Panel SHALL display a "No logs found for this user" message.

---

### Requirement 5: ML Model Status and Retrain

**User Story:** As an admin user, I want to see the ML model's current status and trigger retraining, so that I can ensure the prediction model stays accurate as new data arrives.

#### Acceptance Criteria

1. WHEN Admin_User loads `/admin/dashboard`, THE Admin_Panel SHALL display ML_Status by calling the Flask endpoint `GET /api/ml/status`.
2. THE Admin_Panel SHALL display: whether a model is loaded (boolean), the count of training rows in Supabase, and the number of new logs since the last retrain.
3. WHEN Admin_User clicks the "Retrain Model" button, THE Admin_Panel SHALL send a `POST` request to the Flask endpoint `/api/ml/retrain` with the `X-Retrain-Key` header set to the value of `NEXT_PUBLIC_RETRAIN_KEY`.
4. WHILE the retrain request is in progress, THE Admin_Panel SHALL display a loading indicator on the "Retrain Model" button and disable the button. WHERE the admin has configured the button to remain disabled after retrain, THE Admin_Panel SHALL keep the button disabled even when no retrain is active.
5. WHEN the retrain request returns a success response, THE Admin_Panel SHALL display a success notification: "Retrain started. Check server logs for progress." IF the component has unmounted or UI state is corrupted before the response arrives, the notification may not appear.
6. IF the Flask backend is unreachable, THEN THE Admin_Panel SHALL display an error message: "ML backend unavailable" and disable the "Retrain Model" button.

---

### Requirement 6: CSV Data Export

**User Story:** As an admin user, I want to export all respondent data as a CSV file, so that I can perform offline analysis or share data with researchers.

#### Acceptance Criteria

1. WHEN Admin_User clicks the "Export CSV" button on `/admin/data`, THE Admin_Panel SHALL generate and download a CSV file containing all rows from `daily_logs`.
2. THE CSV file SHALL include the following columns in order: `id`, `user_id`, `date`, `email`, `age`, `gender`, `year_level`, `field_of_study`, `screen_time`, `breaks_taken`, `eye_strain`, `headaches`, `blurry_vision`, `dry_eyes`, `brightness`, `sleep_hours`, `risk_level`, `created_at`.
3. THE CSV file SHALL use comma as the delimiter and double-quote strings that contain commas or newlines.
4. THE CSV file SHALL include a header row as the first line.
5. WHILE the CSV is being generated, THE Admin_Panel SHALL display a loading indicator on the "Export CSV" button.
6. IF the `daily_logs` table is empty, THEN THE Admin_Panel SHALL still generate a valid CSV file containing only the header row.
7. FOR ALL valid `daily_logs` datasets, parsing the exported CSV and re-importing the rows SHALL produce a dataset with the same row count and field values as the original (round-trip property).

---

### Requirement 7: Symptom-Based Recommendation Selection

**User Story:** As a user, I want my recommendations to reflect my specific symptoms, so that the advice I receive is directly relevant to what I am experiencing.

#### Acceptance Criteria

1. WHEN a prediction is generated for a user, THE Recommendation_Engine SHALL query the `wellness_tips` table and select tips where `symptom_type` matches any active Symptom_Flag in the user's most recent `daily_logs` row.
2. WHEN a user's `dry_eyes` flag equals 1, THE Recommendation_Engine SHALL include at least one Wellness_Tip with `symptom_type = 'dry_eyes'` in the recommendations.
3. WHEN a user's `headaches` flag equals 1, THE Recommendation_Engine SHALL include at least one Wellness_Tip with `symptom_type = 'headaches'` in the recommendations.
4. WHEN a user's `blurry_vision` flag equals 1, THE Recommendation_Engine SHALL include at least one Wellness_Tip with `symptom_type = 'blurry_vision'` in the recommendations.
5. WHEN a user's `eye_strain` flag equals 1, THE Recommendation_Engine SHALL include at least one Wellness_Tip with `symptom_type = 'eye_strain'` in the recommendations.
6. FOR ALL combinations of active Symptom_Flags, THE Recommendation_Engine SHALL return at least one recommendation per active symptom and at least one general recommendation (where `symptom_type IS NULL`).

---

### Requirement 8: Risk-Level and Threshold-Based Tip Filtering

**User Story:** As a user, I want recommendations that match my risk level and specific usage patterns, so that the advice is calibrated to the severity of my situation.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL include Wellness_Tips where `risk_level` matches the user's current risk level string (Low, Moderate, High, Critical) or where `risk_level IS NULL` (general tips), where matching makes a tip eligible for inclusion but does not guarantee it will appear in the final list.
2. WHEN a user's `screen_time` exceeds 8 hours, THE Recommendation_Engine SHALL include a Wellness_Tip from the `screen_time` category.
3. WHEN a user's `sleep_hours` is less than 6, THE Recommendation_Engine SHALL include a Wellness_Tip from the `sleep` category.
4. WHEN a user's `brightness` is outside the range 40–85, THE Recommendation_Engine SHALL include a Wellness_Tip from the `brightness` category.
5. THE Recommendation_Engine SHALL order the selected tips by `priority` descending, so that higher-priority tips appear first.
6. THE Recommendation_Engine SHALL return between 3 and 8 recommendations per prediction, selecting the highest-priority tips when more than 8 would otherwise qualify.

---

### Requirement 9: Recommendation Deduplication and Idempotence

**User Story:** As a user, I want to see a clean, non-repetitive list of recommendations, so that the advice is easy to read and act on.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL deduplicate recommendations by `wellness_tips.id`, so that the same tip does not appear more than once in a single prediction's recommendation list.
2. FOR ALL valid user log inputs, applying THE Recommendation_Engine twice with the same input SHALL produce the same ordered list of recommendations (idempotence property).
3. THE Recommendation_Engine SHALL store recommendations in the `predictions.recommendations` JSONB column as an array of objects, each containing `title`, `description`, and `category` fields.

---

### Requirement 10: Fallback Recommendations

**User Story:** As a user, I want to always receive at least some recommendations even when my symptom data is minimal, so that I am never left without guidance.

#### Acceptance Criteria

1. IF a user has no active Symptom_Flags (all four flags equal 0), THEN THE Recommendation_Engine SHALL return the top 3 Wellness_Tips ordered by `priority` descending where `symptom_type IS NULL`.
2. IF the `wellness_tips` table contains no rows matching the user's symptoms or risk level, THEN THE Recommendation_Engine SHALL return the top 3 Wellness_Tips ordered by `priority` descending regardless of `symptom_type` or `risk_level`.
3. IF the `wellness_tips` table is empty, THEN THE Recommendation_Engine SHALL return the same hardcoded fallback list for all users regardless of context, containing: "Follow the 20-20-20 rule", "Maintain optimal screen brightness (60-80%)", and "Get 7-9 hours of sleep per night".
