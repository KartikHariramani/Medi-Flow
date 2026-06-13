import express from 'express';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { getMyProfile, updateHealthInfo, getMedicalHistory, getHealthReports, submitQuestionnaire } from '../controllers/patientController.js';

const router = express.Router();

router.get('/me', authMiddleware, requireRole('patient'), getMyProfile);
router.patch('/me/health', authMiddleware, requireRole('patient'), updateHealthInfo);
router.get('/me/history', authMiddleware, requireRole('patient'), getMedicalHistory);
router.get('/me/reports', authMiddleware, requireRole('patient'), getHealthReports);
router.post('/me/questionnaire', authMiddleware, requireRole('patient'), submitQuestionnaire);

export default router;
