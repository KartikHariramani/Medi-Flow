import { supabase } from '../supabase.js';
import dotenv from 'dotenv';
import { sendAppointmentConfirmationTelegram } from '../services/telegramService.js';
import { sendAppointmentConfirmationDatabase } from '../services/notificationDatabaseService.js';
dotenv.config();

export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, priority, appointmentDate, timeSlot } = req.body;
    
    // Resolve patient record from authenticated user
    const { data: patientRecord, error: patientErr } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (patientErr || !patientRecord) {
      return res.status(404).json({ error: 'Patient profile not found. Please register as a patient.' });
    }

    const patientId = patientRecord.id;

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ error: 'doctorId, appointmentDate, and timeSlot are required' });
    }

    const isEmergency = priority === 'emergency';

    // 1. Fetch current queue analytics to pass to AI
    const { data: queueData, error: queueErr } = await supabase
      .from('queue')
      .select('position, appointments(priority)')
      .eq('doctor_id', doctorId);

    if (queueErr) throw queueErr;

    const patientsAhead = queueData ? queueData.length : 0;
    const emergenciesAhead = queueData ? queueData.filter(q => q.appointments.priority === 'emergency').length : 0;
    
    // Check total appointments for token generation logic
    const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
    const nextToken = (count || 0) + 1;

    // 2. Ping AI for Predict Wait Time
    const aiServiceUrl = process.env.VITE_AI_URL || 'http://localhost:8000';
    let aiWaitTime = 15 * patientsAhead; // Fallback
    
    try {
      const aiResponse = await fetch(`${aiServiceUrl}/ai/predict-wait-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_number: nextToken,
          current_queue_position: patientsAhead + 1,
          avg_consultation_time: 15,
          patients_ahead: patientsAhead,
          emergency_count_in_queue: emergenciesAhead + (isEmergency ? 1 : 0)
        })
      });
      const aiData = await aiResponse.json();
      if (aiData && aiData.estimated_wait_minutes) {
        aiWaitTime = aiData.estimated_wait_minutes;
      }
    } catch (aiError) {
      console.warn("AI Predictor unavailable, using mathematical fallback.");
    }

    // 3. Database Insertion (Smart Fallback Logic)
    let apptData, apptErr;

    // TRY A: Full Scheduling Insert (V2)
    const { data: fullData, error: fullErr } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        token_number: nextToken,
        priority: priority || 'normal',
        status: 'waiting',
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        symptoms: req.body.symptoms || null,
        estimated_wait_time: isEmergency ? 5 : (nextToken * 15)
      })
      .select()
      .single();

    if (fullErr && fullErr.message.includes('column')) {
       console.warn("⚠️ DATABASE MIGRATION MISSING: Falling back to Level 1 Booking.");
       // TRY B: Legacy Insert (V1)
       const { data: legacyData, error: legacyErr } = await supabase
         .from('appointments')
         .insert({
           patient_id: patientId,
           doctor_id: doctorId,
           token_number: nextToken,
           priority: priority || 'normal',
           status: 'waiting',
           estimated_wait_time: isEmergency ? 5 : (nextToken * 15)
         })
         .select()
         .single();
       
       apptData = legacyData;
       apptErr = legacyErr;
    } else {
       apptData = fullData;
       apptErr = fullErr;
    }

    if (apptErr) throw apptErr;

    // Determine the position.
    const targetPosition = isEmergency ? 1 : (patientsAhead + 1);

    if (isEmergency && queueData && queueData.length > 0) {
       for (let item of queueData) {
          await supabase.from('queue').update({ position: item.position + 1 }).eq('position', item.position).eq('doctor_id', doctorId);
       }
    }

    // Insert Queue entry
    const { data: queueInsertData, error: queueInsertError } = await supabase
      .from('queue')
      .insert({
        doctor_id: doctorId,
        appointment_id: apptData.id,
        position: targetPosition
      })
      .select()
      .single();

    if (queueInsertError) throw queueInsertError;

    // 4. Send Telegram Notification (Asynchronous)
    (async () => {
       try {
          console.log(`🚀 TELEGRAM TRIGGER: Processing notification for Appointment ID: ${apptData.id}`);
          
          // Enhanced Fetch: explicitly joining patients -> users and doctors -> users
          const { data: namesData, error: nameErr } = await supabase
             .from('appointments')
             .select(`
                id,
                patients ( user_id, users:user_id (name) ),
                doctors ( user_id, users:user_id (name) )
             `)
             .eq('id', apptData.id)
             .single();

          if (nameErr) {
             console.error('❌ TELEGRAM FETCH ERROR:', nameErr.message);
             throw nameErr;
          }

          if (namesData) {
             const patientName = namesData.patients?.users?.name || 'Valued Patient';
             const doctorName = namesData.doctors?.users?.name || 'Specialist';
             
             
             const telegramResult = await sendAppointmentConfirmationTelegram(
                patientName,
                doctorName,
                apptData.appointment_date || 'Today',
                apptData.time_slot || 'ASAP',
                nextToken,
                targetPosition,
                aiWaitTime
             );
             
             if (telegramResult.success) {
                console.log(`✅ TELEGRAM SENT SUCCESSFULLY for Appointment ${apptData.id}`);
             } else {
                console.log(`⚠️ Telegram failed, using database fallback...`);
                // Fallback to database if Telegram fails
                await sendAppointmentConfirmationDatabase(
                   patientUserId || req.userId,
                   patientName,
                   doctorName,
                   apptData.appointment_date || 'Today',
                   apptData.time_slot || 'ASAP',
                   nextToken,
                   targetPosition,
                   aiWaitTime
                );
                console.log(`✅ DATABASE FALLBACK SENT for Appointment ${apptData.id}`);
             }
          } else {
             console.warn('⚠️ Could not fetch patient/doctor names for telegram');
          }
       } catch (teleErr) { 
          console.error('❌ Telegram Notification Trigger Failed:', teleErr.message); 
       }
    })();

    return res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: apptData,
      queue_position: targetPosition,
      estimated_wait_minutes: aiWaitTime
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    return res.status(500).json({ error: 'Failed to book appointment' });
  }
};

export const getActiveAppointment = async (req, res) => {
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

    const { data, error } = await supabase
      .from('appointments')
      .select('*, doctors(users(name), specialization)')
      .eq('patient_id', patient.id)
      .in('status', ['waiting', 'in-consultation'])
      .order('booked_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.status(200).json({ appointment: data || null });
  } catch (error) {
    console.error('getActiveAppointment error:', error);
    return res.status(500).json({ error: 'Failed to fetch active appointment' });
  }
};

// POST /api/appointments/:id/emergency — fast-track a patient to position 1
export const triggerEmergencyAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select('*, patients(user_id, users(name)), doctors(user_id, users(name))')
      .eq('id', id)
      .single();

    if (apptError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const doctorId = appointment.doctor_id;

    // Mark as emergency
    await supabase
      .from('appointments')
      .update({ priority: 'emergency', estimated_wait_time: 2 })
      .eq('id', id);

    // Reorder queue: push this appointment to position 1
    const { data: queueData } = await supabase
      .from('queue')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('position', { ascending: true });

    if (queueData && queueData.length > 0) {
      const alreadyInQueue = queueData.find(q => q.appointment_id === id);
      if (alreadyInQueue) {
        let pos = 2;
        for (const item of queueData) {
          if (item.appointment_id === id) {
            await supabase.from('queue').update({ position: 1 }).eq('id', item.id);
          } else {
            await supabase.from('queue').update({ position: pos }).eq('id', item.id);
            pos++;
          }
        }
      } else {
        for (const item of queueData) {
          await supabase.from('queue').update({ position: item.position + 1 }).eq('id', item.id);
        }
        await supabase.from('queue').insert({ doctor_id: doctorId, appointment_id: id, position: 1 });
      }
    } else {
      await supabase.from('queue').insert({ doctor_id: doctorId, appointment_id: id, position: 1 });
    }

    // Send in-app notifications via database
    const patientName = appointment.patients?.users?.name || 'Patient';
    const doctorName = appointment.doctors?.users?.name || 'Specialist';
    const doctorUserId = appointment.doctors?.user_id;
    const patientUserId = appointment.patients?.user_id;

    const { sendNotificationViaDatabase } = await import('../services/notificationDatabaseService.js');
    if (doctorUserId) {
      await sendNotificationViaDatabase(
        doctorUserId,
        '🚨 EMERGENCY PATIENT',
        `${patientName} has been fast-tracked to position #1 in your queue. Please prepare immediately.`,
        'emergency'
      );
    }
    if (patientUserId) {
      await sendNotificationViaDatabase(
        patientUserId,
        '🚨 Emergency Fast-Track Active',
        `You are now #1 in the queue. Proceed to Dr. ${doctorName} immediately.`,
        'emergency'
      );
    }

    // Send Telegram alert
    try {
      const { sendAppointmentConfirmationTelegram } = await import('../services/telegramService.js');
      await sendAppointmentConfirmationTelegram(
        patientName, doctorName, 'Today', 'ASAP', '🚨 EMERGENCY', 1, 2
      );
    } catch (e) { console.warn('Telegram emergency alert failed:', e.message); }

    return res.status(200).json({ message: 'Emergency activated. Patient is now #1 in queue.' });
  } catch (error) {
    console.error('triggerEmergencyAppointment error:', error);
    return res.status(500).json({ error: 'Failed to trigger emergency' });
  }
};

