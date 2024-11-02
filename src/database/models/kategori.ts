import { Model, DataTypes, Sequelize } from "sequelize";

interface KategoriAttributes {
  id?: number;
  jenis_smart: string;
  deskripsi: string;
  foto_smart: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Kategori extends Model<KategoriAttributes> implements KategoriAttributes {
  public id!: number;
  public jenis_smart!: string;
  public deskripsi!: string;
  public foto_smart!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {
    Kategori.hasMany(models.UsulanSmart, {
      foreignKey: "kategori_id",
      as: "usulanSmarts",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

const initKategoriModel = (sequelize: Sequelize) => {
  Kategori.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      jenis_smart: {
        type: DataTypes.STRING,
      },
      deskripsi: {
        type: DataTypes.TEXT,
      },
      foto_smart: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Kategori",
      tableName: "kategoris",
      timestamps: true,
    }
  );
};

export { Kategori, initKategoriModel };
