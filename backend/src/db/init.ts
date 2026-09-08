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

    console.log("Applying schema migrations (e.g. gender column, avatar_url)...");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`);
    await client.query(`ALTER TABLE users ALTER COLUMN avatar_url DROP NOT NULL;`);

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

    console.log("Creating 'messages' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
        attachments JSONB DEFAULT '[]'::jsonb,
        reply_to_id UUID NULL REFERENCES messages(id) ON DELETE SET NULL,
        is_edited BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    `);

    console.log("Applying log-based messaging schema migrations (conversations.last_seq, messages.seq)...");
    await client.query(`
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_seq BIGINT NOT NULL DEFAULT 0;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS seq BIGINT NOT NULL DEFAULT 1;

      -- Backfill existing messages with row numbers per conversation based on created_at
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at ASC) AS rnum
        FROM messages
      )
      UPDATE messages m
      SET seq = r.rnum
      FROM ranked r
      WHERE m.id = r.id;

      -- Sync conversations.last_seq to highest existing message sequence
      UPDATE conversations c
      SET last_seq = COALESCE((SELECT MAX(seq) FROM messages WHERE conversation_id = c.id), 0);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_conv_seq ON messages(conversation_id, seq ASC);
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

    console.log("Applying schema migrations for organization_meetings (nullable org, is_hierarchical, meeting_type)...");
    await client.query(`
      ALTER TABLE organization_meetings ALTER COLUMN organization_id DROP NOT NULL;
      ALTER TABLE organization_meetings ADD COLUMN IF NOT EXISTS is_hierarchical BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE organization_meetings ADD COLUMN IF NOT EXISTS meeting_type VARCHAR(20) NOT NULL DEFAULT 'INSTANT';
      ALTER TABLE conversations ALTER COLUMN organization_id DROP NOT NULL;
    `);

    console.log("Creating 'friendships' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_friendship_pair UNIQUE (sender_user_id, receiver_user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_friendships_sender ON friendships(sender_user_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON friendships(receiver_user_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
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

    console.log("Creating 'meeting_invitations' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES organization_meetings(id) ON DELETE CASCADE,
        organization_id UUID NULL REFERENCES organizations(id) ON DELETE CASCADE,
        inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_meeting_invitee UNIQUE (meeting_id, invitee_user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_meeting_invitations_invitee ON meeting_invitations(invitee_user_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_invitations_org ON meeting_invitations(organization_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_invitations_meeting ON meeting_invitations(meeting_id);
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
