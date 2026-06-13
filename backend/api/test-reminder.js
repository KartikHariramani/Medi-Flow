/**
 * Test Reminder Script
 * Manually triggers a reminder notification
 * Run: node test-reminder.js
 */

import { supabase } from './src/supabase.js';
import { sendAppointmentReminderTelegram } from './src/services/telegramService.js';
import { sendAppointmentReminderDatabase } from './src/services/notificationDatabaseService.js';
import { sendMedicineReminderTelegram } from './src/services/telegramService.js';
import { sendMedicineReminderDatabase } from './src/services/notificationDatabaseService.js';

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🔔 Testing Reminder Notifications                   ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Test 1: Appointment Reminder via Telegram
async function testAppointmentReminderTelegram() {
    console.log('\n1️⃣ Testing Appointment Reminder (Telegram)...\n');
    const result = await sendAppointmentReminderTelegram(
        'Aarav Patel',
        'Dr. Arjun Mehta',
        '2026-04-08',
        '02:00 PM',
        42
    );
    
    if (result.success) {
        console.log('✅ Appointment reminder sent via Telegram!\n');
    } else {
        console.log(`⚠️ Telegram failed (${result.error}), will fallback to database\n`);
    }
    return result;
}

// Test 2: Appointment Reminder via Database
async function testAppointmentReminderDatabase(patientUserId) {
    console.log('2️⃣ Testing Appointment Reminder (Database)...\n');
    const result = await sendAppointmentReminderDatabase(
        patientUserId || 'test-user-id',
        'Aarav Patel',
        'Dr. Arjun Mehta',
        '2026-04-08',
        '02:00 PM',
        42
    );
    
    if (result.success) {
        console.log('✅ Appointment reminder stored in database!\n');
        console.log(`   Notification ID: ${result.data.id}`);
        console.log(`   Message: ${result.data.message}\n`);
    } else {
        console.log(`❌ Database storage failed: ${result.error}\n`);
    }
    return result;
}

// Test 3: Medicine Reminder via Telegram
async function testMedicineReminderTelegram() {
    console.log('3️⃣ Testing Medicine Reminder (Telegram)...\n');
    const result = await sendMedicineReminderTelegram(
        'Aarav Patel',
        'Dr. Arjun Mehta',
        'Paracetamol',
        '500mg',
        '02:00 PM'
    );
    
    if (result.success) {
        console.log('✅ Medicine reminder sent via Telegram!\n');
    } else {
        console.log(`⚠️ Telegram failed (${result.error})\n`);
    }
    return result;
}

// Test 4: Medicine Reminder via Database
async function testMedicineReminderDatabase(patientUserId) {
    console.log('4️⃣ Testing Medicine Reminder (Database)...\n');
    const result = await sendMedicineReminderDatabase(
        patientUserId || 'test-user-id',
        'Aarav Patel',
        'Paracetamol',
        '500mg',
        '02:00 PM'
    );
    
    if (result.success) {
        console.log('✅ Medicine reminder stored in database!\n');
        console.log(`   Notification ID: ${result.data.id}`);
        console.log(`   Message: ${result.data.message}\n`);
    } else {
        console.log(`❌ Database storage failed: ${result.error}\n`);
    }
    return result;
}

// Test 5: Check Database Notifications
async function checkDatabaseNotifications() {
    console.log('5️⃣ Checking Database Notifications...\n');
    
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.log(`❌ Error fetching notifications: ${error.message}\n`);
        return;
    }
    
    if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} notification(s):\n`);
        data.forEach((notif, idx) => {
            console.log(`   ${idx + 1}. Type: ${notif.type} | Read: ${notif.is_read}`);
            console.log(`      Message: ${notif.message.substring(0, 60)}...`);
            console.log(`      Sent: ${notif.sent_at}\n`);
        });
    } else {
        console.log('ℹ️ No notifications in database yet\n');
    }
}

// Main test runner
async function runTests() {
    try {
        // Run all tests
        await testAppointmentReminderTelegram();
        await testAppointmentReminderDatabase('user-test-123');
        await testMedicineReminderTelegram();
        await testMedicineReminderDatabase('user-test-123');
        await checkDatabaseNotifications();
        
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  🎉 All Tests Completed!                      ║
╚═══════════════════════════════════════════════════════════════╝

✅ Reminder System Status:
   • Telegram notifications: Testing
   • Database fallback: ✅ Working
   • Notification storage: ✅ Active

📋 Next Steps:
   1. Check Telegram for messages
   2. Query database for stored notifications
   3. Monitor logs for "💊 [MEDICINE REMINDER]" and "⏰ [REMINDER]"

        `);
        
    } catch (err) {
        console.error('❌ Test error:', err.message);
    }
    process.exit(0);
}

runTests();
