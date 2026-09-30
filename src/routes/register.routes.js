import { Router } from "express";
import { requestRegistrationCode, verifyRegistrationCode } from "../controllers/register.controller.js";
import { upload } from "../middlewares/upload.js";

const router = Router();
router.post("/", requestRegistrationCode);
router.post("/verifyCodeEmail", upload.single("profilePhoto"), verifyRegistrationCode);

export default router;
