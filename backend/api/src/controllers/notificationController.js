import { supabase } from '../supabase.js';

// POST /api/notifications — send a notification
export const sendNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'userId and message are required' });

    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, message, type: type || 'general' })
      .select()
      .single();
    if (error) throw error;

    return res.status(201).json({ notification: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send notification' });
  }
};

// GET /api/notifications/me — get my notifications
export const getMyNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.userId)
      .order('sent_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    return res.status(200).json({ notifications: data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// PATCH /api/notifications/:id/read — mark as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.userId);
    if (error) throw error;

    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark notification' });
  }
};
