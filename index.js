const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('WhatsApp Bot is Running!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        const phoneNumber = "249117958170";
        await delay(5000);
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n==================================`);
            console.log(`🔑 كود الربط النهائي: ${code}`);
            console.log(`==================================\n`);
        } catch (err) {
            console.error('خطأ في طلب الكود:', err.message);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('\n✅ تم الاتصال بنجاح من Render! البوت جاهز تماماً.');
        } else if (connection === 'close') {
            console.log('جاري إعادة الاتصال...');
            startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            const remoteJid = msg.key.remoteJid;

            if (text) {
                try {
                    const brainUrl = process.env.BRAIN_URL || 'http://127.0.0.1:5000/negotiate';
                    const res = await axios.post(brainUrl, { message: text });
                    await sock.sendMessage(remoteJid, { text: res.data.reply });
                } catch (err) {
                    console.error('خطأ في الذكاء الاصطناعي:', err.message);
                }
            }
        }
    });
}

startBot();
