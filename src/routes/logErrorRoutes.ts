import { Router } from "express";
import LogErrorController from "../app/controllers/logErrorController";
import authMiddleware from "../app/middleware/authMiddleware";
const router = Router();

router.post("/tambah", authMiddleware, LogErrorController.pushError);
router.get("/all", authMiddleware, LogErrorController.getAll);
router.get("/cekdeploy",  LogErrorController.checkDeploy);
router.get("/all/search/by/q", authMiddleware, LogErrorController.search);
export default router;
