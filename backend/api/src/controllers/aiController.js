import { supabase } from '../supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const aiServiceUrl = process.env.VITE_AI_URL || 'http://localhost:8000';

// POST /api/ai/triage
export const triageAppointment = async (req, res) => {
  try {
    const { appointmentId, symptoms } = req.body;
    if (!appointmentId || !symptoms) {
      return res.status(400).json({ error: 'appointmentId and symptoms are required' });
    }

    // Fetch appointment and patient data
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select('*, patients(*)')
      .eq('id', appointmentId)
      .single();

    if (apptErr || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const patient = appointment.patients;
    
    // Call FastAPI Triage Engine
    const triageResponse = await fetch(`${aiServiceUrl}/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: symptoms,
        medical_history: patient.other_conditions || [],
        chronic_conditions: [
          ...(patient.has_diabetes ? ['diabetes'] : []),
          ...(patient.has_cancer ? ['cancer'] : [])
        ]
      })
    });

    const triageData = await triageResponse.json();

    // If critical or high, automatically fast-track in queue and update priority
    if (triageData.risk_level === 'critical' || triageData.risk_level === 'high') {
      await supabase
        .from('appointments')
        .update({
          priority: 'emergency',
          symptoms: symptoms,
          estimated_wait_time: 2
        })
        .eq('id', appointmentId);

      // Reorder queue: push to top
      const { data: queueData } = await supabase
        .from('queue')
        .select('*')
        .eq('doctor_id', appointment.doctor_id)
        .order('position', { ascending: true });

      if (queueData && queueData.length > 0) {
        const alreadyInQueue = queueData.find(q => q.appointment_id === appointmentId);
        if (alreadyInQueue) {
          let pos = 2;
          for (const item of queueData) {
            if (item.appointment_id === appointmentId) {
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
          await supabase.from('queue').insert({ doctor_id: appointment.doctor_id, appointment_id: appointmentId, position: 1 });
        }
      } else {
        await supabase.from('queue').insert({ doctor_id: appointment.doctor_id, appointment_id: appointmentId, position: 1 });
      }
    } else {
      // Just update symptoms
      await supabase
        .from('appointments')
        .update({ symptoms: symptoms })
        .eq('id', appointmentId);
    }

    return res.status(200).json(triageData);
  } catch (error) {
    console.error('triageAppointment error:', error);
    return res.status(500).json({ error: 'Failed to triage patient' });
  }
};

// POST /api/ai/predict-noshow
export const predictNoShow = async (req, res) => {
  try {
    const { age, chronicConditionsCount, leadTimeDays, previousNoShows, appointmentHour } = req.body;
    
    const response = await fetch(`${aiServiceUrl}/ai/predict-noshow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: age || 30,
        chronic_conditions_count: chronicConditionsCount || 0,
        lead_time_days: leadTimeDays || 1,
        previous_no_shows: previousNoShows || 0,
        appointment_hour: appointmentHour || 12
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('predictNoShow error:', error);
    return res.status(500).json({ error: 'Failed to predict no-show probability' });
  }
};

// GET /api/ai/optimize-resources
export const getResourceOptimization = async (req, res) => {
  try {
    // Fetch departments, active doctors count, queue length, and emergency cases to compile loads
    const { data: doctors } = await supabase.from('doctors').select('*, queue(*)');
    
    // Group loads by specialization / department
    const deptMap = {};
    for (const doc of doctors || []) {
      const dept = doc.department || 'General';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department_name: dept,
          active_doctors: 0,
          queue_length: 0,
          avg_wait_minutes: 0,
          emergency_count: 0
        };
      }
      deptMap[dept].active_doctors += doc.is_available ? 1 : 0;
      deptMap[dept].queue_length += doc.queue ? doc.queue.length : 0;
      deptMap[dept].avg_wait_minutes += doc.avg_consultation_time * (doc.queue ? doc.queue.length : 0);
    }

    const departmentsList = Object.values(deptMap).map(d => {
      // Normalize wait time
      d.avg_wait_minutes = Math.round(d.avg_wait_minutes / Math.max(d.active_doctors, 1));
      return d;
    });

    const response = await fetch(`${aiServiceUrl}/ai/optimize-resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departments: departmentsList })
    });

    const data = await response.json();
    return res.status(200).json({
      departmentLoads: departmentsList,
      ...data
    });
  } catch (error) {
    console.error('getResourceOptimization error:', error);
    return res.status(500).json({ error: 'Failed to optimize resources' });
  }
};
