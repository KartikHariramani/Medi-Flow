import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * 1. USER SCHEMA
 */
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }, // Hashed password
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'admin'], 
    default: 'patient' 
  },
  created_at: { type: Date, default: Date.now }
});

/**
 * 2. DOCTOR SCHEMA
 */
const DoctorSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  specialization: { type: String, required: true },
  department: { type: String, required: true },
  avg_consultation_time: { type: Number, default: 15 }, // in minutes
  is_verified: { type: Boolean, default: false },
  is_available: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

/**
 * 3. PATIENT SCHEMA
 */
const PatientSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dob: { type: Date },
  blood_group: { type: String },
  has_diabetes: { type: Boolean, default: false },
  has_cancer: { type: Boolean, default: false },
  other_conditions: [{ type: String }],
  questionnaire_completed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

/**
 * 4. HEALTH QUESTIONNAIRE SCHEMA
 */
const MediFlowQuestionnaireSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  question: { type: String, required: true },
  answer: { type: String },
  recorded_at: { type: Date, default: Date.now }
});

/**
 * 5. MEDICAL HISTORY SCHEMA
 */
const MedicalHistorySchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', default: null },
  condition: { type: String },
  diagnosis: { type: String },
  prescription: { type: String }, // Serialized or structured medical prescription text
  visited_at: { type: Date, default: Date.now }
});

/**
 * 6. HEALTH REPORTS SCHEMA
 */
const HealthReportsSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  file_url: { type: String, required: true },
  report_type: { type: String },
  uploaded_at: { type: Date, default: Date.now }
});

/**
 * 7. APPOINTMENT SCHEMA
 */
const AppointmentSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  appointment_date: { type: Date, default: Date.now, index: true },
  time_slot: { type: String, default: '09:00 AM' },
  token_number: { type: Number, required: true },
  priority: { 
    type: String, 
    enum: ['normal', 'emergency'], 
    default: 'normal' 
  },
  status: { 
    type: String, 
    enum: ['waiting', 'in-consultation', 'completed', 'cancelled'], 
    default: 'waiting' 
  },
  booked_at: { type: Date, default: Date.now },
  estimated_wait_time: { type: Number }, // in minutes
  symptoms: { type: String },
  qr_code_url: { type: String },
  reminder_sent: { type: Boolean, default: false },
  
  // Real-time Travel & Live Location Integration
  travel_status: {
    live_location: { type: String }, // e.g. "lat,lng" or street address
    distance: { type: String }, // e.g. "4.2 km"
    duration: { type: Number }, // travel duration in minutes
    departure_recommendation: { type: String }, // e.g. "Leave by 09:15 AM"
    status: { type: String, enum: ['on_time', 'delayed', 'arrived'], default: 'on_time' }
  }
});

/**
 * 8. LIVE QUEUE SCHEMA
 */
const QueueSchema = new Schema({
  doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  appointment_id: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
  position: { type: Number, required: true },
  updated_at: { type: Date, default: Date.now }
});

/**
 * 9. MEDICINES SCHEMA (Medication tracker)
 */
const MedicineSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor_id: { type: Schema.Types.ObjectId, ref: 'Doctor', default: null },
  medicine_name: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g., "500mg" or "1 pill"
  frequency: { type: String, default: 'daily' }, // e.g., 'daily', 'twice-daily'
  timing: { type: String, required: true }, // e.g., "09:00 AM", "02:00 PM"
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date },
  is_active: { type: Boolean, default: true },
  reminder_sent_today: { type: Boolean, default: false },
  last_reminder_sent_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

/**
 * 10. NOTIFICATION SCHEMA
 */
const NotificationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['turn_alert', 'emergency', 'reschedule', 'general'], 
    default: 'general' 
  },
  is_read: { type: Boolean, default: false },
  sent_at: { type: Date, default: Date.now }
});

// Compile and Export Models
export const User = mongoose.model('User', UserSchema);
export const Doctor = mongoose.model('Doctor', DoctorSchema);
export const Patient = mongoose.model('Patient', PatientSchema);
export const MediFlowQuestionnaire = mongoose.model('MediFlowQuestionnaire', MediFlowQuestionnaireSchema);
export const MedicalHistory = mongoose.model('MedicalHistory', MedicalHistorySchema);
export const HealthReports = mongoose.model('HealthReports', HealthReportsSchema);
export const Appointment = mongoose.model('Appointment', AppointmentSchema);
export const Queue = mongoose.model('Queue', QueueSchema);
export const Medicine = mongoose.model('Medicine', MedicineSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);

