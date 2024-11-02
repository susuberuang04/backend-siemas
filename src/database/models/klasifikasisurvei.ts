import { Model, DataTypes, Sequelize } from "sequelize";

interface KlasifikasiSurveiAttributes {
  id?: number;
  jenis_survei: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class KlasifikasiSurvei
  extends Model<KlasifikasiSurveiAttributes>
  implements KlasifikasiSurveiAttributes
{
  public id!: number;
  public jenis_survei!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    KlasifikasiSurvei.hasMany(models.KegiatanSurvei, {
      foreignKey: "klasifikasi_id",
      as: "KegiatanSurveis",
    });
  }
}

const initKlasifikasiSurveiModel = (sequelize: Sequelize) => {
  KlasifikasiSurvei.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      jenis_survei: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "KlasifikasiSurvei",
      tableName: "klasifikasisurveis",
      timestamps: true,
    }
  );
};

export { KlasifikasiSurvei, initKlasifikasiSurveiModel };
