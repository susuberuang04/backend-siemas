import { Model, DataTypes, Sequelize } from "sequelize";

interface JadwalSurveiAttributes {
  id?: number;
  kegiatan_id: number;
  tanggal_mulai: string;
  tanggal_akhir: string;
  is_aktif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class JadwalSurvei
  extends Model<JadwalSurveiAttributes>
  implements JadwalSurveiAttributes
{
  public id!: number;
  public kegiatan_id!: number;
  public tanggal_mulai!: string;
  public tanggal_akhir!: string;
  public is_aktif!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    JadwalSurvei.belongsTo(models.User, {
      foreignKey: "kegiatan_id",
      as: "KegiatanSurveis",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }
}

const initJadwalSurveiModel = (sequelize: Sequelize) => {
  JadwalSurvei.init(
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
      tanggal_mulai: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tanggal_akhir: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_aktif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JadwalSurvei",
      tableName: "jadwalsurvei",
      timestamps: true,
    }
  );
};

export { JadwalSurvei, initJadwalSurveiModel };
