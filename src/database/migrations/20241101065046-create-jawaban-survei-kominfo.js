"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("jawabansurveikominfos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama_lengkap: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      instansi: {
        type: Sequelize.STRING,
      },
      jabatan: {
        type: Sequelize.STRING,
      },
      alamat: {
        type: Sequelize.STRING,
      },
      jawaban_survei: {
        type: Sequelize.JSON,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("jawabansurveikominfos");
  },
};
