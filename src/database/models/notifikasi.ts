import { Model, DataTypes, Sequelize } from "sequelize";

interface NotifikasiAttributes {
  id?: number;
  user_id: number | null;
  usulan_id: number | null;
  title: string | null;
  message: string | null;
  is_read: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Notifikasi
  extends Model<NotifikasiAttributes>
  implements NotifikasiAttributes
{
  public id!: number;
  public user_id!: number | null;
  public usulan_id!: number | null;
  public title!: string | null;
  public message!: string | null;
  public is_read!: boolean | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {}
}

const initNotifikasiModel = (sequelize: Sequelize) => {
  Notifikasi.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      usulan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Notifikasi",
      tableName: "notifikasis",
      timestamps: true,
    }
  );
};

export { Notifikasi, initNotifikasiModel };
