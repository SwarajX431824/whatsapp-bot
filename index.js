const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Clear leftover Chromium SingletonLock file before starting
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
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
    ]
};

if (process.platform === 'linux') {
    puppeteerOpts.executablePath = '/usr/bin/google-chrome';
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOpts
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp On-Demand Bot is Online and Ready!');
});

// Primary event listener for both incoming and outgoing self-messages
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