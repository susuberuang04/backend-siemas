import { Router } from "express";
import OpdController from "../app/controllers/opdController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

const router = Router();
router.get("/all", authMiddleware, OpdController.getAll);
router.get("/excel", authMiddleware, OpdController.exportToexcel);

router.get("/q", authMiddleware, OpdController.search);
router.get("/:id", authMiddleware, OpdController.getById);
router.post(
  "/create",
  authMiddleware,
  checkRole("superadmin"),
  OpdController.createOpd
);
router.put(
  "/:id/edit",
  authMiddleware,
  checkRole("superadmin"),
  OpdController.editOpd
);
router.delete(
  "/:id/hapus",
  authMiddleware,
  checkRole("superadmin"),
  OpdController.deleteOpd
);

export default router;
