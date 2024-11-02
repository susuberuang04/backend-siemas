import { Router } from "express";
import JawabanSurveiSpbeController from "../app/controllers/jawabanSurveiSpbeControllers";
import authMiddleware from "../app/middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  JawabanSurveiSpbeController.createSurveiKementrian
);
router.get(
  "/:user_id",
  authMiddleware,
  JawabanSurveiSpbeController.getAllByUserId
);
router.get(
  "/file/:user_id",
  authMiddleware,
  JawabanSurveiSpbeController.showFileData
);
router.get("/file/show/:filename", JawabanSurveiSpbeController.showBuktiDukung);
router.get(
  "/filter-unik/selesai-upload",
  authMiddleware,
  JawabanSurveiSpbeController.getAllSudahMenguploadUniqueSuperadmin
);

export default router;
