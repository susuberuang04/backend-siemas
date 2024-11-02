import { Model, DataTypes, Sequelize } from "sequelize";

interface usulanSmartAttributes {
  id?: number;
  nama_inovasi: string;
  deskripsi_inovasi: string;
  regulasi: string;
  dokumentasi: string;
  link_drive?: string;
  user_id?: number;
  kategori_id?: number;
  tahun?: string;
  deletedAt?: Date | null;
}

class UsulanSmart
  extends Model<usulanSmartAttributes>
  implements usulanSmartAttributes
{
  public id!: number;
  public nama_inovasi!: string;
  public regulasi!: string;
  public deskripsi_inovasi!: string;
  public dokumentasi!: string;
  public user_id?: number;
  public link_drive?: string;
  public kategori_id?: number;
  public tahun?: string;
  public deletedAt!: Date | null;

  static associate(models: any) {
    UsulanSmart.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    UsulanSmart.belongsTo(models.Kategori, {
      foreignKey: "kategori_id",
      as: "kategori",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

const initUsulanSmartModel = (sequelize: Sequelize) => {
  UsulanSmart.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nama_inovasi: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deskripsi_inovasi: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      regulasi: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dokumentasi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      link_drive: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Kategoris",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tahun: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UsulanSmarts",
      tableName: "usulansmarts",
      timestamps: true,
      paranoid: true,
    }
  );
  return UsulanSmart;
};

export { UsulanSmart, initUsulanSmartModel };
