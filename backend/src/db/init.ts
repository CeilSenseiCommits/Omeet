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
