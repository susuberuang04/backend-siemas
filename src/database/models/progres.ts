import { Model, DataTypes, Sequelize } from "sequelize";

interface ProgresAttributes {
  id?: number;
  user_id: number | null;
  usulan_id: number | null;
  tanggal: string;
  foto_kegiatan: string;
  deskripsi_kegiatan: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
class Progres extends Model<ProgresAttributes> implements ProgresAttributes {
  public id!: number;
  public user_id!: number | null;
  public usulan_id!: number | null;
  public tanggal!: string;
  public foto_kegiatan!: string;
  public deskripsi_kegiatan!: string;
  public deletedAt!: Date | null;
  public createdAt?: Date;
  public updatedAt?: Date;

  static associate(models: any) {
    Progres.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Progres.belongsTo(models.UsulanSmart, {
      foreignKey: "usulan_id",
      as: "usulanSmarts",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

const initProgresModel = (sequelize: Sequelize) => {
  Progres.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      usulan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "UsulanSmarts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tanggal: {
        type: DataTypes.STRING,
      },
      foto_kegiatan: {
        type: DataTypes.STRING,
      },
      deskripsi_kegiatan: {
        type: DataTypes.STRING,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Progres",
      tableName: "progres",
      timestamps: true,
      paranoid: true,
    }
  );
};

export { Progres, initProgresModel };
