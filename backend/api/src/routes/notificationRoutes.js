import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendNotification, getMyNotifications, markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.post('/', authMiddleware, sendNotification);
router.get('/me', authMiddleware, getMyNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);

export default router;
