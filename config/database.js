// config/database.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const database = process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

// config db.
let sequelizeOptions = {
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
};

// si existe DB_SOCKET_PATH, usamos la configuración para GCP
if (process.env.DB_SOCKET_PATH) {
  console.log("☁️ Modo Nube: Conectando vía Socket Unix");
  sequelizeOptions.dialectOptions = {
    socketPath: process.env.DB_SOCKET_PATH
  };
} else {
  console.log("💻 Modo Local: Conectando vía TCP");
  // En local, usamos host y puerto
  sequelizeOptions.host = process.env.DB_HOST || "127.0.0.1";
  sequelizeOptions.port = process.env.DB_PORT || 3310;
}

// incializar Sequelize.
const sequelize = new Sequelize(database, username, password, sequelizeOptions);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión establecida correctamente.");
    return true;
  } catch (error) {
    console.error("❌ Error de conexión a BD:", error.message);
    return false;
  }
};

export default sequelize;