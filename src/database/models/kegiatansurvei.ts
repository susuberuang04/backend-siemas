import { Model, DataTypes, Sequelize } from "sequelize";

interface KegiatanSurveisAttributes {
  id?: number;
  klasifikasi_id: number;
  nama_kegiatan: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class KegiatanSurvei
  extends Model<KegiatanSurveisAttributes>
  implements KegiatanSurveisAttributes
{
  public id!: number;
  public klasifikasi_id!: number;
  public nama_kegiatan!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    KegiatanSurvei.belongsTo(models.KlasifikasiSurvei, {
      foreignKey: "klasifikasi_id",
      as: "KlasifikasiSurvei",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    KegiatanSurvei.hasMany(models.PertanyaanSurvei, {
      foreignKey: "kegiatan_id",
      as: "PertanyaanSurvei",
    });
  }
}

const initKegiatanSurveisModel = (sequelize: Sequelize) => {
  KegiatanSurvei.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      klasifikasi_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "KlasifikasiSurvei",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      nama_kegiatan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "KegiatanSurveis",
      tableName: "kegiatansurveis",
      timestamps: true,
    }
  );
};

export { KegiatanSurvei, initKegiatanSurveisModel };
