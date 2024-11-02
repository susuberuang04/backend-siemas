import { Router } from "express";
import authMiddleware from "../app/middleware/authMiddleware";
import JawabanPertanyaanSurveiController from "../app/controllers/jawabanPertanyaanSurveiController";
const router = Router();

router.get(
  "/survei",
  authMiddleware,
  JawabanPertanyaanSurveiController.getAllJawabanPertanyaanSurvei
);
router.get(
  "/survei/q",
  authMiddleware,
  JawabanPertanyaanSurveiController.search
);
router.get(
  "/survei/:id",
  authMiddleware,
  JawabanPertanyaanSurveiController.getById
);
router.post(
  "/survei",
  authMiddleware,
  JawabanPertanyaanSurveiController.createJawabanPertanyaanSurvei
);
router.put(
  "/survei/:id",
  authMiddleware,
  JawabanPertanyaanSurveiController.updateJawabanPertanyaanSurvei
);

export default router;
