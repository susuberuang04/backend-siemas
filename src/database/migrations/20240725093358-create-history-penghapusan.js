"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("historypenghapusans", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id_user: {
        type: Sequelize.INTEGER,
      },
      id_usulan: {
        type: Sequelize.INTEGER,
      },
      nama_data: {
        type: Sequelize.STRING,
      },
      tipe_data: {
        type: Sequelize.STRING,
      },
      nama_tabel: {
        type: Sequelize.STRING,
      },
      nama_pengguna: {
        type: Sequelize.STRING,
      },
      alasan_penghapusan: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("HistoryPenghapusans");
  },
};
