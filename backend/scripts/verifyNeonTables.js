import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('roles', 'users', 'categories', 'report_statuses', 'reports', 'audit_logs')
  ORDER BY table_name
`;

try {
  const res = await pool.query(sql);
  console.log("Neon Tabellen:", res.rows.map((r) => r.table_name));
} catch (err) {
  console.error("Fehler bei Neon-Check:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
