import { Sequelize, ModelCtor, Model } from "sequelize";
import { initOpdModel, Opd } from "./opd";
import { initUserModel, User } from "./user";
import { initKategoriModel, Kategori } from "./kategori";
import { initUsulanSmartModel, UsulanSmart } from "./usulansmart";
import { initFeedBackModel, FeedBack } from "./feedback";
import { initProgresModel, Progres } from "./progres";
import { initTrackingModel, Tracking } from "./tracking";
import { initLogErrorModel, LogError } from "./logerror";
import { initNotifikasiModel, Notifikasi } from "./notifikasi";
import {
  initHistoryPenghapusanModel,
  HistoryPenghapusan,
} from "./historypenghapusan";
import sequelizeKoneksi from "../config/connection";

interface Models {
  [key: string]: ModelCtor<Model<any, any>> & {
    associate?: (models: Models) => void;
  };
}

// Initialize the News model
initOpdModel(sequelizeKoneksi);
initUserModel(sequelizeKoneksi);
initKategoriModel(sequelizeKoneksi);
initUsulanSmartModel(sequelizeKoneksi);
initFeedBackModel(sequelizeKoneksi);
initProgresModel(sequelizeKoneksi);
initTrackingModel(sequelizeKoneksi);
initLogErrorModel(sequelizeKoneksi);
initHistoryPenghapusanModel(sequelizeKoneksi);
initNotifikasiModel(sequelizeKoneksi);

// Create a models object
const models: Models = {
  Opd,
  User,
  Kategori,
  UsulanSmart,
  FeedBack,
  Progres,
  Tracking,
  LogError,
  HistoryPenghapusan,
  Notifikasi,
};

Object.keys(models).forEach((modelName) => {
  const model = models[modelName];
  if (model.associate) {
    model.associate(models);
  }
});

// Export the Sequelize instance and the models
export { sequelizeKoneksi as sequelize, models };
