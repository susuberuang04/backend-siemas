import { Model, DataTypes, Sequelize } from "sequelize";

interface JawabanPertanyaanSurveiAttributes {
  id?: number;
  pertanyaan_id: number;
  jawaban_pertanyaan: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class JawabanPertanyaanSurvei
  extends Model<JawabanPertanyaanSurveiAttributes>
  implements JawabanPertanyaanSurveiAttributes
{
  public id!: number;
  public pertanyaan_id!: number;
  public jawaban_pertanyaan!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    JawabanPertanyaanSurvei.belongsTo(models.PertanyaanSurvei, {
      foreignKey: "pertanyaan_id",
      as: "PertanyaanSurvei",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }
}

const initJawabanPertanyaanSurveiModel = (sequelize: Sequelize) => {
  JawabanPertanyaanSurvei.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      pertanyaan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      jawaban_pertanyaan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JawabanPertanyaanSurvei",
      tableName: "jawabanpertanyaansurveis",
      timestamps: true,
    }
  );
};

export { JawabanPertanyaanSurvei, initJawabanPertanyaanSurveiModel };
