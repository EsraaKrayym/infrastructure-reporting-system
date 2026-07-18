import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const REQUIRED = {
  roles: ["id", "name", "description"],
  users: ["id", "name", "email", "password", "role_id", "blocked", "created_at"],
  categories: ["id", "name", "description"],
  report_statuses: ["id", "name", "description", "is_final"],
  reports: [
    "id",
    "title",
    "description",
    "category_id",
    "latitude",
    "longitude",
    "user_id",
    "status_id",
    "priority",
    "address",
    "photo",
    "created_at",
  ],
  audit_logs: ["id", "report_id", "changed_by", "action", "old_value", "new_value", "created_at"],
};

const FK_EXPECTED = [
  { table: "users", column: "role_id", ref: "roles" },
  { table: "reports", column: "category_id", ref: "categories" },
  { table: "reports", column: "status_id", ref: "report_statuses" },
  { table: "reports", column: "user_id", ref: "users" },
  { table: "audit_logs", column: "report_id", ref: "reports" },
  { table: "audit_logs", column: "changed_by", ref: "users" },
];

try {
  const cols = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
    ORDER BY table_name, ordinal_position
  `, [Object.keys(REQUIRED)]);

  const byTable = new Map();
  for (const r of cols.rows) {
    if (!byTable.has(r.table_name)) byTable.set(r.table_name, []);
    byTable.get(r.table_name).push(r.column_name);
  }

  let ok = true;
  for (const [table, needed] of Object.entries(REQUIRED)) {
    const got = byTable.get(table) || [];
    const missing = needed.filter((c) => !got.includes(c));
    if (missing.length > 0) {
      ok = false;
      console.log(`❌ ${table} fehlt: ${missing.join(", ")}`);
    } else {
      console.log(`✅ ${table} ok`);
    }
  }

  const fks = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = ANY($1::text[])
  `, [Object.keys(REQUIRED)]);

  for (const exp of FK_EXPECTED) {
    const has = fks.rows.some(
      (r) => r.table_name === exp.table && r.column_name === exp.column && r.foreign_table_name === exp.ref
    );
    if (!has) {
      ok = false;
      console.log(`❌ FK fehlt: ${exp.table}.${exp.column} -> ${exp.ref}.id`);
    } else {
      console.log(`✅ FK ok: ${exp.table}.${exp.column} -> ${exp.ref}.id`);
    }
  }

  const roleCount = await pool.query("SELECT COUNT(*)::int AS c FROM roles");
  const catCount = await pool.query("SELECT COUNT(*)::int AS c FROM categories");
  const statusCount = await pool.query("SELECT COUNT(*)::int AS c FROM report_statuses");

  console.log(`ℹ️ Rollen: ${roleCount.rows[0].c}, Kategorien: ${catCount.rows[0].c}, Status: ${statusCount.rows[0].c}`);

  if (!ok) {
    process.exitCode = 1;
  }
} catch (err) {
  console.error("❌ Schema-Check Fehler:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
