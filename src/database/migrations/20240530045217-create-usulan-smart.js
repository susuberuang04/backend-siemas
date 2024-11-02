"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("usulansmarts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama_inovasi: {
        type: Sequelize.TEXT,
      },
      deskripsi_inovasi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      regulasi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dokumentasi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tahun: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      link_drive: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      kategori_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Kategoris",
          key: "id",
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable("UsulanSmarts");
  },
};
