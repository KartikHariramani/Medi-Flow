import express from 'express';
import { bookAppointment, getActiveAppointment, triggerEmergencyAppointment, updateTravelStatus } from '../controllers/appointmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/appointments
router.post('/', authMiddleware, bookAppointment);

// GET /api/appointments/active
router.get('/active', authMiddleware, getActiveAppointment);

// POST /api/appointments/:id/emergency — fast-track to position 1
router.post('/:id/emergency', authMiddleware, triggerEmergencyAppointment);

// PATCH /api/appointments/:id/travel-status — update live travel data
router.patch('/:id/travel-status', authMiddleware, updateTravelStatus);

export default router;
