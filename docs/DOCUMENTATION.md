# OMeet Master System Documentation

Welcome to the central master documentation for **OMeet**. All system designs, workflows, user journeys, architecture decisions, and FAQs are cataloged here under unified headings for fast reference.

---

## 1. Authentication, Account Creation & User Onboarding

> **Database Reference:** See [DATABASE_SCHEMA.md — Table 1: users](./DATABASE_SCHEMA.md#table-1-users) for the corresponding database table, DDL, and indexes.

### 1.1 Architectural Strategy: Google OAuth 2.0
OMeet delegates user identity authentication to **Google OAuth 2.0**:
* **No Passwords:** We do not maintain or store user passwords. This eliminates password hashing, salt management, reset-password tokens, and credential leak risks.
* **Built-in Verification:** Google guarantees the email is verified, eliminating the need to send 6-digit email OTPs.
* **Instant Baseline Profile:** The Google OAuth token provides verified identity data upfront: Google Subject ID (`google_id`), verified `email`, `name`, and Google profile photo.
* **Google Client Configuration:**
  * Configured in `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`.
  * Configured in `backend/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
  * Official Google OAuth popup enabled via `@react-oauth/google` on the client and token verification via `google-auth-library` on the backend.

---

### 1.2 User Journey & State Flow

```mermaid
flowchart TD
    A[User clicks 'Continue with Google'] --> B[Google OAuth 2.0 Popup / Consent]
    B --> C[Backend receives Google Profile & Token]
    C --> D{User exists in DB?}
    
    D -- No --> E[Insert row: email, name, google_id with is_onboarded = FALSE]
    E --> F[Show 1-Step Onboarding Modal: 'Complete Your Profile']
    
    D -- Yes --> G{is_onboarded == TRUE?}
    G -- No --> F
    G -- Yes --> H[Redirect directly to Workspace / Home Dashboard]
    
    F --> I[User enters: Username, Avatar choice, Phone, Bio, Timezone]
    I --> J{Username already taken?}
    J -- Yes --> K[Input turns RED: 'Already used by someone' & Disable Submit]
    J -- No --> L[Input turns GREEN: 'Username is available']
    L --> M[User clicks 'Complete Setup']
    M --> N[Update DB row with username, avatar, bio, phone & set is_onboarded = TRUE]
    N --> H
```

---

### 1.3 What We Ask the User (The 1-Step Profile Setup Screen)

When a user signs in for the very first time, they see a single clean card to finalize their profile:

| Field | Source / Requirement | Default / Initial State | UX & Validation Behavior |
| :--- | :--- | :--- | :--- |
| **Email** | From Google (**Locked**) | User's Google Email | Read-only. Verified by Google. Cannot be edited. |
| **Full Name** | From Google (**Editable**) | Google Profile Name | Pre-filled (e.g., `"Suryansh Rao"`). User can edit if they prefer a different display name. |
| **Username (`user_id`)** | **Required (User Input)** | **Blank** (No auto-suggest) | Alphanumeric handle (e.g. `suryansh_07`). Checked in real-time:<br>• **Red Border** + small red text: `"Already used by someone"` (Submit disabled).<br>• **Green Border** + small green text: `"Username is available"`. |
| **Profile Photo (`avatar_url`)** | **User Choice** | Google Photo selected | User chooses from 2 instant options (or custom link):<br>1. **Google Photo:** Fetched from Google account.<br>2. **Alphabet Initial Badge:** Dynamic URL based on initials (e.g. `https://ui-avatars.com/api/?name=Suryansh+Rao&background=2563eb&color=ffffff`). |
| **Phone Number** | **Optional** | `NULL` (Empty) | Optional phone input with country code (e.g., `+91 9876543210`). |
| **Gender** | **Required (User Choice)** | `"male"` | 3 exclusive options: **Male**, **Female**, **Others**. Interactive pill buttons. |
| **Brief Intro / Bio** | **Optional** | `NULL` (Empty) | Short 1–2 sentence headline (max 255 chars). Shown on member cards and org tree nodes. |
| **Timezone** | **Automated** (Pre-selected) | Browser-detected timezone | Detected automatically via `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g. `"Asia/Kolkata"`). Pre-selected in a dropdown so user does not have to type it. |

---

### 1.4 Frequently Asked Questions & Design Decisions (Refresher)

#### Q1: What is the difference between `google_id` and `email`?
* **`google_id` (Google Subject ID / `sub`):** A permanent 21-digit numeric identifier assigned by Google (e.g. `'104829374019284729103'`). **It never changes**, even if the user updates their Google email address or renames their corporate workspace domain. It is our permanent, immutable authentication anchor.
* **`email`:** The human-readable communication address (e.g. `'suryansh@gmail.com'`). It is used for displaying to other members, sending meeting notifications, and logging in.
* **Why keep both?** If a user changes their Google email, their `google_id` remains identical, ensuring they never lose their account or workspace access.

#### Q2: What is the function of `is_onboarded`?
* When someone signs in with Google for the first time, their database row is created immediately. However, they haven't picked their `username`, bio, or phone yet.
* While `is_onboarded = FALSE`, our frontend routes them to the **"Complete Your Profile"** onboarding screen.
* Once they submit their username and preferences, `is_onboarded` flips to `TRUE`.
* On every future login, the system sees `is_onboarded === TRUE` and skips onboarding, taking them straight to the Dashboard.

#### Q3: What is the function of `created_at` and `updated_at`?
* **`created_at`:** Immutable registration timestamp. Used for audit trails and showing *"Member since [Month Year]"* on member cards.
* **`updated_at`:** Automatically updates whenever the user edits their profile (bio, photo, phone). Used for cache invalidation and tracking profile freshness.

#### Q4: Why do we need `timezone`?
* OMeet is a meeting and collaboration platform. Correctly displaying meeting times, availability, and active working hours across distributed international teams requires knowing each participant's local timezone.
* Browser detection (`Intl.DateTimeFormat().resolvedOptions().timeZone`) gets this with zero user effort.

#### Q5: Why is there no username auto-suggestion, and how does the Red/Green validation work?
* The username box starts blank so users have full freedom to choose their preferred handle.
* As they type, OMeet checks the database:
  * **If already taken:** Input border turns **Red** with text `"Already used by someone"`. Submit button is disabled.
  * **If available:** Input border turns **Green** with text `"Username is available"`.

---

## 2. Neon Cloud PostgreSQL Architecture & Integration (Date: 2026-09-05)

### 2.1 Cloud Database Provisioning
* **Provider:** [Neon](https://neon.tech) Serverless PostgreSQL (`us-east-2`).
* **Connection Type:** Connection pooling with SSL enabled (`sslmode=require`).
* **Environment Variable:** Configured in `backend/.env` as `DATABASE_URL`.
* **Backend Driver:** `pg` (node-postgres) with connection pooling (`pg.Pool`).

---

### 2.2 FAQ: Can we create tables from code without ever opening the Neon webpage?
* **YES, absolutely!** You never have to manually click or paste SQL in the webpage console.
* **How it works (Automated Code-First Init):**
  * We created an initialization script in `backend/src/db/init.ts` (runnable via `npm run db:init`).
  * The backend server (`backend/src/server.ts`) also automatically runs `initializeDatabase()` upon startup.
  * It connects to Neon and executes:
    ```sql
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT NOT NULL,
      phone VARCHAR(20) NULL,
      bio VARCHAR(255) NULL,
      timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
      is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
    ```
  * **Benefit:** You can deploy or reset the backend anywhere, and all tables and indexes are self-provisioning.

---

### 2.3 FAQ: Do we have to be connected to the database all the time for real-time username checks?
* **Short Answer:** **NO.** The browser is never directly connected to the database.
* **How it actually works (The Fast HTTP + Connection Pool Pattern):**
  1. **Debounced Browser Input:** As the user types in the `@username` box, the React component waits for a **200ms pause** (`debounce`). This prevents firing a request on every single keystroke.
  2. **Fast REST Endpoint:** The frontend makes a single HTTP GET request:
     ```http
     GET http://localhost:5000/api/users/check-username?username=suryansh_dev
     ```
  3. **Backend Connection Pool (`pg.Pool`):** The Node backend maintains 2–10 persistent, lightweight connection channels to Neon. It doesn't negotiate a slow handshake each time; it grabs an existing connection in under 1 millisecond.
  4. **Indexed B-Tree Query:** PostgreSQL runs:
     ```sql
     SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;
     ```
     Because `username` has a unique B-Tree index, PostgreSQL answers in **~1–2 milliseconds**.
  5. **Instant UI Response:**
     * If row exists: Returns `{ available: false }` &rarr; Box turns **Red** (`"Already used by someone"`).
     * If no row: Returns `{ available: true }` &rarr; Box turns **Green** (`"Username is available"`).

---

## 3. Organizations & Employee Hierarchy Architecture (Date: 2026-09-05)

> **Database Reference:** See [DATABASE_SCHEMA.md — Table 2 & Table 3](./DATABASE_SCHEMA.md#table-2-organizations) for DDL and indexes.

### 3.1 How We Create Tables Directly From Code (Without Web Dashboard)
* **The Connection Pipeline:**
  1. Neon assigns a secure URL in `backend/.env` as `DATABASE_URL` (`postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
  2. Our Node.js backend uses the `pg` driver to open an encrypted TLS socket directly to Neon's cloud server on port `5432`.
  3. The initialization file ([backend/src/db/init.ts](file:///c:/Users/surya/Desktop/Projects/OMeet/backend/src/db/init.ts)) contains raw DDL statements (`CREATE TABLE IF NOT EXISTS ...`).
  4. When you run `npm run db:init` (or when the backend starts), Node.js transmits these SQL strings to Neon over the wire.
  5. Neon's PostgreSQL engine parses the SQL, provisions storage, builds the tables and B-Tree indexes, and sends an acknowledgment back.
  6. **Why this is superior:** No manual clicking, no syntax mistakes in web consoles, and 100% reproducible across developer machines and staging/production environments.

---

### 3.2 Architectural Rule: Why Lists (Juniors, Meetings, Groups, Chats) Are Never Columns

In relational database design (PostgreSQL), we **never** store arrays or lists as columns inside a row (e.g. `juniors_list = ['id1', 'id2']` or `meeting_list = ['m1', 'm2']`).

#### 1. Why "Juniors List" is Derived Dynamically (Zero Sync Bugs):
* Every employee record stores their immediate boss: `manager_employee_id`.
* If Bob's `manager_employee_id = Alice.id`, who are Alice's juniors?
  ```sql
  SELECT * FROM organization_employees WHERE manager_employee_id = 'alice_id';
  ```
* **Huge benefit:** If Bob switches to a new manager tomorrow, you update **one single column** (`Bob.manager_employee_id = Charlie.id`). Alice's juniors list and Charlie's juniors list update automatically with zero sync errors!

#### 2. Why Meetings Belong in `meetings` + `meeting_participants`:
* A meeting has scheduling timestamps, status, links, and notes.
* Storing meeting IDs inside an employee column makes searching, cancelling, and updating meetings impossible.
* Instead, a junction table `meeting_participants (meeting_id, employee_id)` makes querying instant:
  ```sql
  SELECT m.* FROM meetings m 
  JOIN meeting_participants mp ON m.id = mp.meeting_id 
  WHERE mp.employee_id = $1;
  ```

#### 3. Why Chat Logs Belong in `messages`:
* Chats generate thousands or millions of entries.
* Messages live in a dedicated `messages` table with an index on `(organization_id, created_at)` for high-speed scrolling and pagination.

---

### 3.3 The Active Schema Tables

#### Table: `organizations`
```sql
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    brief           VARCHAR(255) NULL,                        -- Concise intro / one-liner tagline
    description     TEXT NULL,
    size            VARCHAR(50) NULL,
    employee_count  INTEGER NOT NULL DEFAULT 1,
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
```

#### Table: `organization_employees` (The Hierarchy & Employment Bridge)
```sql
CREATE TABLE organization_employees (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manager_employee_id UUID NULL REFERENCES organization_employees(id) ON DELETE SET NULL,
    position            VARCHAR(100) NOT NULL,
    role                VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    salary              NUMERIC(12, 2) NULL,
    joining_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    resignation_date    DATE NULL,
    last_accessed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_org_employees_user ON organization_employees(user_id);
CREATE INDEX idx_org_employees_org ON organization_employees(organization_id);
CREATE INDEX idx_org_employees_manager ON organization_employees(manager_employee_id);
```

---

## 4. Organization Creation Page & Data Access Control Architecture (Date: 2026-09-06)

### 4.1 Page Tailoring & Input-to-Database Mapping
The **Create Organization** page (`frontend/src/pages/CreateOrganization.tsx`) is designed to capture all essential metadata required by both the `organizations` and `organization_employees` tables:

| Form Field in UI | Target Database Table | Column Name | Constraints | Description & Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Organization Name** | `organizations` | `name` | `VARCHAR(255) NOT NULL` | Public name of the workspace (e.g. *Acme Labs*). |
| **Brief / Tagline** | `organizations` | `brief` | `VARCHAR(255) NULL` | Optional concise intro/tagline shown on cards, previews, and invites. |
| **Organization Description** | `organizations` | `description` | `TEXT NULL` | Optional full overview explaining mission, team scope, and goals. |
| **Expected Size** | `organizations` | `size` | `VARCHAR(50) NULL` | Optional expected bracket (*1-10*, *11-50*, *51-200*, *201-500*, *500+*). |
| **Employee Count** | `organizations` | `employee_count` | `INTEGER NOT NULL DEFAULT 1` | Automatically initialized to `1` upon creation (the creator is Employee #1). |
| **Creator Position** | `organization_employees` | `position` | `VARCHAR(100) NOT NULL` | Title of creator (*Founder & CEO*, *Principal Architect*, etc.). |
| **Creator Role** | `organization_employees` | `role` | `VARCHAR(50) NOT NULL` | Automatically assigned as `OWNER`. |
| **Creator Status** | `organization_employees` | `status` | `VARCHAR(20) NOT NULL` | Automatically assigned as `ACTIVE`. |
| **Creator User ID** | `organizations` & `organization_employees` | `owner_id` & `user_id` | `UUID NOT NULL` | Inherited from the authenticated Google user account. |

---

### 4.2 The Role of the `brief` Column
* **Purpose:** Acts as a lightweight, punchy one-liner or intro summary (max 255 characters).
* **Where It Displays:**
  1. On the **Home Page Organization Carousel & Cards** (`OrganizationCard.tsx`), giving team members instant context without needing to open the workspace.
  2. In **Invitation Notifications** (`ORG_INVITATION`), providing invited colleagues a fast explanation of what workspace they are being asked to join.
  3. In **Workspace Header Previews** and AI Workspace Summaries.
* **Why Optional?** If omitted by the user, the UI gracefully falls back to `description` or workspace name.

---

### 4.3 Data Access Control: Who Can Access What?

A key security question is: **"Who is allowed to access data from the `organizations` table?"**

Relational databases do not automatically know user permissions without a policy or enforcement layer. In OMeet, access control is governed by the **Membership Principle** via the `organization_employees` junction table:

```mermaid
graph TD
    User([Requesting User]) --> Endpoint[API Endpoint: /api/organizations/:id]
    Endpoint --> Check{Is user in organization_employees?}
    
    Check -- "No Record" --> AccessDenied[❌ 403 / 404 Forbidden: Outside User cannot view private workspace]
    Check -- "status = 'RESIGNED' or 'TERMINATED'" --> Revoked[❌ 403 Forbidden: Former employee access revoked]
    Check -- "status = 'ACTIVE' & role = 'MEMBER'" --> MemberAccess[✅ Read-Only Workspace Data: Name, Brief, Channels, Meetings]
    Check -- "status = 'ACTIVE' & role = 'ADMIN'" --> AdminAccess[✅ Manage Members & Channels]
    Check -- "role = 'OWNER' or owner_id = userId" --> OwnerAccess[👑 Full Super-Admin: Delete Org, Transfer Ownership, Manage Billing & Salaries]
```

#### The 4 Tiers of Access:

1. **The Owner (`owner_id = user.id` OR `role = 'OWNER'`):**
   * **Full Super-Admin Privileges:** Can view, edit, update, or delete the organization.
   * Can invite and terminate employees, reassign reporting hierarchy (`manager_employee_id`), view salary information, and change workspace settings.
2. **Active Employees (`organization_employees.status = 'ACTIVE'`):**
   * **Collaborative Read/Write Access:** Can view the organization name, brief, description, active member directory, reporting tree, team channels, and meetings.
   * Cannot delete the workspace, rename the organization, or modify other employees' salaries or roles.
3. **Resigned or Terminated Employees (`status = 'RESIGNED' | 'TERMINATED'`):**
   * **Access Revoked:** If an employee leaves or is removed, their `status` is updated (or `resignation_date` set). They can no longer fetch the organization's internal meetings, member list, or chat messages.
4. **Outside / Unauthenticated Users:**
   * **Zero Access:** Cannot query internal organization metrics, channels, or employee directories.
   * Public visibility is restricted solely to an invitation preview if they possess a valid invite token.

---

### 4.4 SQL Access Verification Implementation

In the backend (`backend/src/routes/organizationRoutes.ts`), the access control check is enforced at the database layer before returning any sensitive workspace payload:

```typescript
// 1. Fetch organization record
const orgResult = await query("SELECT * FROM organizations WHERE id = $1 LIMIT 1;", [id]);
if (orgResult.rows.length === 0) {
  return res.status(404).json({ error: "Organization not found." });
}
const org = orgResult.rows[0];

// 2. Access Control Verification via organization_employees
const memberCheck = await query(
  `SELECT role, position, status 
   FROM organization_employees 
   WHERE organization_id = $1 AND user_id = $2 AND status = 'ACTIVE' 
   LIMIT 1;`,
  [id, requestingUserId]
);

// 3. Evaluate Permissions
const isOwner = org.owner_id === requestingUserId || memberCheck.rows[0]?.role === "OWNER";
const isMember = memberCheck.rows.length > 0;

if (!isOwner && !isMember) {
  return res.status(403).json({ error: "Access denied. You are not an active member of this organization." });
}
```

---

## 5. In-App Organization Invitation System & Hierarchical Senior Rules (Date: 2026-09-06)

### 5.1 Architecture: Inviting Registered Users Only
Instead of sending unauthenticated email links to outside parties, OMeet's invitation flow operates **strictly between registered OMeet user accounts**:
* **Immediate Identity Binding:** The inviter searches by `@username`, full name, or email. The recipient's `invitee_user_id` is definitively bound in the database right at creation time.
* **Instant Profile Verification:** The inviter sees the recipient's verified Google avatar, full name, `@username`, and bio before sending the invite.
* **Automated Exclusions:** The live user search automatically filters out:
  1. The inviter themselves.
  2. Users who are already active employees of the workspace (`organization_employees.status = 'ACTIVE'`).
  3. Users who already have a `PENDING` invitation for this workspace.
* **In-App Delivery:** The invitation appears directly inside the invitee's OMeet notifications and dashboard, with **Accept** and **Decline** actions.

---

### 5.2 Permission Governance: The `has_permission` Column
To prevent unauthorized members from bloating the company roster or adding colleagues without approval, organization invitations are guarded by the `has_permission` column in `organization_employees`:

```sql
ALTER TABLE organization_employees 
ADD COLUMN IF NOT EXISTS has_permission BOOLEAN NOT NULL DEFAULT FALSE;
```

#### Governance Rules:
1. **The Owner:** Automatically has `has_permission = TRUE` by default.
2. **Standard Employees:** Default to `has_permission = FALSE` upon joining.
3. **Delegation:** The Owner can grant or revoke `has_permission` for team leads and hiring managers.
4. **Enforcement:** If a member without permission accesses `/organization/:id/invite` or posts to the invitation endpoint, the backend returns `403 Forbidden` with a clear explanation.

---

### 5.3 The Hierarchical Senior Assignment Rule
When inviting someone, the inviter must designate the new colleague's **Direct Senior** (`manager_employee_id`).

> [!IMPORTANT]
> **Strict Hierarchy Rule:** Whoever is inviting someone can **only** assign that person to report to:
> 1. **The inviter themselves**, OR
> 2. **A direct or indirect subordinate in the inviter's reporting tree**.
>
> An inviter CANNOT assign a new hire to report to the inviter's own manager/senior or to anyone outside their branch.

#### Database Enforcement via Recursive Common Table Expression (CTE):
To compute the list of eligible direct seniors, PostgreSQL recursively traverses down the organization tree from the inviter's node:

```sql
WITH RECURSIVE subordinates AS (
  -- Base case: The inviter themselves (Depth 0)
  SELECT 
    oe.id AS employee_id,
    oe.user_id,
    oe.position,
    oe.role,
    oe.manager_employee_id,
    u.name,
    u.avatar_url,
    0 AS depth
  FROM organization_employees oe
  JOIN users u ON u.id = oe.user_id
  WHERE oe.organization_id = $1 AND oe.user_id = $2 AND oe.status = 'ACTIVE'

  UNION ALL

  -- Recursive step: Any employee whose manager_employee_id is in subordinates
  SELECT 
    oe.id AS employee_id,
    oe.user_id,
    oe.position,
    oe.role,
    oe.manager_employee_id,
    u.name,
    u.avatar_url,
    s.depth + 1 AS depth
  FROM organization_employees oe
  JOIN users u ON u.id = oe.user_id
  JOIN subordinates s ON oe.manager_employee_id = s.employee_id
  WHERE oe.organization_id = $1 AND oe.status = 'ACTIVE'
)
SELECT * FROM subordinates ORDER BY depth ASC, name ASC;
```

* For the **Owner** (at root), every employee in the workspace is in their subordinate tree, so the Owner can assign anyone.
* For a **Team Lead**, depth 0 is the Team Lead, and depth > 0 are the engineers who report directly or indirectly to them. Their senior VP or CEO is excluded!

---

### 5.4 Database Schema: Table `organization_invitations`

```sql
CREATE TABLE organization_invitations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code         VARCHAR(20) UNIQUE NOT NULL,          -- e.g. "OM-7K9P2X"
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inviter_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inviter_employee_id UUID NOT NULL REFERENCES organization_employees(id) ON DELETE CASCADE,
    invitee_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position            VARCHAR(100) NOT NULL,
    department          VARCHAR(100) NULL,
    manager_employee_id UUID NOT NULL REFERENCES organization_employees(id) ON DELETE RESTRICT,
    role                VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    salary              NUMERIC(12, 2) NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_invitations_code ON organization_invitations(invite_code);
CREATE INDEX idx_invitations_invitee ON organization_invitations(invitee_user_id);
CREATE INDEX idx_invitations_org ON organization_invitations(organization_id);
CREATE UNIQUE INDEX uq_org_pending_invite 
    ON organization_invitations(organization_id, invitee_user_id) 
    WHERE status = 'PENDING';
```

---

### 5.5 Quick-Share Invite Codes for HRs & Account Exclusivity
To make onboarding smooth across direct communication channels (WhatsApp, Slack, chat), the system generates a branded quick-share code for each invitation:
* **Branded Code Format:** `OM-XXXXXX` (e.g., `OM-7K9P2X`).
* **HR Controls:**
  - 1-click **Copy Code** and **Copy Direct Link** (`/join/OM-7K9P2X`).
  - Customizable expiration duration (3, 7, 14, or 30 days).
* **Strict Account Exclusivity:**
  - When a user enters the invite code in the **"Join Organization"** modal, the backend verifies:
    ```sql
    SELECT * FROM organization_invitations WHERE invite_code = $1 AND status = 'PENDING';
    ```
  - If the authenticated user's ID does NOT match `invitee_user_id`, the system blocks the redemption:
    > *"Invalid invite code for your account. This invitation was exclusively issued to another user."*
  - This prevents unauthorized candidates from hijacking someone else's offer letter or role.

---

### 5.6 Automatic Login Notification Query & Offer Acceptance Flow
When any user logs into OMeet (or navigates to the dashboard):
1. **Login Trigger:** The navigation bar calls `GET /api/invitations/user/:userId`.
2. **Pending Offer Query:** PostgreSQL queries all pending, unexpired invitations for that user:
   ```sql
   SELECT oi.*, o.name AS organization_name, o.brief AS organization_brief, u_inviter.name AS inviter_name
   FROM organization_invitations oi
   JOIN organizations o ON o.id = oi.organization_id
   JOIN users u_inviter ON u_inviter.id = oi.inviter_user_id
   WHERE oi.invitee_user_id = $1 
     AND oi.status = 'PENDING' 
     AND (oi.expires_at IS NULL OR oi.expires_at > NOW())
   ORDER BY oi.created_at DESC;
   ```
3. **Notification Bell:** Populates with high-priority unread items showing:
   - *"Acme Labs Invitation: Priya invited you to join as Senior ML Engineer. Reports to Rahul Verma."*
   - Includes a direct **Preview Invitation** button opening the official offer screen.
4. **Atomic Acceptance & Notification In-App Response:**
   - Clicking **Accept** or **Decline** directly inside `NotificationItem.tsx` triggers `POST /api/invitations/:id/respond` with `{ action: 'ACCEPT' | 'REJECT', userId }`.
   - In a single database transaction, the invitation status becomes `'ACCEPTED'` (or `'REJECTED'`), `organizations.employee_count` is incremented, and the user is added to `organization_employees` with their assigned direct senior!
   - The notification item stays in the drawer without page redirection, cleanly displaying `✓ Accepted` or `✕ Declined`.
   - A window event (`organization-updated`) is fired, instantly re-rendering the `OrganizationCarousel` on the dashboard.

---

## 6. Global Live Search & User Public Profile

### 6.1 Real-Time PostgreSQL User Search
The top navigation bar features a dynamic search input connected directly to the database:
* **Endpoint:** `GET /api/users/search?q=...`
* **Debouncing & Efficiency:** 300ms debouncing delay coupled with `AbortController` cancellation prevents stale responses from overwriting newer query results.
* **Affiliation Enrichment:** Each matching user record automatically joins with `organization_employees` and `organizations` to display the user's primary organization and current title (e.g. `Shivam Pandey (@shivam) • OpenAI Research · Staff Research Engineer`).
* **Instant Profile Navigation:** Clicking a search result navigates directly to `/profile/:userId`.

### 6.2 Public Profile & Dynamic Invitation Handshake
* **Endpoint:** `GET /api/users/profile/:userId` retrieves full identity details, bio, timezone, skills, and all active organization affiliations.
* **Permission-Aware "Invite to Organization" Button:**
  - When viewing another user's profile, clicking **"Invite to Organization"** queries all organizations where the viewer has invite permissions (`has_permission = true` or `role = 'OWNER'/'ADMIN'`).
  - **Single Organization:** Seamlessly navigates straight to `/organization/:orgId/invite?candidateId=:targetId`.
  - **Multiple Organizations:** Opens an elegant modal allowing the viewer to select which organization they wish to recruit the candidate into.
* **Candidate Pre-Population & Return Routing:**
  - `InviteToOrganization.tsx` detects `?candidateId=...` and automatically locks the candidate's name and avatar into the form.
  - Upon sending the invitation or canceling, the user is redirected cleanly back to the candidate's profile (`/profile/:id`), maintaining intuitive navigation.

---

## 7. Dedicated In-App Notification Center

OMeet's notification center is specifically dedicated to real, database-backed organization invitations:

### 7.1 Dual Stream: Received & Sent
1. **Received Tab (`GET /api/invitations/user/:userId`):**
   - Displays all invitations directed to the logged-in user.
   - Preserves historical records (`PENDING`, `ACCEPTED`, `REJECTED`) so users have an audit trail of past invitations.
2. **Sent Tab (`GET /api/invitations/sent/:userId`):**
   - Displays all invitations sent by the logged-in user, showing target candidate, position, department, status, and expiration duration.

### 7.2 Dynamic Unread Badge
* `NotificationBell.tsx` calculates its badge count strictly from incoming invitations with `status === 'PENDING'`.
* As soon as an invitation is accepted or declined, the unread count automatically decrements to 0.

### 7.3 Frictionless In-App Acceptance & Cross-Component Reactivity
* **No Unnecessary Redirects:** Responding to an invitation keeps the user in their current flow. Action buttons are replaced by permanent text (`✓ Accepted` / `✕ Declined`).
* **Live Dashboard Refresh:** When an invite is accepted, an `organization-updated` event is dispatched across the browser window:
  ```typescript
  window.dispatchEvent(new Event("organization-updated"));
  ```
  The dashboard's `OrganizationCarousel` listens for this event and immediately refetches `GET /api/organizations/user/:userId`, displaying the newly joined organization card in real-time.

---

## 9. Organization Real-Time Chat & Direct Messaging Architecture

### 9.1 Layout Overlay Strategy (Replacing Center & Right Bars)
When a conversation (Direct Message, Team Group, or Public Channel) is opened from the left sidebar, OMeet does not navigate to a new page. Instead:
- The **Chat Screen (`OrgChatView`)** expands across the entire remaining workspace area (`flex-1 min-w-0`), smoothly replacing the **Center Workspace (Tabs)** and the **Right Utility Sidebar**.
- The **Left Sidebar (`OrgSidebar`)** remains fixed (`w-[280px]`), allowing employees to switch between conversations seamlessly.

### 9.2 Toggle-to-Close Interaction & Dismissal
- **Toggle on Click**: Clicking the name of the **currently open conversation** in the left sidebar toggles it closed, instantly restoring the Center Tabs (Meetings, Members, Invitations) and the Right Utility Sidebar.
- **Header Dismissal**: A dedicated close (`✕`) button in the chat header allows one-click return to the workspace dashboard.
- **Keyboard Dismissal**: Pressing the `Esc` key immediately closes the active chat screen.

### 9.3 Tailored Experiences: Direct Message vs. Group Chat

#### A. Direct Messages
- **Recipient Identity**: Displays colleague's avatar, status, job title, and department.
- **Quick Profile Insight**: Includes a "View Profile" action that opens their organization employee modal without losing chat context.
- **Meeting Invite Shortcut**: An instant "Invite to Meeting" action generates a quick video meeting link and posts it directly into the conversation.

#### B. Team Groups & Public Channels
- **Team Identity**: Displays group initials/branding, group purpose / topic, and participant counter.
- **Team Huddle Trigger**: Instant shortcut to start an organization meeting for all group members.

### 9.4 API Specifications & REST Handshake
1. **`GET /api/organizations/:id/conversations/:convId/messages`**:
   - Validates membership and permissions.
   - Returns recipient profile (for DMs) or group metadata (for groups).
   - Returns chronological message history with sender avatar and handle.
   - Automatically marks unread messages as read by setting `conversation_participants.last_read_at = NOW()`.
2. **`POST /api/organizations/:id/conversations/:convId/messages`**:
   - Accepts `{ content, messageType, attachments }`.
   - Inserts into `messages` table and updates `conversations.updated_at = NOW()`.
   - Optimistic UI updates on the client deliver an instant, lag-free chatting experience.

---

## 8. Upcoming Architecture: Organization Workspace Dynamic Data System

The next phase transitions the Organization Workspace from static mock data to PostgreSQL-backed entities:

### 8.1 Unified Conversations Model (`conversations` & `conversation_participants`)
* **Channels:** Public and private text communication channels (e.g. `# general`, `# dev-announcements`).
* **Team Groups:** Functional cross-subordinate discussion groups tied to organizational departments.
* **Direct Messages:** 1-on-1 employee communication streams.
* **Participant Junction:** Tracks user membership, unread counters, and per-conversation roles.

### 8.2 Synchronous Meetings Engine (`organization_meetings`)
* **Live & Scheduled Meetings:** Stores meeting codes, start/end timestamps, host identity, and communication scope (`ORG_WIDE`, `DIRECT_REPORTS`, `DEPTH_2`).
* **Deep Dynamic Routing:** Replaces mock array lookups in `OrgWorkspaceLayout.tsx` with dynamic API queries by organization UUID (`GET /api/organizations/:organizationId`), loading real members, channels, and meetings seamlessly.




