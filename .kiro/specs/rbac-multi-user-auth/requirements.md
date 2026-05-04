# Requirements Document

## Introduction

This feature replaces the existing single-password admin login of the Dominion City / Olive Parish Church Attendance Management System with a full Role-Based Access Control (RBAC) system. The current system uses one shared password for all admin access. The new system introduces five distinct roles — Developer, Church Admin, Follow-Up Head, Pastor, and Usher — each with precisely scoped permissions across all existing admin pages and two new modules (Follow-Up Log and User Management). Authentication is upgraded to email + password with JWT tokens. All existing pages, branding, and public-facing routes remain unchanged; only the admin layer is extended.

---

## Glossary

- **Auth_Service**: The backend authentication service responsible for validating credentials and issuing JWT tokens.
- **RBAC_Middleware**: The backend middleware that validates JWT tokens and enforces role-based access on every `/admin/*` route.
- **Auth_Context**: The frontend React context that stores the authenticated user's identity, role, and token, and exposes it to all admin components.
- **Permission_Guard**: The frontend component that wraps admin pages and redirects or restricts rendering based on the current user's role.
- **Sidebar**: The existing admin sidebar navigation component that renders nav items.
- **TopNavbar**: The existing admin top navigation bar component that displays the user profile area.
- **User**: A person with an account in the system, identified by email and assigned exactly one role.
- **Role**: An enumerated value — `developer`, `church_admin`, `followup_head`, `pastor`, or `usher` — that determines a User's permissions.
- **Developer**: The super-admin role with unrestricted access to all modules including User Management and Audit Log.
- **Church_Admin**: The role with full access to all pastoral and attendance modules except User Management and Audit Log.
- **Follow_Up_Head**: The role focused on absentee follow-up actions and the Follow-Up Log module.
- **Pastor**: The read-only role with access to dashboards, analytics (no export), and pastoral content.
- **Usher**: The feature-flagged role restricted to the mobile-optimised Check-In interface only.
- **JWT**: JSON Web Token — a signed token containing the user's id, email, name, and role, with an 8-hour expiry.
- **Audit_Log**: A tamper-evident record of every create, update, delete, and export action performed by any User.
- **Follow_Up_Log**: A module for recording follow-up actions (called, visited, note, resolved) taken on absent members.
- **Temp_Password**: A system-generated one-time password displayed on screen when email delivery is not configured.
- **Role_Badge**: A colour-coded label displayed in the TopNavbar identifying the current user's role.
- **Access_Denied_Toast**: A non-blocking notification shown when a User attempts to access a route outside their permitted scope.

---

## Requirements

### Requirement 1: Email and Password Authentication

**User Story:** As a church staff member, I want to log in with my email address and password, so that my identity is individually verified and my access is scoped to my role.

#### Acceptance Criteria

1. THE Auth_Service SHALL accept an email address and a password as login credentials.
2. WHEN a User submits valid credentials, THE Auth_Service SHALL return a signed JWT containing the user's `id`, `name`, `email`, and `role`, with an expiry of exactly 8 hours from the time of issuance.
3. WHEN a User submits an email address that does not exist in the `users` table, THE Auth_Service SHALL return an error response with HTTP status 401 and the message "Invalid email or password".
4. WHEN a User submits a correct email address but an incorrect password, THE Auth_Service SHALL return an error response with HTTP status 401 and the message "Invalid email or password".
5. WHEN a User whose `is_active` flag is `false` submits valid credentials, THE Auth_Service SHALL return an error response with HTTP status 403 and the message "Account is deactivated. Contact your administrator."
6. THE Auth_Service SHALL store passwords as bcrypt hashes with a minimum cost factor of 12; plaintext passwords SHALL NOT be stored.
7. WHEN a login attempt is made, THE Auth_Service SHALL update the `last_login` timestamp for the corresponding User record on successful authentication.
8. THE AdminLoginPage SHALL replace the existing single password field with an email field and a password field.
9. IF the login form is submitted with an empty email or empty password field, THEN THE AdminLoginPage SHALL display an inline validation error without submitting the request to the server.
10. WHEN a JWT expires, THE Auth_Context SHALL clear the stored token and redirect the User to `/admin/login`.

---

### Requirement 2: JWT-Based Session Management

**User Story:** As a system administrator, I want all admin API requests to be authenticated via JWT, so that only valid, role-bearing sessions can access protected resources.

#### Acceptance Criteria

