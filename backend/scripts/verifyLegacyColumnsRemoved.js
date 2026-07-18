import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'users' AND column_name = 'role') OR
      (table_name = 'reports' AND column_name IN ('category', 'status'))
    )
  ORDER BY table_name, column_name;
`;

try {
  const res = await pool.query(sql);

  if (res.rows.length === 0) {
    console.log("✅ Legacy-Spalten entfernt: users.role, reports.category, reports.status");
  } else {
    console.log("⚠️ Noch vorhandene Legacy-Spalten:", res.rows);
    process.exitCode = 1;
  }
} catch (err) {
  console.error("❌ Fehler bei Schema-Check:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
