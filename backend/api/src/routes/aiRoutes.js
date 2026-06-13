import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { triageAppointment, predictNoShow, getResourceOptimization } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/triage
router.post('/triage', authMiddleware, triageAppointment);

// POST /api/ai/predict-noshow
router.post('/predict-noshow', authMiddleware, predictNoShow);

// GET /api/ai/optimize-resources
router.get('/optimize-resources', authMiddleware, getResourceOptimization);

export default router;
