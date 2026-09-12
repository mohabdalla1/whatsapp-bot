const cron = require('node-cron');
const fs = require('fs');
const path = require('./scraper'); // تأكد أن ملف السكريبت الخاص بالمسح يسمى scraper.js أو حسب اسم ملفك
const { generatePitch, sendEmailPitch } = require('./salesAgent');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// تفعيل الاستماع للرسائل الواردة على الواتساب
sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    
    // تجاهل الرسائل التي ليس لها محتوى أو الرسائل المرسلة من حسابنا الشخصي
    if (!msg.message || msg.key.fromMe) return;

    const senderJid = msg.key.remoteJid;
    const userMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!userMessage) return;

    console.log(`📩 رسالة جديدة واردة من ${senderJid}: ${userMessage}`);

    try {
        // توجيه رسالة العميل إلى نموذج Gemini لتوليد رد مبيعات دقيق
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
أنت وكيل مبيعات ومستشار تقني لشركة Sudax Solutions. العميل يراسلنا على الواتساب بشأن خدمات إنشاء المواقع الإلكترونية والحلول الرقمية.
رسالة العميل: "${userMessage}"
أجب بأسلوب احترافي وودود، وضح فوائد امتلاك موقع إلكتروني، وادعُه بلطف لتأكيد بدء التعاون أو حجز موعد.
            `
        });

        const replyText = response.text;

        // إرسال الرد التلقائي للعميل عبر الواتساب
        await sock.sendMessage(senderJid, { text: replyText });
        console.log(`📤 تم الرد تلقائياً على العميل بنجاح.`);

    } catch (err) {
        console.error("❌ خطأ أثناء معالجة الرد الذكي للرسالة الواردة:", err.message);
    }
});
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
// دالة مساعدة لحفظ العملاء الذين تم التواصل معهم لمنع التكرار
const LEEDS_FILE = './leads.json';
function loadSentLeads() {
    if (fs.existsSync(LEEDS_FILE)) {
        return JSON.parse(fs.readFileSync(LEEDS_FILE, 'utf8'));
    }
    return [];
}

function saveLead(lead) {
    const leads = loadSentLeads();
    leads.push(lead);
    fs.writeFileSync(LEEDS_FILE, JSON.stringify(leads, null, 2));
}

// جدولة مهام البحث والإرسال التلقائي (تعمل يومياً مثلاً الساعة 9 صباحاً أو حسب الحاجة)
cron.schedule('0 9 * * *', async () => {
    console.log('⏰ بدأ تشغيل جدول مسح السوق التلقائي...');
    try {
        // استدعاء دالة البحث عن الشركات التي لا تملك موقعاً (مثال: في الخرطوم)
        // تأكد من توافق الأسماء مع الدوال الموجودة في ملف scraper.js لديك
        const discoveredLeads = await findLeadsWithoutWebsite("Khartoum", "amenity=restaurant");
        const sentLeads = loadSentLeads();

        for (const lead of discoveredLeads) {
            // التحقق مما إذا تم التواصل مع هذا العميل مسبقاً
            const alreadyContacted = sentLeads.some(l => l.name === lead.name);
            if (alreadyContacted) continue;

            console.log(`🎯 تم العثور على عميل محتمل جديد: ${lead.name}`);
            
            // إذا توفر إيميل للعميل، نقوم بإرسال عرض السعر تلقائياً
            if (lead.email) {
                const pitch = await generatePitch(lead.name);
                await sendEmailPitch(lead.email, pitch);
                console.log(`📧 تم إرسال الإيميل التسويقي إلى: ${lead.email}`);
            }

            // حفظ العميل في القائمة لعدم تكراره
            saveLead(lead);
            
            // توقف بسيط بين كل إرسال لضمان الحماية
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } catch (error) {
        console.error('❌ خطأ في الجدولة التلقائية:', error.message);
    }
});
