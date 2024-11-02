import { ModelCtor, Model } from "sequelize";
import sequelizeKoneksi from "../config/connection";
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
import {
  initKlasifikasiSurveiModel,
  KlasifikasiSurvei,
} from "./klasifikasisurvei";
import { initKegiatanSurveisModel, KegiatanSurvei } from "./kegiatansurvei";
import { initJadwalSurveiModel, JadwalSurvei } from "./jadwalsurvei";
import {
  initPertanyaanSurveiModel,
  PertanyaanSurvei,
} from "./pertanyaansurvei";
import {
  initJawabanPertanyaanSurveiModel,
  JawabanPertanyaanSurvei,
} from "./jawabanpertanyaansurvei";
import {
  initJawabanSurveiKementerianModel,
  JawabanSurveiKementrian,
} from "./jawabansurveikementrian";

import {
  initJawabanSurveiKominfoModel,
  JawabanSurveiKominfo,
} from "./jawabansurveikominfo";

import {
  JawabanSurveiSpbe,
  initJawabanSurveiSpbeModel,
} from "./jawabansurveispbe";

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
initKlasifikasiSurveiModel(sequelizeKoneksi);
initKegiatanSurveisModel(sequelizeKoneksi);
initJadwalSurveiModel(sequelizeKoneksi);
initPertanyaanSurveiModel(sequelizeKoneksi);
initJawabanPertanyaanSurveiModel(sequelizeKoneksi);
initJawabanSurveiKementerianModel(sequelizeKoneksi);
initJawabanSurveiKominfoModel(sequelizeKoneksi);
initJawabanSurveiSpbeModel(sequelizeKoneksi);

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
  KlasifikasiSurvei,
  KegiatanSurvei,
  JadwalSurvei,
  PertanyaanSurvei,
  JawabanPertanyaanSurvei,
  JawabanSurveiKementrian,
  JawabanSurveiKominfo,
  JawabanSurveiSpbe,
};

Object.keys(models).forEach((modelName) => {
  const model = models[modelName];
  if (model.associate) {
    model.associate(models);
  }
});

// Export the Sequelize instance and the models
export { sequelizeKoneksi as sequelize, models };
