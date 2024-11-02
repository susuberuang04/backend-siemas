import { Model, DataTypes, Sequelize } from "sequelize";

export interface UserAttributes {
  id?: number;
  nama_lengkap: string;
  email: string;
  username: string;
  password: string;
  no_hp: string;
  role: string;
  status: string;
  is_confirm?: boolean;
  is_feedback?: boolean;
  opd_id?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public nama_lengkap!: string;
  public email!: string;
  public username!: string;
  public password!: string;
  public no_hp!: string;
  public role!: string;
  public status!: string;
  public is_confirm?: boolean;
  public is_feedback?: boolean;
  public opd_id!: number;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  static associate(models: any) {
    User.belongsTo(models.Opd, {
      foreignKey: "opd_id",
      as: "opd",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.UsulanSmart, {
      foreignKey: "user_id",
      as: "usulanSmarts",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.FeedBack, {
      foreignKey: "user_id",
      as: "feedbacks",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
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
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      no_hp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "aktif",
      },
      is_confirm: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_feedback: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      opd_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Opds",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
    }
  );
};
