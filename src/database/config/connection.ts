require("dotenv").config();
const { Sequelize } = require("sequelize");

const dbPort = process.env.DB_PORT;

if (!dbPort) {
  throw new Error("DB_PORT is not defined in the environment variables");
}

const sequelizeKoneksi = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USERNAME as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: parseInt(dbPort),
    dialectOptions: {
      connectTimeout: 60000,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000, // waktu tunggu akuisisi 30 detik
      idle: 10000, // waktu idle 10 detik
    },
    logging: false,
  }
);

export default sequelizeKoneksi;
