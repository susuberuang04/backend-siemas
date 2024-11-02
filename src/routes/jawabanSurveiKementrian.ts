import { Router } from "express";
import JawabanSurveiKementrianController from "../app/controllers/jawabanSurveiKementrianControllers";
import authMiddleware from "../app/middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  JawabanSurveiKementrianController.createSurveiKementrian
);
router.get(
  "/:user_id",
  authMiddleware,
  JawabanSurveiKementrianController.getAllByUserId
);
router.get(
  "/file/:user_id",
  authMiddleware,
  JawabanSurveiKementrianController.showFileData
);
router.get(
  "/file/show/:filename",
  JawabanSurveiKementrianController.showBuktiDukung
);
router.get(
  "/filter-unik/selesai-upload",
  authMiddleware,
  JawabanSurveiKementrianController.getAllSudahMenguploadUniqueSuperadmin
);

export default router;
