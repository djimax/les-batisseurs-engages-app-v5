import mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable not set");
  process.exit(1);
}

async function applyMigration() {
  try {
    // Parse the database URL
    const url = new URL(databaseUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: url.hostname.includes("tidbcloud")
        ? { rejectUnauthorized: false }
        : undefined,
    });

    // Read and execute the migration
    const migrationPath = path.join(
      process.cwd(),
      "drizzle",
      "0009_lyrical_the_initiative.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    console.log("Executing migration...");
    console.log("SQL:", sql);

    await connection.execute(sql);

    console.log("✓ Migration applied successfully");
    await connection.end();
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

applyMigration();
