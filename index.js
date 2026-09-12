const http = require('http');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');

// إعدادات خادم الويب للحفاظ على تشغيل الخدمة على Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Sudax Solutions AI Agent is active and running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP Server is listening on port ${PORT}`);
});

// إعداد اتصال Supabase (تأكد من توفر المتغيرات البيئية في إعدادات Render)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// تشغيل وكيل الواتساب
async function startWhatsAppBot() {
    console.log('Initializing Sudax Solutions WhatsApp Agent...');
    
    // استخدام التخزين المحلي المؤقت حالياً كخطوة أولى قبل تفعيل مزامنة Supabase الكاملة
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startWhatsAppBot();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection established successfully!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        
        const sender = m.key.remoteJid;
        const messageText = m.message.conversation || m.message.extendedTextMessage?.text;
        
        console.log(`Received message from ${sender}: ${messageText}`);
        // سيتم ربط محرك Google Gemini هنا للرد التلقائي على العملاء
    });
}

startWhatsAppBot();

