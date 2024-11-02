import { Router } from "express";
import authMiddleware from "../app/middleware/authMiddleware";
import PertanyaanSurveiController from "../app/controllers/pertanyaanSurveiController";

const router = Router();

router.get(
  "/",
  authMiddleware,
  PertanyaanSurveiController.getAllPertanyaanSurvei
);
router.get("/q", authMiddleware, PertanyaanSurveiController.search);
router.get("/:id", authMiddleware, PertanyaanSurveiController.getById);
router.post(
  "/",
  authMiddleware,
  PertanyaanSurveiController.createPertanyaanSurvei
);
router.put(
  "/:id",
  authMiddleware,
  PertanyaanSurveiController.updatePertanyaanSurvei
);

export default router;
