const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. Clear leftover Chromium SingletonLock file before starting (Prevents Railway crash loops)
const lockFilePath = path.join(__dirname, '.wwebjs_auth', 'session', 'SingletonLock');
if (fs.existsSync(lockFilePath)) {
    try {
        fs.unlinkSync(lockFilePath);
        console.log('[SYSTEM] Removed stale Chromium SingletonLock file.');
    } catch (err) {
        console.error('[SYSTEM] Failed to remove lock file:', err.message);
    }
}

// 2. Initialize Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 3. Configure Puppeteer for Cloud Linux Containers
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

// 4. Render QR Code via Terminal & Provide Direct Web Link
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    console.log('\n==================================================');
    console.log('IF TERMINAL QR IS DISTORTED, OPEN THIS LINK TO SCAN:');
    console.log(qrImageUrl);
    console.log('==================================================\n');
});

// 5. Readiness Confirmation
client.on('ready', () => {
    console.log('[ONLINE] WhatsApp On-Demand Bot is Online and Ready!');
});

// 6. Listen ONLY for Outgoing Self-Messages & Chat Commands starting with !reply
client.on('message_create', async (msg) => {
    // Ignore status broadcast updates entirely
    if (msg.from === 'status@broadcast' || msg.to === 'status@broadcast') {
        return;
    }

    // Process commands starting with !reply
    if (msg.body.startsWith('!reply')) {
        console.log(`[ACTION] Command detected: "${msg.body}"`);
        const prompt = msg.body.replace('!reply', '').trim();

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Write ONLY the raw direct response message text to send back. Do NOT include preambles, options, or extra text. Instruction: ${prompt}`,
            });

            console.log(`[SUCCESS] Gemini generated: "${response.text}"`);

            // Post AI generated response directly into chat
            await msg.reply(response.text);
        } catch (err) {
            console.error('[ERROR] Gemini API execution error:', err.message);
        }
    }
});

client.initialize();