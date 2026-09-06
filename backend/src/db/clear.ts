import { pool } from "./index";

/**
 * Utility script to completely wipe all records from OMeet PostgreSQL tables,
 * resetting the database to a completely clean state.
 */
export async function clearAllDatabaseData() {
  console.log("Connecting to PostgreSQL to clear all data...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    console.log("Truncating all application tables in cascading order...");
    await client.query(`
      TRUNCATE TABLE 
        meeting_invitations,
        meeting_participants,
        organization_meetings,
        messages,
        conversation_participants,
        conversations,
        organization_invitations,
        organization_employees,
        organizations,
        friendships,
        users
      CASCADE;
    `);

    await client.query("COMMIT;");
    console.log("✅ All database tables successfully cleared!");
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("❌ Error clearing database tables:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run directly if invoked via node/ts-node
if (require.main === module) {
  clearAllDatabaseData()
    .then(() => {
      console.log("Done. Database is clean.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
