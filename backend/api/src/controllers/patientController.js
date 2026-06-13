import { supabase } from '../supabase.js';

// GET /api/patients/me — get logged-in patient's profile
export const getMyProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*, users(name, email, phone)')
      .eq('user_id', req.userId)
      .single();
    if (error) throw error;
    return res.status(200).json({ patient: data });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

// PATCH /api/patients/me/health — update health info
export const updateHealthInfo = async (req, res) => {
  try {
    const { dob, blood_group, has_diabetes, has_cancer, other_conditions } = req.body;

    // Get patient ID first
    const { data: patient, error: findErr } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.userId)
      .single();
    if (findErr) throw findErr;

    const { data, error } = await supabase
      .from('patients')
      .update({ dob, blood_group, has_diabetes, has_cancer, other_conditions })
      .eq('id', patient.id)
      .select()
      .single();
    if (error) throw error;

    return res.status(200).json({ message: 'Health info updated', patient: data });
  } catch (error) {
    console.error('updateHealthInfo error:', error);
    return res.status(500).json({ error: 'Failed to update health info' });
  }
};

// GET /api/patients/me/history — get medical history
export const getMedicalHistory = async (req, res) => {
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    const { data, error } = await supabase
      .from('medical_history')
      .select('*, doctors(users(name))')
      .eq('patient_id', patient.id)
      .order('visited_at', { ascending: false });
    if (error) throw error;

    return res.status(200).json({ history: data });
  } catch (error) {
    console.error('getMedicalHistory error:', error);
    return res.status(500).json({ error: 'Failed to fetch medical history' });
  }
};

// GET /api/patients/me/reports — get health reports
export const getHealthReports = async (req, res) => {
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    const { data, error } = await supabase
      .from('health_reports')
      .select('*')
      .eq('patient_id', patient.id)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;

    return res.status(200).json({ reports: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// POST /api/patients/me/questionnaire — save health questionnaire
export const submitQuestionnaire = async (req, res) => {
  try {
    const { answers } = req.body; // Array of { question, answer }
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    const rows = answers.map(a => ({
      patient_id: patient.id,
      question: a.question,
      answer: a.answer,
    }));

    const { data, error } = await supabase
      .from('health_questionnaire')
      .insert(rows)
      .select();
    if (error) throw error;

    // Mark questionnaire as completed in patients table
    await supabase
      .from('patients')
      .update({ questionnaire_completed: true })
      .eq('id', patient.id);

    return res.status(201).json({ message: 'Questionnaire submitted', data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit questionnaire' });
  }
};
