# Implementation Plan: RBAC Multi-User Authentication

## Overview

Replace the single-password admin auth with a full RBAC system. The implementation follows a strict bottom-up order: database schema first, then backend auth/middleware, then new backend routes, then frontend context and guards, then UI updates, then new pages, and finally the header migration. Property-based tests are added close to the components they validate.

## Tasks

- [x] 1. Database schema additions and seed data
  - Add `users`, `followup_logs`, and `audit_logs` table definitions to `backend/server/database.js` inside `initializeDatabase()`, after the existing tables array
  - Add a `seedUsers()` async function that runs `bcryptjs.hash` (cost 12) on each default password and inserts the five seed accounts only when `SELECT COUNT(*) FROM users` returns 0
  - Call `seedUsers()` at the end of `initializeDatabase()` before the `console.log('Database initialized')` line
  - Add `JWT_SECRET` to `backend/.env.example` alongside the existing variables
  - _Requirements: 9.6, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 1.1 Write property test: seed is idempotent (Property 25)
    - **Property 25: Seed is idempotent**
    - Call `initializeDatabase()` twice on an in-memory SQLite DB; assert user count does not increase on the second call
    - **Validates: Requirements 11.4**

- [x] 2. Backend: install dependencies and replace auth middleware
  - Run `npm install bcryptjs@2.4.3 jsonwebtoken@9.0.2` in `backend/`
  - Replace `backend/server/routes/auth.js` entirely: accept `{ email, password }`, look up user by email, `bcrypt.compare`, issue JWT (`jwt.sign`) with `{ id, name, email, role }` and `expiresIn: '8h'`, update `last_login`, preserve the existing in-memory rate limiter (5 attempts / 15 min per IP)
  - Replace `backend/server/middleware/auth.js` entirely: extract `Authorization: Bearer <token>`, call `jwt.verify(token, process.env.JWT_SECRET)`, query `users` table to confirm `is_active`, attach `req.user`, export both `authMiddleware` and `requireRole(...roles)`
  - Add `requireRole` as a named export: returns a middleware function that checks `req.user.role` against the provided list and returns 403 if not found
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1_

  - [ ]* 2.1 Write property test: invalid credentials always return 401 (Property 2)
    - **Property 2: Invalid credentials always return 401 with exact message**
    - Generate random non-existent emails and random wrong passwords; assert HTTP 401 + `{ "error": "Invalid email or password" }`
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 2.2 Write property test: deactivated user login returns 403 (Property 3)
    - **Property 3: Deactivated user login returns 403**
    - Generate random deactivated users; assert HTTP 403 + `{ "error": "Account is deactivated. Contact your administrator." }`
    - **Validates: Requirements 1.5, 2.6**

  - [ ]* 2.3 Write property test: passwords stored as bcrypt hashes (Property 4)
    - **Property 4: Passwords are stored as bcrypt hashes with cost factor ≥ 12**
    - Generate random plaintext passwords; create user; assert stored hash matches `$2b$12$...` format and `bcrypt.compare` round-trip returns true
    - **Validates: Requirements 1.6, 9.7, 11.3**

  - [ ]* 2.4 Write property test: unauthenticated requests return 401 (Property 8)
    - **Property 8: Unauthenticated requests to protected routes return 401**
    - Generate random `/admin/*` route paths; send request without Authorization header; assert HTTP 401
    - **Validates: Requirements 2.4**

  - [ ]* 2.5 Write property test: invalid or expired JWT returns 401 (Property 9)
    - **Property 9: Invalid or expired JWT returns 401**
    - Generate random invalid/expired JWTs; assert HTTP 401
    - **Validates: Requirements 2.5**

  - [ ]* 2.6 Write property test: requireRole rejects unauthorised roles (Property 10)
    - **Property 10: requireRole rejects unauthorised roles**
    - Generate random (role, allowed-list) pairs where role ∉ list; assert HTTP 403
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

  - [ ]* 2.7 Write property test: deactivated user JWT is rejected (Property 21)
    - **Property 21: Deactivated user's JWT is rejected**
    - Create user, issue JWT, set `is_active = false`, send request with that JWT; assert HTTP 403
    - **Validates: Requirements 9.5**

