import { Router } from "express";
import TrackingController from "../app/controllers/trackingController";
const router = Router();
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

router.get(
  "/all",
  authMiddleware,
  checkRole("superadmin"),
  TrackingController.getAll
);

//adddadsa

router.get("/by/:id", authMiddleware, TrackingController.getById);
router.get(
  "/by/user/:user_id",
  authMiddleware,
  TrackingController.getByAllUserId
);
router.get(
  "/by/usulan/:usulan_id",
  authMiddleware,
  TrackingController.getByAllUsulanId
);
router.get(
  "/by/user/:user_id/usulan/:usulan_id",
  authMiddleware,
  TrackingController.getByAllUsulanIdAndUserId
);
export default router;
