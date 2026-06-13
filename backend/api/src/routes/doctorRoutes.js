import express from 'express';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { getAllDoctors, getMyDoctorProfile, toggleAvailability, completeConsultation, getDoctorAppointments, getDoctorHistory } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/', getAllDoctors); // Public: list verified doctors
router.get('/me', authMiddleware, requireRole('doctor'), getMyDoctorProfile);
router.get('/me/history', authMiddleware, requireRole('doctor'), getDoctorHistory);
router.get('/:doctorId/appointments', authMiddleware, getDoctorAppointments);
router.patch('/me/availability', authMiddleware, requireRole('doctor'), toggleAvailability);
router.post('/me/complete', authMiddleware, requireRole('doctor'), completeConsultation);

export default router;
