import { Router } from "express";
import { deleteUser, getUserById, getUsers, updateUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/upload.js";

const router = Router();
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", upload.single("profilePhoto"), updateUser);
router.delete("/:id", deleteUser);

export default router;
