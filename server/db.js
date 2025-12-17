import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Doctor_assist",
  password: "123",
  port: 5432,
});

export default pool;
