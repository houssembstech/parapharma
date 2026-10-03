import express from "express";
import { 
  registerUser, 
  authUser, 
  getProfile, 
  forgotPassword, 
  resetPassword,
  updatePassword
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resetToken", resetPassword);
router.get("/profile", protect, getProfile);
router.put("/profile/password", protect, updatePassword);

export default router;