const http = require('http');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// إعدادات خادم الويب للحفاظ على تشغيل الخدمة على Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Sudax Solutions AI Agent is active and running!');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});

// إعداد Google Gemini AI (تأكد من إضافة GEMINI_API_KEY في متغيرات البيئة بـ Render)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: "You are an AI sales agent for Sudax Solutions. Answer customer inquiries professionally, concisely, and helpfully."
});

// تشغيل وكيل الواتساب وتكامل الذكاء الاصطناعي
async function startWhatsAppBot() {
    console.log('Starting Sudax Solutions WhatsApp Agent with Gemini...');
    
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
        
        if (!messageText) return;
        console.log(`Received message from ${sender}: ${messageText}`);

        try {
            // توليد الرد عبر نموذج Gemini
            const result = await model.generateContent(messageText);
            const responseText = result.response.text();

            console.log(`AI Reply: ${responseText}`);
            
            // إرسال الرد تلقائياً عبر الواتساب للعميل
            await sock.sendMessage(sender, { text: responseText });
        } catch (error) {
            console.error('Error generating AI response:', error);
            await sock.sendMessage(sender, { text: 'عذراً، واجهنا خطأ مؤقت في معالجة طلبك. سنعاود الاتصال بك قريباً.' });
        }
    });
}

startWhatsAppBot();

