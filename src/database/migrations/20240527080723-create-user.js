"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
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
        allowNull: true,
      },
      username: {
        type: Sequelize.STRING,
      },
      password: {
        type: Sequelize.TEXT,
      },

      no_hp: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.STRING,
        defaultValue: "users",
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "aktif",
      },
      is_confirm: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_feedback: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_survei: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      opd_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Opds",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
    await queryInterface.dropTable("Users");
  },
};
