import mysql from "mysql2/promise";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

console.log(process.env.DB_USERNAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    logger.info("Database Connection OK");
  } catch (error) {
    logger.info("Database Connection Error");
    process.exit(1);
  }
};

export { pool, testConnection };