- [x] 3. Backend: new route files — users, followup, audit, checkin
  - Create `backend/server/routes/users.js`: `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, `DELETE /api/users/:id` — all gated with `requireRole('developer')`; `POST` hashes password with bcrypt cost 12 before insert; `PATCH` supports updating `role` and `is_active`
  - Create `backend/server/routes/followup.js`: `GET /api/followup-logs` (scoped: `followup_head` sees only own entries), `POST /api/followup-logs` (sets `done_by = req.user.id`), `PATCH /api/followup-logs/:id`, `GET /api/followup-logs/export` (scoped PDF export) — gated with `requireRole('developer','followup_head')`; validate `action_type` and `status` enums; return 400 on invalid values
  - Create `backend/server/routes/audit.js`: `GET /api/audit` with filters (date range, user, role, action, module) — gated with `requireRole('developer')`; no DELETE or PATCH endpoints
  - Create `backend/server/routes/checkin.js`: `GET /api/checkin/search?q=` (search members by name or uniqueCode), `POST /api/checkin/mark` (insert attendance record), `GET /api/checkin/headcount` (count for current active event) — gated with `requireRole('developer','usher')`
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.4, 6.5, 6.6, 8.1, 8.4, 8.5, 8.6, 8.7, 8.8, 9.1, 9.3, 9.7, 10.1, 10.5_

  - [ ]* 3.1 Write property test: follow-up log export scoped by role (Property 11)
    - **Property 11: Follow-up log export is scoped by role**
    - Create entries as two different users; assert `followup_head` export returns only own entries; assert `developer` export returns all entries
    - **Validates: Requirements 3.8, 8.7, 8.8**

  - [ ]* 3.2 Write property test: done_by is always the requesting user's id (Property 19)
    - **Property 19: done_by is always the requesting user's id**
    - Generate random users creating follow-up log entries; assert stored `done_by` equals creator's id
    - **Validates: Requirements 8.4**

  - [ ]* 3.3 Write property test: action_type and status enums enforced (Property 20)
    - **Property 20: action_type and status enums are enforced**
    - Generate random invalid enum values for `action_type` and `status`; assert HTTP 400 or 422
    - **Validates: Requirements 8.5, 8.6**

  - [ ]* 3.4 Write property test: audit log entries cannot be deleted or modified (Property 24)
    - **Property 24: Audit log entries cannot be deleted or modified**
    - For each role, attempt DELETE and PATCH on `/api/audit` and `/api/audit/:id`; assert HTTP 403 or 405
    - **Validates: Requirements 10.5**

- [x] 4. Backend: auditLogger helper and wire all routes into index.js
  - Create `backend/server/helpers/auditLogger.js`: export `async function logAudit(req, action, module, targetId)` that inserts into `audit_logs`; wrap the entire function body in try/catch and only `console.error` on failure — never throw
  - Add `logAudit` calls in every mutating handler across `users.js`, `followup.js`, `members.js`, `events.js`, `testimonies.js`, `prayer.js`, `departments.js`, and `giving.js` — call after a successful DB write, never inside the error branch
  - In `backend/server/index.js`: import and mount `usersRouter` at `/api/users`, `followupRouter` at `/api/followup-logs`, `auditRouter` at `/api/audit`, `checkinRouter` at `/api/checkin`; replace the `ADMIN_PASSWORD` warning with a `JWT_SECRET` warning
  - Apply `authMiddleware` globally to all `/api/*` routes except `POST /api/auth/login` and the public attendance/prayer/testimony submission endpoints
  - _Requirements: 2.3, 10.2, 10.3, 10.6_

  - [ ]* 4.1 Write property test: every mutating action produces an audit log entry (Property 22)
    - **Property 22: Every mutating action produces an audit log entry**
    - Generate random mutating actions (create/update/delete/export) on any module; assert `audit_logs` gains exactly one new entry with correct `user_id`, `role`, `action`, `module`, `target_id`, and `created_at` within 5 seconds
    - **Validates: Requirements 10.2**

  - [ ]* 4.2 Write property test: rejected requests do not produce audit log entries (Property 23)
    - **Property 23: Rejected requests do not produce audit log entries**
    - Generate random requests rejected by RBAC_Middleware with HTTP 403; assert `audit_logs` row count does not increase
    - **Validates: Requirements 10.6**

- [ ] 5. Checkpoint — backend complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 6. Frontend: permissions config and AuthContext
  - Create `frontend/src/config/permissions.js`: export `ROLE_PERMISSIONS` (routes array per role, `readOnly` array, `redirectTo` for usher), `ROLE_LABELS`, and `ROLE_COLORS` exactly as specified in the design
  - Create `frontend/src/context/AuthContext.jsx`: provide `{ user, token, login(token, user), logout(), isAuthenticated }`; on mount decode `adminToken` from localStorage and check expiry; on expiry clear storage and redirect to `/admin/login`; `login()` stores `adminToken` + `adminUser`; `logout()` removes both keys and redirects
  - _Requirements: 2.1, 2.2, 2.8, 5.5_

  - [ ]* 6.1 Write property test: localStorage keys are correct after login (Property 7)
    - **Property 7: localStorage keys are correct after login**
    - Generate random valid login responses; call `login(token, user)`; assert `localStorage.getItem('adminToken')` equals the JWT and `JSON.parse(localStorage.getItem('adminUser'))` equals `{ id, name, email, role }`
    - **Validates: Requirements 2.1**

- [x] 7. Frontend: update ProtectedRoute and api.js getAuthHeaders
  - Update `frontend/src/components/Admin/ProtectedRoute.jsx`: read `user` and `isAuthenticated` from `AuthContext` (via `useAuth()`) instead of raw localStorage keys; redirect usher to `/admin/check-in` on successful auth; wrap the component tree with `<AuthContext.Provider>` at this level
  - Update `frontend/src/services/api.js`: add `export function getAuthHeaders()` that reads `adminToken` from localStorage and returns `{ 'Authorization': 'Bearer <token>' }` or `{}` if absent; add a global 401 response interceptor that calls `AuthContext.logout()` and redirects to `/admin/login`
  - _Requirements: 2.2, 2.3, 6.2_

- [x] 8. Frontend: update Sidebar, TopNavbar, and create RoleBadge
  - Create `frontend/src/components/Admin/RoleBadge.jsx`: accept `role` prop; render a pill using `ROLE_LABELS[role]` as text and `ROLE_COLORS[role]` as background colour
  - Update `frontend/src/components/Admin/Sidebar.jsx`: import `useAuth` from `AuthContext`; filter nav items against `ROLE_PERMISSIONS[user.role].routes`; replace `localStorage.removeItem('adminKey')` logout logic with `AuthContext.logout()`; add new nav items for Follow-Up Log (`/admin/followup`), User Management (`/admin/users`), Audit Log (`/admin/audit`), and Check-In (`/admin/check-in`) — each conditionally rendered per the permission matrix
  - Update `frontend/src/components/Admin/TopNavbar.jsx`: import `useAuth`; replace `org.churchName` / `org.parish` in the user profile area with `user.name` and `<RoleBadge role={user.role} />`; replace all `{ 'x-admin-key': adminKey }` headers in the notifications fetch calls with `{ ...getAuthHeaders() }`
  - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.1 Write property test: Sidebar renders only permitted nav items (Property 12)
    - **Property 12: Sidebar renders only permitted nav items**
    - For each of the five roles, render `Sidebar` with `AuthContext` providing that role; assert rendered nav items are a subset of `ROLE_PERMISSIONS[role].routes` and no unpermitted item is present
    - **Validates: Requirements 4.1, 5.4**

  - [ ]* 8.2 Write property test: TopNavbar displays correct name and role badge (Property 15)
    - **Property 15: TopNavbar displays correct name and role badge**
    - For each role, render `TopNavbar` with a mock `AuthContext`; assert user name is displayed and `RoleBadge` shows `ROLE_LABELS[role]` with `ROLE_COLORS[role]`
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 9. Frontend: create PermissionGuard component
  - Create `frontend/src/components/Admin/PermissionGuard.jsx`: accept `route` and `children` props; read `user.role` from `AuthContext`; if route not in `ROLE_PERMISSIONS[role].routes`, redirect to `/admin/live` (or `/admin/check-in` for usher) and show an `Access_Denied_Toast` with the message "You don't have permission to access that page."; if permitted with restrictions, clone children with `{ readOnly: true, viewMode: 'summary' }` props as appropriate per the permission matrix
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 6.7_

  - [ ]* 9.1 Write property test: PermissionGuard redirects unpermitted routes (Property 13)
    - **Property 13: PermissionGuard redirects unpermitted routes**
    - Generate random (role, route) pairs where route is not in `ROLE_PERMISSIONS[role].routes`; render `PermissionGuard`; assert redirect to `/admin/live` (or `/admin/check-in` for usher) and `Access_Denied_Toast` is shown
    - **Validates: Requirements 4.2, 6.7**

  - [ ]* 9.2 Write property test: Export button visibility follows role (Property 14)
    - **Property 14: Export button visibility follows role**
    - For each role, render the Dashboard wrapped in `PermissionGuard`; assert Export Data button is present for `developer` and `church_admin` and absent for all other roles
    - **Validates: Requirements 4.9**

- [x] 10. Frontend: update AdminLoginPage
  - Replace the single password `<input>` in `frontend/src/pages/Admin/AdminLoginPage.jsx` with an email field (`type="email"`, id `"email"`) and a password field (`type="password"`, id `"pw"`)
  - Add inline validation: if either field is empty on submit, set an inline error and return without making a network request
  - Update the `fetch` body to send `{ email, password }` instead of `{ password }`
  - On success, call `AuthContext.login(data.token, data.user)` instead of writing to `adminKey` / `adminTokenExpiry`; redirect usher to `/admin/check-in`, all others to `/admin/live`
  - If a valid non-expired `adminToken` is already in localStorage on mount, redirect directly to `/admin/live` (or `/admin/check-in` for usher) without showing the form
  - _Requirements: 1.8, 1.9, 2.2_

  - [ ]* 10.1 Write property test: empty-field form submission is rejected client-side (Property 6)
    - **Property 6: Empty-field form submission is rejected client-side**
    - Generate random combinations of empty/non-empty email and password; render `AdminLoginPage`; assert no network request is made when either field is empty and an inline error is displayed
    - **Validates: Requirements 1.9**

- [x] 11. Frontend: update main.jsx routes with PermissionGuard
  - In `frontend/src/main.jsx`, wrap the `<AuthContext.Provider>` around the `<ProtectedRoute />` subtree
  - Wrap each existing `<Route>` element inside the admin layout with `<PermissionGuard route="/admin/<path>">` passing the correct route string
  - Add new `<Route>` entries for `/admin/followup`, `/admin/users`, `/admin/audit`, and `/admin/check-in`, each wrapped with `<PermissionGuard>`
  - Import and add the four new page components (`FollowUpLogPage`, `UserManagementPage`, `AuditLogPage`, `UsherCheckInPage`) to `AdminWrapper.jsx` following the existing export pattern
  - _Requirements: 4.2, 4.4, 6.2, 6.7, 8.1, 9.1, 10.1_

- [x] 12. Frontend: permission overlays on existing pages
  - Update `frontend/src/pages/Admin/AbsenteesPage.jsx`: accept `readOnly` and `viewMode` props from `PermissionGuard`; when `viewMode === 'summary'` render only the aggregate count card (no names or phone numbers); when `readOnly === true` render the full list but hide the "Follow Up" action button column; when neither prop is set render the full list with action buttons
  - Update `frontend/src/components/Admin/AnalyticsDashboard.jsx`: accept `readOnly` prop; when `readOnly === true` hide the Export button
  - Update `frontend/src/pages/Admin/EventsPage.jsx`: accept `readOnly` prop; when `readOnly === true` hide create, edit, and delete controls
  - Update `frontend/src/pages/Admin/PrayerPage.jsx`: accept `readOnly` prop; when `readOnly === true` hide approve, hide, and delete action controls
  - Update `frontend/src/pages/Admin/TestimoniesPage.jsx`: accept `readOnly` prop; when `readOnly === true` hide approve, hide, and delete action controls
  - Update `frontend/src/pages/Admin/Dashboard.jsx` (AdminLive / AdminWrapper): accept `readOnly` prop; when `readOnly === true` hide the Export Data button
  - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

- [x] 13. Frontend: new pages — FollowUpLog, UserManagement, AuditLog, UsherCheckIn
  - Create `frontend/src/pages/Admin/FollowUpLogPage.jsx`: table with columns Member Name, Action Taken, Note, Done By, Date, Status badge; filter controls for date range, status, Done By; create-entry form with `action_type` select and `note` textarea; PDF export button (visible to both roles, scoped server-side); all fetch calls use `getAuthHeaders()`
  - Create `frontend/src/pages/Admin/UserManagementPage.jsx`: table with Name, Email, Role badge, Status, Last Login, Created Date; action buttons for Create, Edit role, Deactivate/Reactivate, Delete; dismissible temp-password modal shown on create when email is not configured; all fetch calls use `getAuthHeaders()`
  - Create `frontend/src/pages/Admin/AuditLogPage.jsx`: read-only table in reverse chronological order; filter controls for date range, user, role, action type, module; no delete or edit controls; all fetch calls use `getAuthHeaders()`
  - Create `frontend/src/pages/Admin/UsherCheckInPage.jsx`: mobile-first layout (min-width 375px); search input for name or unique code; member name display on match; "Mark Attendance" button; live headcount display; all fetch calls use `getAuthHeaders()`
  - _Requirements: 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.1, 9.2, 9.3, 9.4, 10.1, 10.4_

  - [ ]* 13.1 Write property test: follow-up log filtering is correct (Property 18)
    - **Property 18: Follow-up log filtering is correct**
    - Generate random follow-up log datasets and filter combinations (date range, status, done_by); assert all returned entries satisfy every active filter and no qualifying entry is omitted
    - **Validates: Requirements 8.3**

  - [ ]* 13.2 Write property test: usher check-in search returns matching members (Property 16)
    - **Property 16: Usher check-in search returns matching members**
    - For any member in the database, search by name or unique code; assert the result set includes that member
    - **Validates: Requirements 6.4**

- [ ] 14. Checkpoint — frontend complete
  - Ensure all frontend tests pass, ask the user if questions arise.

- [x] 15. Migrate all admin fetch calls from x-admin-key to Authorization Bearer
  - Search all files under `frontend/src/` for `'x-admin-key'` and replace each occurrence with `...getAuthHeaders()` (spread into the headers object); import `getAuthHeaders` from `../../services/api` (or the correct relative path) in each file that needs it
  - Files expected to need migration: `MembersPage.jsx`, `EventsPage.jsx`, `PrayerPage.jsx`, `TestimoniesPage.jsx`, `DepartmentsPage.jsx`, `SettingsPage.jsx`, `GivingPage.jsx`, `AnalyticsDashboard.jsx`, `AdminAssistant.jsx`, `TopNavbar.jsx` (already handled in task 8), and any other file containing `x-admin-key`
  - Remove all reads of `localStorage.getItem('adminKey')` that were used solely for the `x-admin-key` header; replace with `getAuthHeaders()`
  - Remove the old `adminKey` and `adminTokenExpiry` localStorage keys from any remaining code paths (they are superseded by `adminToken` and `adminUser`)
  - _Requirements: 2.8_

- [ ] 16. Backend: JWT payload completeness and expiry property test
  - Write a property-based test for Property 1 using `fast-check` and Jest
  - **Property 1: JWT payload completeness and expiry**
  - For any valid user record, a successful login returns a JWT whose decoded payload contains `id`, `name`, `email`, and `role` matching the user record, and whose `exp` is within 8 hours (± 5 seconds) of issuance
  - **Validates: Requirements 1.2**

  - [ ]* 16.1 Write property test: successful login updates last_login (Property 5)
    - **Property 5: Successful login updates last_login**
    - For any valid user, after a successful login assert `last_login` in the `users` table is updated to within 5 seconds of the login time
    - **Validates: Requirements 1.7**

- [ ] 17. Final checkpoint — all tests pass
  - Ensure all backend and frontend tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with `{ numRuns: 100 }` minimum; tag each test with `// Feature: rbac-multi-user-auth, Property N: <property_text>`
- The `PermissionGuard` thin-wrapper pattern means existing pages only need `readOnly` / `viewMode` props — no role logic inside the pages themselves
- The `logAudit` helper must never throw; audit write failures are logged to console only
- During the transitional period, the backend continues to accept the old `ADMIN_PASSWORD` flow when `email` is absent from the login body
- `bcryptjs` (pure JS) is used instead of `bcrypt` to avoid native binding issues on Render/Vercel
