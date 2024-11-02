import { Router } from "express";
import authMiddleware from "../app/middleware/authMiddleware";
import KegiatanSurveiController from "../app/controllers/kegiatanSurveiController";

const router = Router();

router.get("/", authMiddleware, KegiatanSurveiController.getAllKegiatanSurvei);
router.get("/q", authMiddleware, KegiatanSurveiController.search);
router.get("/:id", authMiddleware, KegiatanSurveiController.getById);
router.post("/", authMiddleware, KegiatanSurveiController.createKegiatanSurvei);
router.put(
  "/:id",
  authMiddleware,
  KegiatanSurveiController.updateKegiatanSurvei
);

export default router;
