import { Router } from "express";
import NotifikasiController from "../app/controllers/notifikasiController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";
const router = Router();

router.get(
  "/all",
  authMiddleware,
  checkRole("superadmin"),
  NotifikasiController.getAllNotifikasiBySuperadmin
);
router.get("/by/:user_id", NotifikasiController.getNotifikasiById);
router.post("/tambah", NotifikasiController.createNotifikasi);

export default router;
