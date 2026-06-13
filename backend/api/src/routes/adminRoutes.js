import express from 'express';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { getAnalytics, getUnverifiedDoctors, verifyDoctor, rejectDoctor, getAllPatients } from '../controllers/adminController.js';

const router = express.Router();

router.get('/analytics', authMiddleware, requireRole('admin'), getAnalytics);
router.get('/doctors/unverified', authMiddleware, requireRole('admin'), getUnverifiedDoctors);
router.patch('/doctors/:doctorId/verify', authMiddleware, requireRole('admin'), verifyDoctor);
router.delete('/doctors/:doctorId/reject', authMiddleware, requireRole('admin'), rejectDoctor);
router.get('/patients', authMiddleware, requireRole('admin'), getAllPatients);

export default router;
