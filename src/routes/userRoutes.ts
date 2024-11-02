import { Router } from "express";
import UserController from "../app/controllers/userController";
import authMiddleware from "../app/middleware/authMiddleware";
import checkRole from "../app/middleware/checkRoleMiddleware";

const router = Router();

// router auth
router.get(
  "/all",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  UserController.getAllUsers
);
router.get(
  "/by/opd/:opd_id",
  authMiddleware,
  checkRole(["superadmin", "other"]),
  UserController.getAllUsersByOpdId
);
router.get("/change", UserController.handleResetValidasi);
router.put("/change", UserController.resetPassword);
router.get("/:username/change/reset", UserController.getByUsername);
router.get("/showfoto/brand", UserController.showFotoBrandPemkab);
router.get("/search/pengguna/query", authMiddleware, UserController.search);
router.get("/:id", authMiddleware, UserController.getUserById);
router.post(
  "/tambah/akun",
  authMiddleware,
  checkRole("superadmin"),
  UserController.tambahUsers
);
router.put("/:id/edit", authMiddleware, UserController.editUsers);
router.put("/:id/edituser", authMiddleware, UserController.editUserInAccount);
router.post("/login", UserController.loginUser);
router.post("/logout", UserController.logout);
router.post("/update/untuk/feedback", UserController.updateAllAkunForFeedback);
router.post(
  "/update/tidak/feedback",
  UserController.updateAllAkunForNotFeedback
);
router.delete(
  "/:id/hapus",
  authMiddleware,
  checkRole("superadmin"),
  UserController.deleteUser
);
router.put(
  "/:id/disabled",
  authMiddleware,
  checkRole("superadmin"),
  UserController.disabledUser
);

export default router;
