import { Model, DataTypes, Sequelize } from "sequelize";

interface OpdAttributes {
  id?: number;
  nama_opd: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Opd extends Model<OpdAttributes> implements OpdAttributes {
  public id!: number;
  public nama_opd!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    Opd.hasMany(models.User, {
      foreignKey: "opd_id",
      as: "user",
    });
  }
}

const initOpdModel = (sequelize: Sequelize) => {
  Opd.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nama_opd: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Opd",
      tableName: "opds",
      timestamps: true,
    }
  );
};

export { Opd, initOpdModel };
