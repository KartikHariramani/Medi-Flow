# ✅ Telegram Notification Fix & Setup Guide

## Issues Fixed

### 1. 🔐 Telegram Configuration
- **Problem**: Root `.env` had a placeholder Telegram bot token
- **Fixed**: Updated `.env` with the correct working token from `/backend/api/.env`

### 2. 📊 Enhanced Logging
Added detailed logging to track notification flow:
- **telegramService.js**: Configuration warnings and detailed error messages
- **reminderService.js**: Appointment reminder status tracking
- **medicineReminderService.js**: Medicine reminder status tracking  
- **appointmentController.js**: Detailed telegram trigger debugging

## Setup Instructions

### Step 1: Verify Environment Configuration
Check that both `.env` files have the correct token:

```dotenv
TELEGRAM_BOT_TOKEN=8757116190:AAFVwobvtLSeTsQJJdeXf_6qhNY8O-t0ScQ
TELEGRAM_CHAT_ID=1411618730
```

Files to verify:
- ✓ `/smart-hospital/.env` - UPDATED
- ✓ `/smart-hospital/backend/api/.env` - Already correct

### Step 2: Run Telegram Test
```bash
cd backend/api
node test-telegram.js
```

Expected output:
```
✅ All tests completed! Check your Telegram for messages.
```

You should receive 3 test messages on Telegram (Confirmation, Reminder, Medicine).

### Step 3: Run Database Migration
For **Appointment Reminders**, run in Supabase:
```sql
-- Add reminder_sent column to appointments table (if not exists)
ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
```

For **Medicine Reminders**, run in Supabase:
```sql
-- Create medicines table
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  timing TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  reminder_sent_today BOOLEAN DEFAULT FALSE,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 4: Restart Backend Server
```bash
cd backend/api
npm start
```

You should see:
```
⏰ Appointment Reminder Service: Active (checks every minute)
💊 Medicine Reminder Service: Active (checks every minute)
```

## How Notifications Work

### 1️⃣ **Appointment Confirmation**
- Sent immediately when appointment is booked
- Shows patient name, doctor, date, time, queue position, wait time
- Endpoint: `POST /api/appointments`

### 2️⃣ **Appointment Reminder** (1 Hour Before)
- Sent automatically 60 minutes before appointment
- Runs every minute to check for upcoming appointments
- Requires: `reminder_sent` column in appointments table
- Sent only once per appointment

### 3️⃣ **Medicine Reminder** (Scheduled Time)
- Sent at the scheduled medicine time
- Runs every minute to check for medicines
- Shows medicine name, dosage, timing
- Resets daily reminder flag at midnight

## Debugging Tips

### Check Console Logs
Look for these log patterns:

**Successful Confirmation:**
```
🚀 TELEGRAM TRIGGER: Processing notification
📨 Sending confirmation to: [Patient Name]
✅ TELEGRAM SENT SUCCESSFULLY
```

**Appointment Reminder:**
```
⏰ [REMINDER] [Patient] appointment with Dr. [Doctor] in 1 hour.
✅ Telegram reminder sent
```

**Medicine Reminder:**
```
💊 [MEDICINE REMINDER] [Patient] - [Medicine] at [Time]
✅ Telegram medicine reminder sent
```

### If No Messages Received

1. **Check Configuration:**
   ```bash
   # Should show: Bot Token: ✓ SET, Chat ID: ✓ SET
   node test-telegram.js
   ```

2. **Check Database:**
   - Verify patient & doctor records exist
   - Verify medicine records have correct `timing` format (e.g., "09:00 AM")
   - Check `reminder_sent` and `reminder_sent_today` flags

3. **Check Logs:**
   - Look for `⚠️ Telegram Configuration Missing`
   - Look for `❌ TELEGRAM FAILED`
   - Check for network errors

4. **Verify Telegram Bot:**
   - Ensure bot token is valid
   - Ensure chat ID is correct (numeric)
   - Try sending message manually via BotFather

## Test Scenarios

### Test Appointment Confirmation
```bash
# Create appointment via API
POST /api/appointments
{
  "doctorId": "doctor-uuid",
  "appointmentDate": "2026-04-08",
  "timeSlot": "02:00 PM",
  "priority": "normal",
  "symptoms": "Headache"
}

# Result: Telegram message should arrive within seconds
```

### Test Appointment Reminder
```sql
-- Test: Create appointment for exactly 1 hour from now
INSERT INTO appointments (
  patient_id, doctor_id, appointment_date, time_slot, 
  token_number, status, reminder_sent
) VALUES (
  'patient-uuid',
  'doctor-uuid',
  CURRENT_DATE,
  '04:00 PM',  -- Set to 1 hour from current time
  123,
  'waiting',
  false
);

-- Result: Reminder should be sent at the 1-hour mark
```

### Test Medicine Reminder
```sql
-- Test: Create medicine for exactly now
INSERT INTO medicines (
  patient_id, doctor_id, medicine_name, dosage, timing, frequency
) VALUES (
  'patient-uuid',
  'doctor-uuid',
  'Paracetamol',
  '500mg',
  '03:05 PM',  -- Set to current time + 1-2 minutes
  'daily'
);

-- Result: Medicine reminder should be sent at scheduled time
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Telegram Configuration Missing" | Check .env files have TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID |
| Test passes but no telegram message | Check if bot token is expired or invalid |
| Only confirmation works, no reminder | Ensure `reminder_sent` column exists in appointments table |
| Medicine reminder always resets | Ensure `reminder_sent_today` flag is correctly managed |
| Old token still being used | Verify .env was reloaded - restart server after updating |

## File Changes Summary

### Modified Files:
1. ✅ `/supabase/schema.sql` - Added `reminder_sent`, `medicines` table
2. ✅ `/backend/api/src/index.js` - Import & init reminder services
3. ✅ `/backend/api/src/services/reminderService.js` - Enhanced logging
4. ✅ `/backend/api/src/services/medicineReminderService.js` - Created & enhanced
5. ✅ `/backend/api/src/services/telegramService.js` - Enhanced error logging
6. ✅ `/backend/api/src/controllers/appointmentController.js` - Added debug logs
7. ✅ `/backend/api/test-telegram.js` - Updated test script
8. ✅ `/.env` - Fixed Telegram token

### New Files:
- 🆕 `/backend/api/src/services/medicineReminderService.js` - Medicine reminder logic

---

**Last Updated**: April 8, 2026
**Status**: ✅ Ready for Testing
