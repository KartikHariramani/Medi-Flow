import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Log configuration status on load
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Telegram Configuration Warning:');
    console.warn(`   BOT_TOKEN present: ${!!TELEGRAM_BOT_TOKEN}`);
    console.warn(`   CHAT_ID present: ${!!TELEGRAM_CHAT_ID}`);
}

/**
 * Send a message to the fixed Telegram chat (test device).
 */
const sendTelegramMessage = (text) => {
    return new Promise((resolve) => {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error('⚠️ Telegram Configuration Missing:');
            console.error(`   BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING'}`);
            console.error(`   CHAT_ID: ${TELEGRAM_CHAT_ID ? 'SET' : 'MISSING'}`);
            return resolve({ success: false, error: 'Config Missing' });
        }

        console.log(`📡 Sending Telegram to ${TELEGRAM_CHAT_ID} via Bot...`);
        
        const body = JSON.stringify({
            chat_id: String(TELEGRAM_CHAT_ID),
            text,
            parse_mode: 'HTML',
        });

        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            agent: httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.ok) {
                        resolve({ success: true });
                    } else {
                        console.error('Telegram API error:', parsed.description);
                        resolve({ success: false, error: parsed.description });
                    }
                } catch (e) {
                    console.error('Failed to parse Telegram response. Status:', res.statusCode);
                    console.error('Response preview:', data.substring(0, 200));
                    resolve({ success: false, error: `HTTP ${res.statusCode}: ${e.message}` });
                }
            });
        });

        req.on('error', (err) => {
            console.error('Telegram request error:', err.message);
            resolve({ success: false, error: err.message });
        });

        req.write(body);
        req.end();
    });
};

/**
 * Format slotDate "2026-10-12" → "12 October 2026"
 */
const formatDate = (slotDate) => {
    if (!slotDate || slotDate === 'Today' || slotDate === 'Live Join') return 'Today';
    
    try {
        // Handle YYYY-MM-DD (Standard ISO)
        if (typeof slotDate === 'string' && slotDate.includes('-')) {
            const date = new Date(slotDate);
            if (isNaN(date.getTime())) return 'Today';
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        // Handle DD_MM_YYYY (User Original Snippet Format)
        if (typeof slotDate === 'string' && slotDate.includes('_')) {
            const [day, month, year] = slotDate.split('_');
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
            ];
            return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
        }
        return slotDate;
    } catch {
        return 'Today';
    }
};

/**
 * Send appointment confirmation after booking.
 */
export const sendAppointmentConfirmationTelegram = async (
    patientName,
    doctorName,
    slotDate,
    slotTime,
    tokenNo,
    queuePosition,
    waitTime
) => {
    console.log(`🔔 Booking for ${patientName} with Dr. ${doctorName}...`);
    const dateStr = formatDate(slotDate);
    const message =
        `🏥 <b>Appointment Confirmed!</b>\n\n` +
        `👤 Patient: <b>${patientName}</b>\n` +
        `👨‍⚕️ Doctor: <b>Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}</b>\n` +
        `📅 Date: <b>${dateStr}</b>\n` +
        `⏰ Time: <b>${slotTime}</b>\n` +
        `🎫 Token No: <b>${tokenNo}</b>\n` +
        `🔢 Queue Position: <b>#${queuePosition}</b>\n` +
        `⏳ Est. Waiting: <b>${waitTime} mins</b>\n\n` +
        `✅ Your appointment is confirmed. Please arrive 10 minutes early.`;

    return await sendTelegramMessage(message);
};

/**
 * Send Medicine Reminder.
 */
export const sendMedicineReminderTelegram = async (
    patientName,
    doctorName,
    medicineName, // Used as title if string, ignored if medicines is array
    dosage,       // Used as default if medicines is string
    time,         // Used as default if medicines is string
) => {
    let medListHtml = '';
    
    if (Array.isArray(dosage)) {
        // Handle tabular medicine array
        medListHtml = dosage.map(m => 
            `• <b>${m.name}</b>\n  └ ${m.dosage} — <i>${m.timing}</i>`
        ).join('\n\n');
    } else {
        // Fallback for single medicine string
        medListHtml = `• <b>${medicineName}</b>\n  └ ${dosage} — <i>${time}</i>`;
    }

    const message =
        `💊 <b>Medicine Consultation Summary</b>\n\n` +
        `👤 Patient: <b>${patientName}</b>\n` +
        `👨‍⚕️ Prescribed by: <b>Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}</b>\n\n` +
        `${medListHtml}\n\n` +
        `🔔 <b>Instructions:</b> Please follow the dosage carefully. You can view full details in your MediFlow digital portal.`;

    const result = await sendTelegramMessage(message);
    if (result.success) {
        console.log(`✅ Telegram medicine reminder sent for ${patientName}`);
    } else {
        console.log('⚠️ Telegram medicine reminder failed:', result.error);
    }
    return result;
};

/**
 * Send Appointment Reminder (1 Hour Left).
 */
export const sendAppointmentReminderTelegram = async (
    patientName,
    doctorName,
    slotDate,
    slotTime,
    tokenNo
) => {
    console.log(`⏰ Sending 1-hour reminder to ${patientName} for Dr. ${doctorName}...`);
    const dateStr = formatDate(slotDate);
    const message =
        `⚠️ <b>Appointment Reminder!</b>\n\n` +
        `👤 Patient: <b>${patientName}</b>\n` +
        `👨‍⚕️ Doctor: <b>Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}</b>\n` +
        `📅 Date: <b>${dateStr}</b>\n` +
        `⏰ Time: <b>${slotTime}</b>\n` +
        `🎫 Token No: <b>${tokenNo}</b>\n\n` +
        `⏳ Your appointment is in exactly <b>1 Hour</b>. Please ensure you reach the clinic on time.`;

    const result = await sendTelegramMessage(message);
    if (result.success) {
        console.log(`✅ Telegram reminder sent for ${patientName}`);
    } else {
        console.log('⚠️ Telegram reminder failed:', result.error);
    }
    return result;
};


