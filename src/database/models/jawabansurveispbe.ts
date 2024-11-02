import { Model, DataTypes, Sequelize } from "sequelize";

interface JawabanSurveiSpbeAttributes {
  id?: number;
  user_id: number;
  jawaban_survei: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class JawabanSurveiSpbe
  extends Model<JawabanSurveiSpbeAttributes>
  implements JawabanSurveiSpbeAttributes
{
  public id!: number;
  public user_id!: number;
  public jawaban_survei!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    // JawabanSurveiKementrian.hasMany(models.User, {
    //   foreignKey: "user_id",
    //   as: "user",
    // });
  }
}

const initJawabanSurveiSpbeModel = (sequelize: Sequelize) => {
  JawabanSurveiSpbe.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      jawaban_survei: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JawabanSurveiSpbe",
      tableName: "jawabansurveispbes",
      timestamps: true,
    }
  );
};

export { JawabanSurveiSpbe, initJawabanSurveiSpbeModel };
