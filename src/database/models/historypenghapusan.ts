import { Model, DataTypes, Sequelize } from "sequelize";

interface HistoryPenghapusanAttributes {
  id?: number;
  id_user: number;
  id_usulan: number;
  nama_data: string;
  tipe_data: string;
  nama_tabel: string;
  nama_pengguna: string;
  alasan_penghapusan: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class HistoryPenghapusan
  extends Model<HistoryPenghapusanAttributes>
  implements HistoryPenghapusanAttributes
{
  public id!: number;
  public id_user!: number;
  public id_usulan!: number;
  public nama_data!: string;
  public tipe_data!: string;
  public nama_tabel!: string;
  public nama_pengguna!: string;
  public alasan_penghapusan!: string;
  public status!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    HistoryPenghapusan.belongsTo(models.User, {
      foreignKey: "id_user",
      as: "user",
    });
  }
}

const initHistoryPenghapusanModel = (sequelize: Sequelize) => {
  HistoryPenghapusan.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      id_user: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      id_usulan: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      nama_data: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tipe_data: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nama_tabel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nama_pengguna: {
        type: DataTypes.STRING,
      },
      alasan_penghapusan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "HistoryPenghapusan",
      tableName: "historypenghapusans",
      timestamps: true,
    }
  );
};

export { HistoryPenghapusan, initHistoryPenghapusanModel };
