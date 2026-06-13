import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function getBotUpdates() {
    console.log('🔍 Listening for messages to your bot...');
    console.log('👉 ACTION: Please open your Telegram bot and send it a NEW message (e.g. "Ready") now.');
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1`;

    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.result && parsed.result.length > 0) {
                        const lastMsg = parsed.result[0].message;
                        console.log('\n✅ FOUND MESSAGE!');
                        console.log(`👤 From: ${lastMsg.from.first_name} ${lastMsg.from.last_name || ''}`);
                        console.log(`💬 Message: "${lastMsg.text}"`);
                        console.log(`🎯 CORRECT CHAT ID: ${lastMsg.chat.id}`);
                        resolve(lastMsg.chat.id);
                    } else {
                        console.log('... No new messages found yet.');
                        resolve(null);
                    }
                } catch (e) {
                    console.error('Error parsing response:', e.message);
                    resolve(null);
                }
            });
        });
    });
}

async function start() {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('❌ No bot token found in .env');
        return;
    }
    
    // Poll a few times
    for(let i=0; i<10; i++) {
        const id = await getBotUpdates();
        if (id) {
            console.log('\n🚀 Copy this ID into your .env as TELEGRAM_CHAT_ID!');
            break;
        }
        await new Promise(r => setTimeout(r, 3000));
    }
}

start();