1. THE Auth_Context SHALL store the JWT in `localStorage` under the key `adminToken` and the decoded user object (id, name, email, role) under `adminUser`.
2. WHEN the AdminLoginPage mounts and a valid, non-expired JWT is already present in `localStorage`, THE Auth_Context SHALL redirect the User directly to `/admin/live` without requiring re-authentication.
3. THE RBAC_Middleware SHALL extract the JWT from the `Authorization: Bearer <token>` header on every request to `/admin/*` routes.
4. WHEN a request arrives at a protected route without a JWT, THE RBAC_Middleware SHALL return HTTP 401.
5. WHEN a request arrives with a JWT whose signature is invalid or whose expiry has passed, THE RBAC_Middleware SHALL return HTTP 401.
6. WHEN a request arrives with a valid JWT but the User's `is_active` flag is `false`, THE RBAC_Middleware SHALL return HTTP 403.
7. THE RBAC_Middleware SHALL attach the decoded user object to `req.user` for use by downstream route handlers.
8. THE existing `adminKey` / `adminTokenExpiry` localStorage keys SHALL be removed and replaced by `adminToken` and `adminUser` during the migration.

---

### Requirement 3: Role-Based Route Protection (Backend)

**User Story:** As a system administrator, I want every admin API endpoint to enforce role permissions, so that users cannot access data or perform actions outside their authorised scope.

#### Acceptance Criteria

1. THE RBAC_Middleware SHALL expose a `requireRole(...roles)` helper that returns HTTP 403 when `req.user.role` is not in the provided list.
2. WHEN a User with role `pastor` sends a request to any endpoint that performs a create, update, or delete operation, THE RBAC_Middleware SHALL return HTTP 403.
3. WHEN a User with role `usher` sends a request to any `/admin/*` endpoint other than the check-in attendance endpoint, THE RBAC_Middleware SHALL return HTTP 403.
4. WHEN a User with role `followup_head` sends a request to the Members CRUD endpoints (create, update, delete), THE RBAC_Middleware SHALL return HTTP 403.
5. THE `/api/users` endpoint group SHALL be accessible only to Users with role `developer`.
6. THE `/api/audit` endpoint SHALL be accessible only to Users with role `developer`.
7. THE `/api/followup-logs` endpoint group SHALL be accessible only to Users with roles `developer` or `followup_head`.
8. THE export endpoint for follow-up logs SHALL return only entries where `done_by = req.user.id` when the requesting User has role `followup_head`, and all entries when the requesting User has role `developer`.

---

### Requirement 4: Role-Based Route Protection (Frontend)

**User Story:** As a church staff member, I want the admin interface to show only the pages and actions I am permitted to use, so that I am not confused by controls that do not apply to my role.

#### Acceptance Criteria

1. THE Sidebar SHALL render only the navigation items that are permitted for the current User's role, as defined in the role-permission matrix in Requirement 7.
2. WHEN a User navigates directly to a URL for a page outside their permitted scope, THE Permission_Guard SHALL redirect the User to `/admin/live` and display an Access_Denied_Toast.
3. THE Access_Denied_Toast message SHALL read "You don't have permission to access that page."
4. THE Permission_Guard SHALL never return an HTTP 404 response for any `/admin/*` route; all access-denied cases SHALL redirect to `/admin/live`.
5. WHEN a User with role `pastor` views the Analytics page, THE Permission_Guard SHALL hide the Export button.
6. WHEN a User with role `pastor` views the Absentees page, THE Permission_Guard SHALL render a summary card showing aggregate counts only, with no member names or phone numbers visible.
7. WHEN a User with role `church_admin` views the Absentees page, THE Permission_Guard SHALL render the full absentee list without action buttons.
8. WHEN a User with role `followup_head` views the Absentees page, THE Permission_Guard SHALL render the full absentee list with all follow-up action buttons enabled.
9. WHEN a User with role `church_admin` or `developer` views the Dashboard, THE Permission_Guard SHALL render the Export Data button; for all other roles, THE Permission_Guard SHALL hide the Export Data button.
10. WHEN a User with role `pastor` views the Events, Prayer Requests, or Testimonies pages, THE Permission_Guard SHALL render those pages in read-only mode with all create, edit, and delete controls hidden.
11. WHEN a User with role `church_admin` or `developer` views the Prayer Requests or Testimonies pages, THE Permission_Guard SHALL render approve, hide, and delete action controls.

---

### Requirement 5: Dynamic Sidebar and Role Badge

**User Story:** As a logged-in staff member, I want to see my name, role, and only the navigation items relevant to my role, so that the interface reflects my identity and access level at a glance.

#### Acceptance Criteria

