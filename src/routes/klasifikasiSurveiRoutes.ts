import { Router } from "express";
import authMiddleware from "../app/middleware/authMiddleware";
import KlasifikasiSurveiController from "../app/controllers/klasifikasiSurveiController";

const router = Router();

router.get(
  "/",
  authMiddleware,
  KlasifikasiSurveiController.getAllKlasifikasiSurvei
);
router.get("/q", authMiddleware, KlasifikasiSurveiController.search);
router.get("/:id", authMiddleware, KlasifikasiSurveiController.getById);
router.post(
  "/",
  authMiddleware,
  KlasifikasiSurveiController.createKlasifikasiSurvei
);
router.put(
  "/:id",
  authMiddleware,
  KlasifikasiSurveiController.updateKlasifikasiSurvei
);

export default router;
