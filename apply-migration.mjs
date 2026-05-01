import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function applyMigration() {
  try {
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {
        rejectUnauthorized: false,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const db = drizzle(connection);

    console.log("Applying migration: Adding memberId column to members table...");
    await connection.execute(`
      ALTER TABLE \`members\` ADD COLUMN IF NOT EXISTS \`memberId\` varchar(50)
    `);

    console.log("Applying migration: Adding adhesionId column to adhesions table...");
    await connection.execute(`
      ALTER TABLE \`adhesions\` ADD COLUMN IF NOT EXISTS \`adhesionId\` varchar(50)
    `);

    console.log("Updating existing members with unique IDs...");
    await connection.execute(`
      UPDATE \`members\` SET \`memberId\` = CONCAT('MEM-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(id, 4, '0')) WHERE \`memberId\` IS NULL OR \`memberId\` = ''
    `);

    console.log("Updating existing adhesions with unique IDs...");
    await connection.execute(`
      UPDATE \`adhesions\` SET \`adhesionId\` = CONCAT('ADH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(id, 4, '0')) WHERE \`adhesionId\` IS NULL OR \`adhesionId\` = ''
    `);

    console.log("Adding unique constraints...");
    try {
      await connection.execute(`
        ALTER TABLE \`members\` ADD CONSTRAINT \`members_memberId_unique\` UNIQUE(\`memberId\`)
      `);
    } catch (err) {
      if (!err.message.includes("Duplicate entry")) {
        console.log("Unique constraint already exists or error:", err.message);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE \`adhesions\` ADD CONSTRAINT \`adhesions_adhesionId_unique\` UNIQUE(\`adhesionId\`)
      `);
    } catch (err) {
      if (!err.message.includes("Duplicate entry")) {
        console.log("Unique constraint already exists or error:", err.message);
      }
    }

    console.log("✅ Migration applied successfully!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
