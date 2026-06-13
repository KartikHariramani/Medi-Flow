import { supabase } from '../supabase.js';

// GET /api/admin/analytics — platform-wide analytics
export const getAnalytics = async (req, res) => {
  try {
    const { count: totalPatients } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    const { count: totalDoctors } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
    const { count: totalAppointments } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
    const { count: pendingVerifications } = await supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_verified', false);
    const { count: activeInQueue } = await supabase.from('queue').select('*', { count: 'exact', head: true });

    // Average wait time from recent appointments
    const { data: recentAppts } = await supabase
      .from('appointments')
      .select('estimated_wait_time')
      .not('estimated_wait_time', 'is', null)
      .order('booked_at', { ascending: false })
      .limit(50);

    const avgWait = recentAppts && recentAppts.length > 0
      ? Math.round(recentAppts.reduce((sum, a) => sum + (a.estimated_wait_time || 0), 0) / recentAppts.length)
      : 0;

    return res.status(200).json({
      totalPatients: totalPatients || 0,
      totalDoctors: totalDoctors || 0,
      totalAppointments: totalAppointments || 0,
      pendingVerifications: pendingVerifications || 0,
      activeInQueue: activeInQueue || 0,
      avgWaitTime: avgWait,
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// GET /api/admin/doctors/unverified — doctors pending verification
export const getUnverifiedDoctors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, users(name, email)')
      .eq('is_verified', false);
    if (error) throw error;
    return res.status(200).json({ doctors: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch unverified doctors' });
  }
};

// PATCH /api/admin/doctors/:doctorId/verify — approve a doctor
export const verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { data, error } = await supabase
      .from('doctors')
      .update({ is_verified: true })
      .eq('id', doctorId)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ message: 'Doctor verified', doctor: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify doctor' });
  }
};

// DELETE /api/admin/doctors/:doctorId/reject — reject a doctor
export const rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { error } = await supabase.from('doctors').delete().eq('id', doctorId);
    if (error) throw error;
    return res.status(200).json({ message: 'Doctor rejected and removed' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject doctor' });
  }
};

// GET /api/admin/patients — list all patients
export const getAllPatients = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*, users(name, email, phone)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ patients: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch patients' });
  }
};
