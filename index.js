const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Remove leftover Chromium SingletonLock file before initializing
const lockFilePath = path.join(__dirname, '.wwebjs_auth', 'session', 'SingletonLock');
if (fs.existsSync(lockFilePath)) {
    try {
        fs.unlinkSync(lockFilePath);
        console.log('Removed stale Chromium SingletonLock file.');
    } catch (err) {
        console.error('Failed to remove lock file:', err.message);
    }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const puppeteerOpts = {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

if (process.platform === 'linux') {
    puppeteerOpts.executablePath = '/usr/bin/google-chrome';
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOpts
});

client.on('qr', (qr) => {
    // Terminal rendering
    qrcode.generate(qr, { small: true });

    // Web-renderable QR link
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    console.log('\n====================================');
    console.log('CLICK THIS LINK IN YOUR BROWSER TO SCAN QR:');
    console.log(qrImageUrl);
    console.log('====================================\n');
});

client.on('ready', () => {
    console.log('WhatsApp On-Demand Bot is Online and Ready!');
});

// AI Response Listener
client.on('message_create', async (msg) => {
    if (msg.body.startsWith('!reply')) {
        const prompt = msg.body.replace('!reply', '').trim();
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Write ONLY the raw direct response message text to send back. Do NOT include preambles, options, or extra text. Instruction: ${prompt}`,
            });
            await msg.reply(response.text);
        } catch (err) {
            console.error('Error generating AI response:', err.message);
        }
    }
});

client.initialize();