import { Router } from "express";
import HistoryPenghapusanController from "../app/controllers/historyController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

const router = Router();

router.get(
  "/destroy/all",
  authMiddleware,
  checkRole("superadmin"),
  HistoryPenghapusanController.getAllHistoryPenghapusan
);

router.get(
  "/restore/all",
  authMiddleware,
  checkRole("superadmin"),
  HistoryPenghapusanController.getAllHistoryPemulihan
);

router.get(
  "/destroy/by/q",
  authMiddleware,
  checkRole("superadmin"),
  HistoryPenghapusanController.searchHistoryPenghapusan
);

router.get(
  "/restore/by/q",
  authMiddleware,
  checkRole("superadmin"),
  HistoryPenghapusanController.searchHistoryrRestore
);
export default router;