1. THE TopNavbar SHALL display the current User's name and a Role_Badge in the top-right user profile area.
2. THE Role_Badge colour SHALL follow this mapping: `developer` = coral/red (`#ef4444`), `church_admin` = blue (`#2563eb`), `followup_head` = purple (`#7c3aed`), `pastor` = green (`#16a34a`), `usher` = amber (`#d97706`).
3. THE Role_Badge label SHALL display the human-readable role name: "Developer", "Church Admin", "Follow-Up Head", "Pastor", "Usher".
4. THE Sidebar SHALL read the current User's role from Auth_Context and conditionally render nav items according to the role-permission matrix in Requirement 7.
5. WHEN the User logs out, THE Auth_Context SHALL clear `adminToken` and `adminUser` from `localStorage` and redirect to `/admin/login`.

---

### Requirement 6: Usher Check-In Interface

**User Story:** As an usher, I want a mobile-optimised check-in interface, so that I can quickly search for members and mark their attendance during a service without accessing any other admin functionality.

#### Acceptance Criteria

1. WHERE the Usher feature flag is enabled, THE Sidebar SHALL render only a "Check-In" navigation item for Users with role `usher`.
2. WHEN a User with role `usher` logs in successfully, THE Auth_Context SHALL redirect the User to `/admin/check-in` instead of `/admin/live`.
3. THE Usher check-in page SHALL be mobile-responsive and optimised for touch interaction on screens 375px wide and above.
4. THE Usher check-in page SHALL allow the Usher to search for a member by name or unique code.
5. WHEN a matching member is found, THE Usher check-in page SHALL display the member's name and allow the Usher to mark attendance for the currently active event.
6. THE Usher check-in page SHALL display a live headcount of attendees for the current event.
7. WHEN a User with role `usher` attempts to navigate to any `/admin/*` route other than `/admin/check-in`, THE Permission_Guard SHALL redirect the User to `/admin/check-in`.

---

### Requirement 7: Role-Permission Matrix

**User Story:** As a Developer, I want a single authoritative definition of which roles can access which modules, so that permissions are applied consistently across the frontend and backend.

#### Acceptance Criteria

1. THE system SHALL enforce the following permission matrix:

   | Module / Action              | Developer | Church Admin | Follow-Up Head | Pastor | Usher |
   |------------------------------|-----------|--------------|----------------|--------|-------|
   | Dashboard (view)             | ✅        | ✅           | ✅ (read only) | ✅ (read only) | ❌ |
   | Dashboard (export button)    | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Analytics (view)             | ✅        | ✅           | ❌             | ✅ (no export) | ❌ |
   | Analytics (export)           | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Events (view)                | ✅        | ✅           | ❌             | ✅ (read only) | ❌ |
   | Events (create/edit/delete)  | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Members (view)               | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Members (create/edit/delete) | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Departments (view/CRUD)      | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Absentees (full list)        | ✅        | ✅           | ✅             | ❌     | ❌    |
   | Absentees (action buttons)   | ✅        | ❌           | ✅             | ❌     | ❌    |
   | Absentees (summary card only)| ❌        | ❌           | ❌             | ✅     | ❌    |
   | Prayer Requests (view)       | ✅        | ✅           | ❌             | ✅ (read only) | ❌ |
   | Prayer Requests (moderate)   | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Testimonies (view)           | ✅        | ✅           | ❌             | ✅ (read only) | ❌ |
   | Testimonies (moderate)       | ✅        | ✅           | ❌             | ❌     | ❌    |
   | QR Generator                 | ✅        | ✅           | ❌             | ❌     | ❌    |
   | Follow-Up Log (view/action)  | ✅        | ❌           | ✅             | ❌     | ❌    |
   | Follow-Up Log (export all)   | ✅        | ❌           | ❌             | ❌     | ❌    |
   | Follow-Up Log (export own)   | ❌        | ❌           | ✅             | ❌     | ❌    |
   | User Management              | ✅        | ❌           | ❌             | ❌     | ❌    |
   | Audit Log                    | ✅        | ❌           | ❌             | ❌     | ❌    |
   | Check-In (usher interface)   | ✅        | ❌           | ❌             | ❌     | ✅    |
   | Settings                     | ✅        | ✅           | ❌             | ❌     | ❌    |

---

### Requirement 8: Follow-Up Log Module

**User Story:** As a Follow-Up Head, I want to record and track follow-up actions taken on absent members, so that pastoral care is documented and accountable.

#### Acceptance Criteria

