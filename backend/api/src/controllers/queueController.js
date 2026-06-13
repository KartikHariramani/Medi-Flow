import { supabase } from '../supabase.js';

export const getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId parameter is required' });
    }

    const { data: queueData, error } = await supabase
      .from('queue')
      .select(`
        id,
        position,
        updated_at,
        appointments (
          id, token_number, priority, estimated_wait_time,
          patients (
            id, has_diabetes, other_conditions,
            users (name)
          )
        )
      `)
      .eq('doctor_id', doctorId)
      .order('position', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ queue: queueData });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return res.status(500).json({ error: 'Failed to fetch queue data' });
  }
};
