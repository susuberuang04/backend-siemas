import { Model, DataTypes, Sequelize } from "sequelize";

interface JawabanSurveiKominfoAttributes {
  id?: number;
  nama_lengkap: string;
  email: string;
  instansi: string;
  jabatan: string;
  alamat: string;
  jawaban_survei: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class JawabanSurveiKominfo
  extends Model<JawabanSurveiKominfoAttributes>
  implements JawabanSurveiKominfoAttributes
{
  public id!: number;
  public nama_lengkap!: string;
  public email!: string;
  public instansi!: string;
  public jabatan!: string;
  public alamat!: string;
  public jawaban_survei!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {}
}

const initJawabanSurveiKominfoModel = (sequelize: Sequelize) => {
  JawabanSurveiKominfo.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nama_lengkap: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      instansi: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      jabatan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alamat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      jawaban_survei: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JawabanSurveiKominfo",
      tableName: "jawabansurveikominfos",
      timestamps: true,
    }
  );
};

export { JawabanSurveiKominfo, initJawabanSurveiKominfoModel };
