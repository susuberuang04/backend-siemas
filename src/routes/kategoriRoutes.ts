import { Router } from "express";
import KategoriController from "../app/controllers/kategoriController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";
const router = Router();

router.get("/all", authMiddleware, KategoriController.getAll);
router.get("/foto/:id", authMiddleware, KategoriController.showFoto);
router.get("/cari/data/by", authMiddleware, KategoriController.search);
router.get("/:id", authMiddleware, KategoriController.getById);
router.post(
  "/tambah",
  authMiddleware,
  checkRole("superadmin"),
  KategoriController.tambahKategori
);
router.put(
  "/:id/edit",
  authMiddleware,
  checkRole("superadmin"),
  KategoriController.editKategori
);
router.delete(
  "/:id/hapus",
  authMiddleware,
  checkRole("superadmin"),
  KategoriController.deleteKategori
);

export default router;
