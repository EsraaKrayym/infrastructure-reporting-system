import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const migrationFile = process.argv[2] || "2026-07-18-normalize-schema.sql";
const migrationPath = path.resolve(process.cwd(), "migrations", migrationFile);

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL fehlt. Bitte in backend/.env setzen (Neon URL).");
  process.exit(1);
}

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration nicht gefunden: ${migrationPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const run = async () => {
  const client = await pool.connect();
  try {
    console.log(`▶️ Starte Migration: ${migrationFile}`);
    await client.query(sql);
    console.log("✅ Migration erfolgreich ausgeführt.");
  } catch (err) {
    console.error("❌ Migration fehlgeschlagen:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();
