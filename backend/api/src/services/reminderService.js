import cron from 'node-cron';
import { supabase } from '../supabase.js';
import { sendAppointmentReminderTelegram } from './telegramService.js';
import { sendAppointmentReminderDatabase } from './notificationDatabaseService.js';

/**
 * Parse a time slot like "09:00 AM" or "2:30 PM" into total minutes from midnight.
 */
const parseTimeToMinutes = (timeStr) => {
    try {
        const [time, meridiem] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    } catch (err) {
        console.error(`⚠️ Error parsing time "${timeStr}":`, err.message);
        return -1;
    }
};

const checkAndSendReminders = async () => {
    try {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                id,
                time_slot,
                token_number,
                appointment_date,
                patients (
                    user_id,
                    users ( name )
                ),
                doctors (
                    users ( name )
                )
            `)
            .eq('appointment_date', todayStr)
            .eq('status', 'waiting');

        if (error) {
            console.error('⚠️ Reminder check error:', error.message);
            return;
        }

        if (!appointments || appointments.length === 0) {
            console.log('ℹ️ No pending reminders for today');
            return;
        }

        console.log(`✓ Checking ${appointments.length} appointment(s) for reminders...`);

        for (const appt of appointments) {
            const apptMinutes = parseTimeToMinutes(appt.time_slot);
            if (apptMinutes === -1) continue;

            const minutesDiff = apptMinutes - nowMinutes;

            if (minutesDiff >= 59 && minutesDiff <= 61) {
                const patientName = appt.patients?.users?.name || 'Patient';
                const doctorName = appt.doctors?.users?.name || 'Doctor';
                const patientUserId = appt.patients?.user_id;

                console.log(`⏰ [REMINDER] ${patientName} appointment with Dr. ${doctorName} in 1 hour.`);

                // Try Telegram first, fallback to database
                const telegramResult = await sendAppointmentReminderTelegram(
                    patientName,
                    doctorName,
                    appt.appointment_date,
                    appt.time_slot,
                    appt.token_number
                );

                if (!telegramResult.success && patientUserId) {
                    console.log(`📨 Telegram failed, using database fallback...`);
                    await sendAppointmentReminderDatabase(
                        patientUserId,
                        patientName,
                        doctorName,
                        appt.appointment_date,
                        appt.time_slot,
                        appt.token_number
                    );
                }

                // Try to update reminder_sent flag if column exists
                try {
                    await supabase
                        .from('appointments')
                        .update({ reminder_sent: true })
                        .eq('id', appt.id);
                } catch (err) {
                    console.log('ℹ️ reminder_sent column not yet available (will be added in DB migration)');
                }
            } else {
                console.log(`ℹ️ Appointment ${appt.token_number}: ${minutesDiff} minutes away`);
            }
        }
    } catch (err) {
        console.error('⚠️ Reminder service error:', err.message);
    }
};

export const initReminderService = () => {
    console.log('⏰ Appointment Reminder Service: Active (checks every minute)');
    cron.schedule('* * * * *', checkAndSendReminders, {
        timezone: 'Asia/Kolkata'
    });
};
