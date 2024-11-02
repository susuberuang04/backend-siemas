import { Router } from "express";
import JawabanSurveiDiskominfoController from "../app/controllers/jawabanSurveiDiskominfoControllers";
import authMiddleware from "../app/middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  JawabanSurveiDiskominfoController.createSurveiKementrian
);
router.get(
  "/:user_id",
  authMiddleware,
  JawabanSurveiDiskominfoController.getAllByUserId
);
// router.get(
//   "/file/:user_id",
//   authMiddleware,
//   JawabanSurveiDiskominfoController.showFileData
// );
// router.get("/file/show/:filename", JawabanSurveiDiskominfoController.showBuktiDukung);
router.get(
  "/filter-unik/selesai-upload",
  authMiddleware,
  JawabanSurveiDiskominfoController.getAllSudahMenguploadUniqueSuperadmin
);

export default router;
