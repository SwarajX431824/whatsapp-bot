const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Clear leftover Chromium SingletonLock file from previous container runs
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
    // Standard terminal QR
    qrcode.generate(qr, { small: true });

    // Web-renderable QR link (click this in your logs to view in browser)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    console.log('\n====================================');
    console.log('OPEN THIS LINK IN BROWSER TO SCAN QR:');
    console.log(qrImageUrl);
    console.log('====================================\n');
});

// AI Response Listener
client.on('message_create', async (msg) => {
    if (msg.body.startsWith('!reply')) {
        const prompt = msg.body.replace('!reply', '').trim();
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
            });
            await msg.reply(response.text);
        } catch (err) {
            console.error('Error generating AI response:', err.message);
        }
    }
});

client.initialize();