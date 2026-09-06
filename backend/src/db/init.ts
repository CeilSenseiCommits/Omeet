import { pool } from "./index";

/**
 * Automatically initializes the PostgreSQL database tables on Neon.
 * Running this script means you never have to manually visit the Neon web console to create tables!
 */
export async function initializeDatabase() {
  console.log("Connecting to Neon cloud PostgreSQL...");

  const client = await pool.connect();
  try {
    console.log("Ensuring pgcrypto extension exists...");
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    console.log("Creating 'users' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT NOT NULL,
        phone VARCHAR(20) NULL,
        bio VARCHAR(255) NULL,
        gender VARCHAR(20) NULL,
        timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
        is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Applying schema migrations (e.g. gender column)...");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`);

    console.log("Creating unique B-Tree indexes for users...");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
    `);

    console.log("Creating 'organizations' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        brief VARCHAR(255) NULL,
        description TEXT NULL,
        size VARCHAR(50) NULL,
        employee_count INTEGER NOT NULL DEFAULT 1,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
    `);

    console.log("Applying schema migrations for organizations...");
    await client.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brief VARCHAR(255);`);

    console.log("Creating 'organization_employees' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        manager_employee_id UUID NULL REFERENCES organization_employees(id) ON DELETE SET NULL,
        position VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        salary NUMERIC(12, 2) NULL,
        has_permission BOOLEAN NOT NULL DEFAULT FALSE,
        joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
        resignation_date DATE NULL,
        last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_org_employees_user ON organization_employees(user_id);
      CREATE INDEX IF NOT EXISTS idx_org_employees_org ON organization_employees(organization_id);
      CREATE INDEX IF NOT EXISTS idx_org_employees_manager ON organization_employees(manager_employee_id);
    `);

    console.log("Applying schema migrations for organization_employees (has_permission, department)...");
    await client.query(`
      ALTER TABLE organization_employees ADD COLUMN IF NOT EXISTS has_permission BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE organization_employees ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL;
      UPDATE organization_employees SET has_permission = TRUE WHERE role = 'OWNER';
    `);

    console.log("Creating 'organization_invitations' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invite_code VARCHAR(20) UNIQUE NOT NULL,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        inviter_employee_id UUID NOT NULL REFERENCES organization_employees(id) ON DELETE CASCADE,
        invitee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position VARCHAR(100) NOT NULL,
        department VARCHAR(100) NULL,
        manager_employee_id UUID NOT NULL REFERENCES organization_employees(id) ON DELETE RESTRICT,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        salary NUMERIC(12, 2) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON organization_invitations(invitee_user_id);
      CREATE INDEX IF NOT EXISTS idx_invitations_org ON organization_invitations(organization_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_org_pending_invite 
        ON organization_invitations(organization_id, invitee_user_id) 
        WHERE status = 'PENDING';
    `);

    console.log("Applying schema migrations for organization_invitations (invite_code, expires_at)...");
    await client.query(`
      ALTER TABLE organization_invitations ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20);
      ALTER TABLE organization_invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days');
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_code ON organization_invitations(invite_code);
    `);

    console.log("Creating 'conversations' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        name VARCHAR(100) NULL,
        topic VARCHAR(255) NULL,
        is_private BOOLEAN NOT NULL DEFAULT FALSE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
    `);

    console.log("Creating 'conversation_participants' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
        last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_conversation_user UNIQUE (conversation_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
    `);

    console.log("Creating 'organization_meetings' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        conversation_id UUID NULL REFERENCES conversations(id) ON DELETE SET NULL,
        meeting_code VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
        scope VARCHAR(50) NOT NULL DEFAULT 'ORG_WIDE',
        scheduled_at TIMESTAMPTZ NOT NULL,
        started_at TIMESTAMPTZ NULL,
        ended_at TIMESTAMPTZ NULL,
        has_recording BOOLEAN NOT NULL DEFAULT FALSE,
        has_ai_summary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_org_meetings_org ON organization_meetings(organization_id);
      CREATE INDEX IF NOT EXISTS idx_org_meetings_status ON organization_meetings(status);
      CREATE INDEX IF NOT EXISTS idx_org_meetings_scheduled ON organization_meetings(scheduled_at);
    `);

    console.log("Creating 'meeting_participants' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES organization_meetings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'LISTENER',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        left_at TIMESTAMPTZ NULL,
        CONSTRAINT uq_meeting_participant UNIQUE (meeting_id, user_id)
      );
    `);

    console.log("Provisioning default channels (# general, # random) for all organizations...");
    const orgs = await client.query("SELECT id, owner_id FROM organizations;");
    for (const org of orgs.rows) {
      // 1. Ensure general channel
      let generalChan = await client.query(
        "SELECT id FROM conversations WHERE organization_id = $1 AND name = 'general' AND type = 'CHANNEL' LIMIT 1;",
        [org.id]
      );
      if (generalChan.rows.length === 0) {
        const insertGen = await client.query(
          `INSERT INTO conversations (organization_id, type, name, topic, is_private, created_by)
           VALUES ($1, 'CHANNEL', 'general', 'Company-wide announcements and general discussion', FALSE, $2)
           RETURNING id;`,
          [org.id, org.owner_id]
        );
        generalChan = insertGen;
      }

      // 2. Ensure random channel
      let randomChan = await client.query(
        "SELECT id FROM conversations WHERE organization_id = $1 AND name = 'random' AND type = 'CHANNEL' LIMIT 1;",
        [org.id]
      );
      if (randomChan.rows.length === 0) {
        const insertRand = await client.query(
          `INSERT INTO conversations (organization_id, type, name, topic, is_private, created_by)
           VALUES ($1, 'CHANNEL', 'random', 'Casual discussions, fun banter, and watercooler chat', FALSE, $2)
           RETURNING id;`,
          [org.id, org.owner_id]
        );
        randomChan = insertRand;
      }

      // Enroll all active employees into general and random
      const employees = await client.query(
        "SELECT user_id, role FROM organization_employees WHERE organization_id = $1 AND status = 'ACTIVE';",
        [org.id]
      );
      for (const emp of employees.rows) {
        if (generalChan.rows[0]?.id) {
          await client.query(
            `INSERT INTO conversation_participants (conversation_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
            [generalChan.rows[0].id, emp.user_id, emp.role === "OWNER" ? "OWNER" : "MEMBER"]
          );
        }
        if (randomChan.rows[0]?.id) {
          await client.query(
            `INSERT INTO conversation_participants (conversation_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
            [randomChan.rows[0].id, emp.user_id, emp.role === "OWNER" ? "OWNER" : "MEMBER"]
          );
        }
      }
    }


    // Check if initial demo users exist; if not, seed them
    const existingCheck = await client.query(
      `SELECT COUNT(*) FROM users WHERE LOWER(username) IN ('suryansh_dev', 'priya_ml');`
    );

    if (parseInt(existingCheck.rows[0].count, 10) === 0) {
      console.log("Seeding initial demo users for testing...");
      await client.query(`
        INSERT INTO users (google_id, email, username, name, avatar_url, phone, bio, timezone, is_onboarded)
        VALUES 
          (
            'gid_104928172948201948271',
            'suryansh@example.com',
            'suryansh_dev',
            'Suryansh Rao',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            '+91 98765 43210',
            'Core Systems Architect & Distributed Systems Engineer',
            'Asia/Kolkata',
            TRUE
          ),
          (
            'gid_203948572819384729102',
            'priya@openai-research.com',
            'priya_ml',
            'Priya Sharma',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
            '+1 (415) 555-0199',
            'Machine Learning Researcher',
            'America/Los_Angeles',
            TRUE
          );
      `);
      console.log("Seeded demo users successfully!");
    } else {
      console.log("Demo users already present in database.");
    }

    console.log("Database initialized successfully on Neon cloud!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// If run directly via npm run db:init
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Finished db:init script.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
