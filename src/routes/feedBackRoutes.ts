import { Router } from "express";
import FeedBackController from "../app/controllers/feedbackController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

const router = Router();

// router opd
router.get(
  "/all",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  FeedBackController.getAll
);

router.get(
  "/data/by/query",
  authMiddleware,
  checkRole("superadmin"),
  FeedBackController.searchDataFeedBack
);
router.get(
  "/:id",
  authMiddleware,
  checkRole("superadmin"),
  FeedBackController.getById
);
router.post(
  "/tambah/feedback",
  authMiddleware,
  checkRole(["admin", "user"]),
  FeedBackController.createFeedBack
);
router.put(
  "/:id/edit/feedback",
  authMiddleware,
  checkRole("superadmin"),
  FeedBackController.editFeedback
);
router.delete(
  "/:id/hapus/feedback",
  authMiddleware,
  checkRole("superadmin"),
  FeedBackController.deleteOpd
);

export default router;
