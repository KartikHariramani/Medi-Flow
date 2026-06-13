import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Service Imports
import { initReminderService } from './services/reminderService.js';
import { initMedicineReminderService } from './services/medicineReminderService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'MediFlow API V2', version: '2.0.0' }));

// Initialize background services
initReminderService();
initMedicineReminderService();

// Mount all routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🏥 MediFlow API V2 running on http://localhost:${PORT}`);
  console.log(`📋 Routes mounted:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   POST   /api/appointments`);
  console.log(`   GET    /api/queue/:doctorId`);
  console.log(`   GET    /api/patients/me`);
  console.log(`   PATCH  /api/patients/me/health`);
  console.log(`   GET    /api/patients/me/history`);
  console.log(`   GET    /api/patients/me/reports`);
  console.log(`   POST   /api/patients/me/questionnaire`);
  console.log(`   GET    /api/doctors`);
  console.log(`   GET    /api/doctors/me`);
  console.log(`   PATCH  /api/doctors/me/availability`);
  console.log(`   POST   /api/doctors/me/complete`);
  console.log(`   GET    /api/admin/analytics`);
  console.log(`   GET    /api/admin/doctors/unverified`);
  console.log(`   PATCH  /api/admin/doctors/:id/verify`);
  console.log(`   DELETE /api/admin/doctors/:id/reject`);
  console.log(`   GET    /api/admin/patients`);
  console.log(`   POST   /api/notifications`);
  console.log(`   GET    /api/notifications/me`);
  console.log(`   PATCH  /api/notifications/:id/read\n`);
});

// Heartbeat to keep process alive (debugging exit issue)
setInterval(() => {}, 1000 * 60 * 60);

