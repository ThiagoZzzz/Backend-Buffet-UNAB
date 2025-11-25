// config/database.js 
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const database = process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

const host = process.env.DB_HOST || "127.0.0.1"; 
const port = process.env.DB_PORT || 3310; 

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: "mysql",
  logging: false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: false, 
  },
});

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a Google Cloud SQL establecida");
    return true;
  } catch (error) {
    console.error("❌ Error de conexión a BD:", error.message);
    return false;
  }
};

export default sequelize;
