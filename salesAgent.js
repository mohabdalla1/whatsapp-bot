

cat << 'EOF' > salesAgent.js
const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');

// تهيئة Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// إعداد خادم البريد الإلكتروني Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. صياغة العرض التسويقي عبر Gemini
async function generatePitch(lead) {
    const prompt = `
أنت وكيل مبيعات محترف لشركة Sudax Solutions المتخصصة في حلول الويب والذكاء الاصطناعي.
العميل المستهدف:
- اسم المنشأة: ${lead.name}
- نوع النشاط: ${lead.category}
- المدينة: ${lead.city}

هذه المنشأة لا تملك موقعاً إلكترونياً حالياً. 
اكتب رسالة تسويقية قصيرة، جذابة، واحترافية تعرض عليهم إنشاء موقع إلكتروني مخصص لنشاطهم.
ركز على القيمة الفعالية (زيادة المبيعات، تعزيز الثقة، استقبال طلبات أسرع).
اجعل الرسالة بلهجة سودانية مهذبة أو عربية بسيطة وسريعة الفهم.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (err) {
        console.error("❌ خطأ في توليد الرسالة من Gemini:", err.message);
        return `مرحباً ${lead.name}، نود تقديم عرض مخصص لإنشاء موقع إلكتروني يعزز مبيعاتكم من Sudax Solutions.`;
    }
}

// 2. دالة إرسال البريد الإلكتروني التلقائي
async function sendEmailPitch(toEmail, leadName, pitchContent) {
    if (!toEmail) return;

    const mailOptions = {
        from: '"Sudax Solutions" <' + process.env.EMAIL_USER + '>',
        to: toEmail,
        subject: `عرض خاص لتطوير موقع إلكتروني لـ ${leadName}`,
        text: pitchContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 تم إرسال البريد الإلكتروني بنجاح إلى: ${leadName} (${toEmail})`);
    } catch (error) {
        console.error("❌ خطأ أثناء إرسال البريد الإلكتروني:", error.message);
    }
}

module.exports = { generatePitch, sendEmailPitch };
EOF
    const prompt = `
أنت وكيل مبيعات محترف لشركة Sudax Solutions المتخصصة في حلول الويب والذكاء الاصطناعي.
العميل المستهدف:
- اسم المنشأة: ${lead.name}
- نوع النشاط: ${lead.category}
- المدينة: ${lead.city}

هذه المنشأة لا تملك موقعاً إلكترونياً حالياً. 
اكتب رسالة واتساب قصيرة، جذابة، واحترافية تعرض فيها عليهم إنشاء موقع إلكتروني احترافي مخصص لنشاطهم.
ركز على القيمة الفعالية (مثلاً للمطاعم: منيو إلكتروني وزيادة طلبات، للفنادق: حجز مباشر، للشركات: هوية وتعزيز مصداقية).
اجعل الرد بلهجة سودانية مهذبة أو باللغة العربية البسيطة والواضحة.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (err) {
        console.error("❌ خطأ في توليد الرسالة من Gemini:", err.message);
        return `مرحباً ${lead.name}، نود تقديم عرض مخصص لإنشاء موقع إلكتروني يعزز مبيعاتكم من Sudax Solutions.`;
    }
}

module.exports = { generatePitch };