// PATCH /api/appointments/:id/travel-status — update live travel data & optimize queue
export const updateTravelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { live_location, distance, duration, departure_recommendation, status } = req.body;

    const { data: appt, error: apptError } = await supabase
      .from('appointments')
      .update({
        live_location,
        travel_distance: distance,
        travel_duration: Math.round(Number(duration || 0)),
        departure_recommendation,
        travel_status: status
      })
      .eq('id', id)
      .select('*, patients(id, users(name)), doctors(id, users(name))')
      .single();

    if (apptError || !appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // If delayed, call AI optimizer to rearrange queue
    if (status === 'delayed') {
      const doctorId = appt.doctor_id;
      const { data: queueData } = await supabase
        .from('queue')
        .select(`id, position, appointment_id, appointments(id, priority, token_number, patients(id, users(name)))`)
        .eq('doctor_id', doctorId)
        .order('position', { ascending: true });

      if (queueData && queueData.length > 0) {
        const currentQueue = queueData.map(q => ({
          appointment_id: q.appointment_id,
          patient_id: q.appointments.patients.id,
          patient_name: q.appointments.patients.users.name,
          token_number: q.appointments.token_number,
          priority: q.appointments.priority,
          position: q.position,
          travel_duration_minutes: q.appointment_id === id ? Number(duration || 0) : 0,
          is_delayed: q.appointment_id === id,
          is_arrived: false
        }));

        const aiServiceUrl = process.env.VITE_AI_URL || 'http://localhost:8000';
        try {
          const aiResponse = await fetch(`${aiServiceUrl}/ai/optimize-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctor_id: doctorId, current_queue: currentQueue })
          });
          const aiData = await aiResponse.json();
          if (aiData?.updated_positions) {
            for (const item of queueData) {
              const newPos = aiData.updated_positions[item.appointment_id];
              if (newPos !== undefined && newPos !== item.position) {
                await supabase.from('queue').update({ position: newPos, updated_at: new Date().toISOString() }).eq('id', item.id);
              }
            }
          }
        } catch (err) {
          console.warn('AI optimizer unavailable, skipping reorder.', err.message);
        }
      }
    }

    return res.status(200).json({ message: 'Travel status updated', appointment: appt });
  } catch (error) {
    console.error('updateTravelStatus error:', error);
    return res.status(500).json({ error: 'Failed to update travel status' });
  }
};
