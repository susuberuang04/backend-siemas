"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifikasis", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      usulan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Set default to false
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
    await queryInterface.dropTable("Notifikasis");
  },
};
