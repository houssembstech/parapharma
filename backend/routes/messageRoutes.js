import express from "express";
import { sendMessage, getChats, getMessages, getUnreadCount } from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post('/send', protect, sendMessage);
router.get('/chats', protect, getChats);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:userId', protect, getMessages);

export default router;