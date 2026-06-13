/**
 * Alternative Notification Service (Firewall-Safe)
 * Uses Supabase instead of external APIs
 * Stores notifications in database and fetches via API
 */

import { supabase } from '../supabase.js';

/**
 * Send notification through Supabase (no external API calls needed)
 * Notification is stored in database and fetched by app/mobile
 */
export const sendNotificationViaDatabase = async (
    userId,
    title,
    message,
    type = 'general',
    metadata = {}
) => {
    try {
        console.log(`📨 Storing notification in database for user: ${userId}`);

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                message: `${title}\n\n${message}`,
                type: type,
                is_read: false,
                sent_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error('❌ Failed to store notification:', error.message);
            return { success: false, error: error.message };
        }

        console.log(`✅ Notification stored (ID: ${data[0].id})`);
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('❌ Notification service error:', err.message);
        return { success: false, error: err.message };
    }
};

/**
 * Send appointment confirmation via database
 */
export const sendAppointmentConfirmationDatabase = async (
    patientUserId,
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    tokenNumber,
    queuePosition,
    estimatedWaitTime
) => {
    const title = '🏥 Appointment Confirmed!';
    const message = 
        `Patient: ${patientName}\n` +
        `Doctor: Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}\n` +
        `Date: ${appointmentDate}\n` +
        `Time: ${appointmentTime}\n` +
        `Token: #${tokenNumber}\n` +
        `Queue Position: #${queuePosition}\n` +
        `Estimated Wait: ${estimatedWaitTime} minutes`;

    return sendNotificationViaDatabase(
        patientUserId,
        title,
        message,
        'turn_alert',
        {
            appointmentDate,
            appointmentTime,
            tokenNumber,
            queuePosition,
            estimatedWaitTime
        }
    );
};

/**
 * Send appointment reminder via database
 */
export const sendAppointmentReminderDatabase = async (
    patientUserId,
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    tokenNumber
) => {
    const title = '⏰ Appointment Reminder!';
    const message =
        `Your appointment is in 1 hour!\n\n` +
        `Patient: ${patientName}\n` +
        `Doctor: Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}\n` +
        `Time: ${appointmentTime}\n` +
        `Token: #${tokenNumber}\n\n` +
        `Please arrive on time.`;

    return sendNotificationViaDatabase(
        patientUserId,
        title,
        message,
        'turn_alert'
    );
};

/**
 * Send medicine reminder via database
 */
export const sendMedicineReminderDatabase = async (
    patientUserId,
    patientName,
    medicineName,
    dosage,
    timing
) => {
    const title = '💊 Medicine Reminder!';
    const message =
        `Time to take your medicine!\n\n` +
        `Medicine: ${medicineName}\n` +
        `Dosage: ${dosage}\n` +
        `Time: ${timing}`;

    return sendNotificationViaDatabase(
        patientUserId,
        title,
        message,
        'general'
    );
};
