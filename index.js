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

client.on('qr', (qr) => {
    // Render a compact QR code in terminal
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp On-Demand Bot is Online and Ready!');
});

// AI Response Logic
client.on('message_create', async (msg) => {
    if (msg.body.startsWith('!reply')) {
        const prompt = msg.body.replace('!reply', '').trim();
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
            });
            await msg.reply(response.text);
        } catch (err) {
            console.error('Error generating AI response:', err.message);
        }
    }
});

client.initialize();

client.on('ready', () => {
    console.log('WhatsApp On-Demand Bot is Online and Ready!');
});

client.initialize();