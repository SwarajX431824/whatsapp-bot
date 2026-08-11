require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    // Standard terminal QR
    qrcode.generate(qr, { small: true });

    // Request an 8-character pairing code
    // IMPORTANT: Replace '91XXXXXXXXXX' with your country code + full phone number (e.g., 91 for India)
    try {
        const code = await client.getPairingCode('919823590390');
        console.log('====================================');
        console.log('YOUR WHATSAPP PAIRING CODE IS:', code);
        console.log('====================================');
    } catch (err) {
        console.log('Pairing code error:', err.message);
    }
});

client.on('ready', () => {
    console.log('WhatsApp On-Demand Bot is Online and Ready!');
});

client.initialize();