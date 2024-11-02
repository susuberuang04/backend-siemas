import { Model, DataTypes, Sequelize } from "sequelize";

export interface feedBackAttributes {
  id: number;
  user_id: number;
  bintang: number;
  kritik: string;
  saran: string;
}

class FeedBack extends Model<feedBackAttributes> implements feedBackAttributes {
  public id!: number;
  public user_id!: number;
  public bintang!: number;
  public kritik!: string;
  public saran!: string;

  static associate(models: any) {
    FeedBack.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

const initFeedBackModel = (sequelize: Sequelize) => {
  FeedBack.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      bintang: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      kritik: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      saran: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "FeedBack",
      tableName: "feedbacks",
      timestamps: true,
    }
  );
  return FeedBack;
};

export { FeedBack, initFeedBackModel };
