import { supabase } from '../supabase.js';
import { sendMedicineReminderTelegram } from '../services/telegramService.js';

// GET /api/doctors — list all verified doctors
export const getAllDoctors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, users(name, email)');
      // .eq('is_verified', true); <--- Bypassed for testing
    if (error) throw error;
    return res.status(200).json({ doctors: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

// GET /api/doctors/me — doctor's own profile
export const getMyDoctorProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, users(name, email, phone)')
      .eq('user_id', req.userId)
      .single();
    if (error) throw error;
    return res.status(200).json({ doctor: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

// PATCH /api/doctors/me/availability — toggle availability
export const toggleAvailability = async (req, res) => {
  try {
    const { is_available } = req.body;

    const { data, error } = await supabase
      .from('doctors')
      .update({ is_available })
      .eq('user_id', req.userId)
      .select()
      .single();
    if (error) throw error;

    return res.status(200).json({ message: `Availability set to ${is_available}`, doctor: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update availability' });
  }
};

// POST /api/doctors/me/complete — complete current consultation & advance queue
export const completeConsultation = async (req, res) => {
  try {
    const { appointmentId, diagnosis, prescription } = req.body;
    if (!appointmentId) return res.status(400).json({ error: 'appointmentId is required' });

    // 1. Mark appointment as completed
    const { error: apptErr } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId);
    if (apptErr) throw apptErr;

    // 2. Remove from queue
    const { error: queueErr } = await supabase
      .from('queue')
      .delete()
      .eq('appointment_id', appointmentId);
    if (queueErr) throw queueErr;

    // 3. Get doctor_id for reindexing
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    // 4. Reindex remaining queue positions
    const { data: remaining, error: remErr } = await supabase
      .from('queue')
      .select('id, position')
      .eq('doctor_id', doctor.id)
      .order('position', { ascending: true });

    if (!remErr && remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from('queue')
          .update({ position: i + 1, updated_at: new Date().toISOString() })
          .eq('id', remaining[i].id);
      }
    }

    // 5. Save to medical history and trigger telegram
    const { data: appt } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        patients ( users (name) ),
        doctors ( users (name) )
      `)
      .eq('id', appointmentId)
      .single();

    if (appt && (diagnosis || prescription)) {
      // If prescription is an array (structured), serialize it for storage
      let prescriptionText = prescription;
      if (Array.isArray(prescription)) {
        prescriptionText = prescription
          .map(m => `${m.name} (${m.dosage}) - ${m.timing}`)
          .join('\n');
      }

      await supabase.from('medical_history').insert({
        patient_id: appt.patient_id,
        doctor_id: doctor.id,
        diagnosis: diagnosis || null,
        prescription: prescriptionText || null,
      });

      // 6. Send Medicine Reminder if prescribed
      if (prescription && (Array.isArray(prescription) ? prescription.length > 0 : true)) {
         try {
           const patientName = appt.patients?.users?.name || 'Patient';
           const doctorName = appt.doctors?.users?.name || 'Doctor';
           
           // Fire and forget telegram message
           sendMedicineReminderTelegram(
             patientName,
             doctorName,
             'Prescribed Medication',
             prescription, // Now passing the array or string
             'As directed by doctor'
           ).catch(err => console.error('Failed to trigger medicine telegram:', err));
         } catch (e) { console.error('Telegram Trigger Error:', e) }
      }
    }

    return res.status(200).json({ message: 'Consultation completed, queue advanced' });
  } catch (error) {
    console.error('completeConsultation error:', error);
    return res.status(500).json({ error: 'Failed to complete consultation' });
  }
};

// GET /api/doctors/me/history
export const getDoctorHistory = async (req, res) => {
  try {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const { data, error } = await supabase
      .from('medical_history')
      .select(`
        *,
        patients (
          id,
          users (name, email)
        )
      `)
      .eq('doctor_id', doctor.id)
      .order('visited_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ history: data });
  } catch (error) {
    console.error('getDoctorHistory error:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};
// GET /api/doctors/:doctorId/appointments?date=YYYY-MM-DD
export const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          id,
          users (name, email)
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .order('token_number', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ appointments: data });
  } catch (error) {
    console.error('getDoctorAppointments error:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};
