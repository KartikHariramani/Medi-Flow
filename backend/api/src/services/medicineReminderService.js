import cron from 'node-cron';
import { supabase } from '../supabase.js';
import { sendMedicineReminderTelegram } from './telegramService.js';
import { sendMedicineReminderDatabase } from './notificationDatabaseService.js';

const parseTimeToMinutes = (timeStr) => {
    try {
        const [time, meridiem] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    } catch (err) {
        console.error(`⚠️ Error parsing medicine time "${timeStr}":`, err.message);
        return -1;
    }
};

const resetDailyReminderFlags = async () => {
    try {
        await supabase.from('medicines').update({ reminder_sent_today: false }).eq('is_active', true);
        console.log('🔄 Daily medicine reminder flags reset');
    } catch (err) {
        console.error('⚠️ Reset medicine flags error:', err.message);
    }
};

const checkAndSendMedicineReminders = async () => {
    try {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const { data: medicines } = await supabase
            .from('medicines')
            .select(`id, medicine_name, dosage, timing, start_date, end_date, reminder_sent_today, patient_id, patients(user_id, users(name)), doctors(users(name))`)
            .eq('is_active', true)
            .eq('reminder_sent_today', false)
            .lte('start_date', todayStr);

        if (!medicines || medicines.length === 0) return;

        for (const med of medicines) {
            if (med.end_date && med.end_date < todayStr) continue;
            const medMinutes = parseTimeToMinutes(med.timing);
            if (medMinutes === -1) continue;
            const minutesDiff = medMinutes - nowMinutes;

            if (minutesDiff >= -1 && minutesDiff <= 2) {
                const patientName = med.patients?.users?.name || 'Patient';
                const doctorName = med.doctors?.users?.name || 'Doctor';
                const patientUserId = med.patients?.user_id;

                console.log(`💊 [MEDICINE REMINDER] ${patientName} - ${med.medicine_name}`);

                const telegramResult = await sendMedicineReminderTelegram(patientName, doctorName, med.medicine_name, med.dosage, med.timing);

                if (!telegramResult.success && patientUserId) {
                    console.log(`📨 Telegram failed, using  database fallback...`);
                    await sendMedicineReminderDatabase(patientUserId, patientName, med.medicine_name, med.dosage, med.timing);
                }

                await supabase.from('medicines').update({ reminder_sent_today: true, last_reminder_sent_at: new Date().toISOString() }).eq('id', med.id);
            }
        }
    } catch (err) {
        console.error('⚠️ Medicine reminder error:', err.message);
    }
};

export const initMedicineReminderService = () => {
    console.log('💊 Medicine Reminder Service: Active');
    cron.schedule('* * * * *', checkAndSendMedicineReminders, { timezone: 'Asia/Kolkata' });
    cron.schedule('0 0 * * *', resetDailyReminderFlags, { timezone: 'Asia/Kolkata' });
};
