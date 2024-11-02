import { Model, DataTypes, Sequelize } from "sequelize";

interface PertanyaanSurveiAttributes {
  id?: number;
  kegiatan_id: number;
  pertanyaan: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class PertanyaanSurvei
  extends Model<PertanyaanSurveiAttributes>
  implements PertanyaanSurveiAttributes
{
  public id!: number;
  public kegiatan_id!: number;
  public pertanyaan!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    PertanyaanSurvei.belongsTo(models.KegiatanSurvei, {
      foreignKey: "kegiatan_id",
      as: "KegiatanSurvei",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }
}

const initPertanyaanSurveiModel = (sequelize: Sequelize) => {
  PertanyaanSurvei.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      kegiatan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pertanyaan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PertanyaanSurveis",
      tableName: "pertanyaansurveis",
      timestamps: true,
    }
  );
};

export { PertanyaanSurvei, initPertanyaanSurveiModel };
