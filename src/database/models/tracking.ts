import { Model, DataTypes, Sequelize } from "sequelize";

interface TrackingAttributes {
  id?: number;
  user_id: number | null;
  usulan_id: number | null;
  keterangan: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Tracking extends Model<TrackingAttributes> implements TrackingAttributes {
  public id!: number;
  public user_id!: number | null;
  public usulan_id!: number | null;
  public keterangan!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    Tracking.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Tracking.belongsTo(models.UsulanSmart, {
      foreignKey: "usulan_id",
      as: "usulanSmarts",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

const initTrackingModel = (sequelize: Sequelize) => {
  Tracking.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      usulan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "UsulanSmarts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      keterangan: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Tracking",
      tableName: "trackings",
      timestamps: true,
    }
  );
};

export { Tracking, initTrackingModel };
