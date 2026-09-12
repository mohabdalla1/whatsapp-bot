async function startWhatsAppBot() {
    console.log('Starting Sudax Solutions WhatsApp Agent...');
    
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
}

startWhatsAppBot();

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});
