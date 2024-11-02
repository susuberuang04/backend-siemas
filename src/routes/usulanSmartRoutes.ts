import { Router } from "express";
import usulanSmartController from "../app/controllers/usulanSmartController";
import inovasiSmartController from "../app/controllers/inovasiSmartController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

const router = Router();

router.get(
  "/all",
  authMiddleware,
  checkRole("superadmin"),
  usulanSmartController.getAll
);

router.get(
  "/grafik/trand/inovasi",
  authMiddleware,
  usulanSmartController.grafikLineTrendInovasiPertahun
);

router.get(
  "/grafik/distribusi/inovasi",
  usulanSmartController.grafikDistribusiKategori
);

router.get(
  "/grafik/distribusi/progres",
  usulanSmartController.grafikDistribusiProgres
);

router.get(
  "/show/regulasi/:nama_file",
  usulanSmartController.showBuktiDukungRegulasiByDetailId
);
router.get(
  "/show/dokumentasi/:nama_file",
  usulanSmartController.showBuktiDukungDokumentasiByDetailId
);

router.get(
  "/q",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.search
);
router.get(
  "/show/gambar/:id",

  usulanSmartController.showDokumentasi
);
router.get(
  "/download/dokumentasi/:id",
  usulanSmartController.downloadDokumentasi
);
router.get("/download/regulasi/:id", usulanSmartController.downloadRegulasi);
router.get(
  "/show/pdf/:id",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.showRegulasi
);
router.get(
  "/all/:user_id/:kategori_id/user",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.getAllByUserIdAndByKategoriId
);
router.get(
  "/all/:user_id/user/by/items",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.getAllByUserId
);

router.get(
  "/all/:kategori_id/semuadata",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.getAllByKategoriId
);
router.get(
  "/search/:user_id/:kategori_id/by/query",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.search
);

router.get(
  "/search/:user_id/by/query/admin",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.searchAllByUserAdmin
);

router.get(
  "/search/:kategori_id/admin/search/by/query",
  authMiddleware,
  checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.searchAllByAdminKategoriId
);
router.get(
  "/:id",
  // authMiddleware,
  // checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.getById
);

router.get(
  "/:id/optimasisi/:user_id",
  // authMiddleware,
  // checkRole(["superadmin", "admin", "other"]),
  usulanSmartController.getByIdOptimisasi
);
// update route
router.post("/tambah", inovasiSmartController.updateApiTambahInovasi);

router.put(
  "/edit/:id",
  authMiddleware,
  // checkRole(["superadmin", "admin"]),
  inovasiSmartController.updateApiUpdateInovasi
);
router.delete(
  "/:id/hapus",
  authMiddleware,
  checkRole(["superadmin", "admin"]),
  usulanSmartController.deleteUsulanSmart
);
router.post(
  "/:id/restore",
  authMiddleware,
  checkRole("superadmin"),
  usulanSmartController.restoreUsulanSmartPermanen
);

router.delete(
  "/:id/hapus/permanen",
  authMiddleware,
  checkRole("superadmin"),
  usulanSmartController.deleteUsulanSmartPermanen
);

router.get(
  "/all/by/admin/query",
  authMiddleware,
  checkRole("superadmin"),
  usulanSmartController.searchAllByAdmin
);

router.post("/export/pdf", usulanSmartController.exportDownloadPdf);
router.post(
  "/export/pdf/laravel",
  usulanSmartController.exportDownloadByHitApi
);
router.get("/export/zip", usulanSmartController.exportDownloadZip);

export default router;
