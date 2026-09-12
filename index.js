const http = require('http');
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

// خادم HTTP للحفاظ على اتصال المنفذ وتلبية متطلبات Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Sudax Solutions AI Agent is running successfully!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// تشغيل بوت الواتساب
async function startBot() {
    console.log('Starting Sudax Solutions WhatsApp AI Agent...');
}

startBot();
