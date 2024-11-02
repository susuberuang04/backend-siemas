import { Router } from "express";
import DashboardController from "../app/controllers/dashboardController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

const router = Router();

// router opd
router.get(
  "/admin/all",
  authMiddleware,
  DashboardController.dashboardDataUntukAdmin
);
router.get(
  "/other/by/:opdId",
  authMiddleware,
  DashboardController.dashboardDataUntukOther
);

router.get(
  "/top/teen/addprogress",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  DashboardController.SuperAdminChartTerajinMenambahProgres
);
router.get(
  "/odp/belum/mengusulkan",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  DashboardController.SuperAdminDaftarOpdBelumMengupload
);
router.get(
  "/odp/belum/berprogres",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  DashboardController.SuperAdminDaftarOpdBelumProgres
);
router.get(
  "/new/hot/feedback",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  DashboardController.SuperadminFiveNewFeedback
);
router.get(
  "/admin/persentase/akun",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  DashboardController.dashboardDataUntukAdminPersentaseStatusAccount
);
router.get(
  "/admin/chart",
  authMiddleware,
  DashboardController.dashboardDataUntukAdminChart
);

router.get(
  "/user/by/:userId",
  authMiddleware,
  DashboardController.dashboardDataUntukUser
);
router.get(
  "/user/by/:userId/aktifprogres",
  authMiddleware,
  DashboardController.dashboardDataUntukUserGrafikKeaktifanTambahProgres
);

export default router;
