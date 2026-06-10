import pkg from "pg";
const { Pool } = pkg;

//const pool = new Pool({
   // user: "postgres",
   // host: "localhost",
 //   database: "infrastructure_db",
  //  password: "saso.hell835",
   // port: 5432,
//});
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
pool.connect()
    .then(() => console.log("PostgreSQL connected ✅"))
    .catch(err => console.error("PostgreSQL error ❌", err));

export default pool;