import express from 'express';
import { getDoctorQueue } from '../controllers/queueController.js';

const router = express.Router();

// GET /api/queue/:doctorId
router.get('/:doctorId', getDoctorQueue);

export default router;
