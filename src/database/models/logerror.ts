import { Model, DataTypes, Sequelize } from "sequelize";

interface logErrorAttributes {
  id?: number;
  error_message: string;
  jenis_akses: string;
  stack_trace: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class LogError extends Model<logErrorAttributes> implements logErrorAttributes {
  public id!: number;
  public error_message!: string;
  public jenis_akses!: string;
  public stack_trace!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(models: any) {}
}

const initLogErrorModel = (sequelize: Sequelize) => {
  LogError.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      jenis_akses: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      stack_trace: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "LogError",
      tableName: "logerrors",
      timestamps: true,
    }
  );
};

export { LogError, initLogErrorModel };
