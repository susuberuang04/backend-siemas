import { Router } from "express";
import ProgressKegiatanController from "../app/controllers/progresController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

const router = Router();

// router opd
router.get(
  "/all",
  authMiddleware,
  checkRole("superadmin"),
  authMiddleware,
  ProgressKegiatanController.getAll
);
router.get(
  "/show/foto/:id",
  authMiddleware,
  ProgressKegiatanController.showFotoKegiatan
);
router.get(
  "/show/foto/:id/laporan",
  ProgressKegiatanController.showFotoKegiatanByLaporan
);
router.get("/by/:id", authMiddleware, ProgressKegiatanController.getById);

router.get(
  "/show/bukti-dukung/:nama_file",
  ProgressKegiatanController.showBuktiDukungProgresKegiatanByDetailId
);

router.get(
  "/all/by/user/:user_id",
  authMiddleware,
  ProgressKegiatanController.getAllByUserId
);
router.get(
  "/all/by/user/:user_id/usulan/:usulan_id",
  authMiddleware,
  ProgressKegiatanController.getAllByUserIdAndUsulanID
);
router.get(
  "/all/by/user/:user_id/usulan/:usulan_id/by/q",
  authMiddleware,
  ProgressKegiatanController.search
);
router.get(
  "/all/by/user/:user_id/usulan/:usulan_id/base",
  authMiddleware,
  ProgressKegiatanController.getAllByUserIdAndUsulanIDWithBase
);
router.get(
  "/all/by/user/:user_id/usulan/:usulan_id/optimasisasi",
  authMiddleware,
  ProgressKegiatanController.getAllByUserIdAndUsulanIDOptimasasi
);
router.post(
  "/tambah",
  authMiddleware,
  checkRole("admin"),
  ProgressKegiatanController.createProgres
);
router.put(
  "/edit/:id",
  authMiddleware,
  checkRole(["superadmin", "admin"]),
  ProgressKegiatanController.editProgres
);
router.delete(
  "/hapus/:id",
  authMiddleware,
  checkRole(["superadmin", "admin"]),
  ProgressKegiatanController.deleteProgres
);
router.delete(
  "/hapus/:id/permanen",
  authMiddleware,
  checkRole("superadmin"),
  ProgressKegiatanController.deleteProgresPermanen
);
router.post(
  "/:id/restore",
  authMiddleware,
  checkRole("superadmin"),
  ProgressKegiatanController.restoreProgres
);

export default router;
