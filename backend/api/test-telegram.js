import { sendAppointmentConfirmationTelegram, sendMedicineReminderTelegram, sendAppointmentReminderTelegram } from './src/services/telegramService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testTelegramIntegration() {
    console.log('\n🧪 MediFlow Telegram Integration Test');
    console.log('=====================================\n');

    // Check configuration
    console.log('1️⃣ Checking Configuration...');
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasChatId = !!process.env.TELEGRAM_CHAT_ID;
    
    console.log(`   Bot Token: ${hasToken ? '✓ SET' : '✗ MISSING'}`);
    console.log(`   Chat ID: ${hasChatId ? '✓ SET' : '✗ MISSING'}\n`);
    
    if (!hasToken || !hasChatId) {
        console.error('❌ Configuration incomplete. Cannot proceed with tests.\n');
        process.exit(1);
    }

    // Test 1: Appointment Confirmation
    console.log('2️⃣ Testing Appointment Confirmation...');
    try {
        const result1 = await sendAppointmentConfirmationTelegram(
            'Aarav Patel',
            'Dr. Arjun Mehta',
            '2026-10-12',
            '10:30 AM',
            42,
            5,
            20
        );
        
        if (result1.success) {
            console.log(`   ✅ Appointment Confirmation SENT\n`);
        } else {
            console.log(`   ❌ Failed: ${result1.error}\n`);
        }
    } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
    }

    // Test 2: Appointment Reminder
    console.log('3️⃣ Testing Appointment Reminder...');
    try {
        const result2 = await sendAppointmentReminderTelegram(
            'Aarav Patel',
            'Dr. Arjun Mehta',
            '2026-10-12',
            '10:30 AM',
            42
        );
        
        if (result2.success) {
            console.log(`   ✅ Appointment Reminder SENT\n`);
        } else {
            console.log(`   ❌ Failed: ${result2.error}\n`);
        }
    } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
    }

    // Test 3: Medicine Reminder
    console.log('4️⃣ Testing Medicine Reminder...');
    try {
        const result3 = await sendMedicineReminderTelegram(
            'Aarav Patel',
            'Dr. Arjun Mehta',
            'Paracetamol',
            '500mg',
            '09:00 AM'
        );
        
        if (result3.success) {
            console.log(`   ✅ Medicine Reminder SENT\n`);
        } else {
            console.log(`   ❌ Failed: ${result3.error}\n`);
        }
    } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
    }

    console.log('✅ All tests completed! Check your Telegram for messages.\n');
}

testTelegramIntegration();