1. THE Follow_Up_Log module SHALL be accessible at `/admin/followup` for Users with roles `developer` or `followup_head`.
2. THE Follow_Up_Log module SHALL display a table with columns: Member Name, Action Taken, Note, Done By, Date, and Status badge.
3. THE Follow_Up_Log module SHALL support filtering by date range, status, and the "Done By" user.
4. WHEN a Follow_Up_Head creates a follow-up log entry, THE system SHALL record the `done_by` field as the current User's id.
5. THE `action_type` field SHALL accept exactly one of the values: `called`, `visited`, `note`, `resolved`.
6. THE `status` field SHALL accept exactly one of the values: `pending`, `in_progress`, `resolved`.
7. WHEN a User with role `followup_head` requests a PDF export of the Follow-Up Log, THE system SHALL include only entries where `done_by` equals the requesting User's id.
8. WHEN a User with role `developer` requests a PDF export of the Follow-Up Log, THE system SHALL include all entries.
9. THE `followup_logs` table SHALL have the schema: `id`, `member_id`, `action_type ENUM(called|visited|note|resolved)`, `note TEXT`, `done_by` (references `users.id`), `status ENUM(pending|in_progress|resolved)`, `created_at`.

---

### Requirement 9: User Management Module

**User Story:** As a Developer, I want to create and manage user accounts with assigned roles, so that I can control who has access to the admin system and at what permission level.

#### Acceptance Criteria

1. THE User Management module SHALL be accessible at `/admin/users` for Users with role `developer` only.
2. THE User Management module SHALL display a table with columns: Name, Email, Role badge, Status, Last Login, and Created Date.
3. THE User Management module SHALL provide actions to: Create a new user, Edit a user's role, Deactivate or Reactivate a user, and Delete a user.
4. WHEN a new user is created and email delivery is not configured, THE User Management module SHALL display the temporary password on screen in a dismissible modal.
5. WHEN a user is deactivated, THE system SHALL set `is_active = false` for that user record; the user's existing JWT SHALL be rejected by THE RBAC_Middleware on the next request.
6. THE `users` table SHALL have the schema: `id`, `name`, `email` (unique), `password_hash`, `role ENUM(developer|church_admin|followup_head|pastor|usher)`, `is_active BOOLEAN DEFAULT true`, `last_login`, `created_at`, `created_by` (references `users.id`).
7. WHEN a Developer creates a user, THE system SHALL hash the provided or generated password using bcrypt with a minimum cost factor of 12 before storing it.
8. THE system SHALL seed the following default users on first initialisation: `developer@dominioncity.com` (role: developer), `admin@dominioncity.com` (role: church_admin), `followup@dominioncity.com` (role: followup_head), `pastor@dominioncity.com` (role: pastor), `usher@dominioncity.com` (role: usher).

---

### Requirement 10: Audit Log Module

**User Story:** As a Developer, I want every create, update, delete, and export action to be logged with full context, so that I can audit system activity and investigate incidents.

#### Acceptance Criteria

1. THE Audit_Log module SHALL be accessible at `/admin/audit` for Users with role `developer` only.
2. WHEN any User performs a create, update, delete, or export action on any module, THE system SHALL write an entry to the `audit_logs` table containing: `user_id`, `role`, `action` (one of `create`, `update`, `delete`, `export`), `module` (e.g. `members`, `events`, `followup_logs`), `target_id`, `ip_address`, and `created_at`.
3. THE `audit_logs` table SHALL have the schema: `id`, `user_id` (references `users.id`), `role`, `action`, `module`, `target_id`, `ip_address`, `created_at`.
4. THE Audit_Log module SHALL display entries in reverse chronological order with filters for date range, user, role, action type, and module.
5. THE Audit_Log module SHALL NOT allow any User to delete or modify audit log entries.
6. WHEN the RBAC_Middleware rejects a request with HTTP 403, THE system SHALL NOT write an audit log entry for that rejected action.

---

### Requirement 11: Seed Data and Initial Setup

**User Story:** As a Developer deploying the system, I want the database to be pre-seeded with default user accounts, so that the system is immediately usable after deployment without manual setup.

#### Acceptance Criteria

1. THE system SHALL create the `users`, `followup_logs`, and `audit_logs` tables during database initialisation if they do not already exist.
2. THE system SHALL seed the following five default user accounts if no users exist in the `users` table:
   - `developer@dominioncity.com` / `Dev@2025!` / role: `developer`
   - `admin@dominioncity.com` / `Admin@2025!` / role: `church_admin`
   - `followup@dominioncity.com` / `Follow@2025!` / role: `followup_head`
   - `pastor@dominioncity.com` / `Pastor@2025!` / role: `pastor`
   - `usher@dominioncity.com` / `Usher@2025!` / role: `usher`
3. THE system SHALL hash all seed passwords using bcrypt with a minimum cost factor of 12 before inserting them.
4. THE system SHALL NOT re-seed users if the `users` table already contains one or more records.
5. WHEN the existing `ADMIN_PASSWORD` environment variable is present, THE system SHALL continue to accept it for a transitional period of one release cycle to avoid breaking existing deployments, after which it SHALL be ignored.
