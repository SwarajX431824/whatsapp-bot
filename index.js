const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. Clear leftover Chromium SingletonLock file before starting
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

// 3. Configure Puppeteer for Railway Linux Container
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

// 4. DEFINE CLIENT HERE BEFORE CALLING client.on()
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOpts
});

// 5. QR Code Generator & Web Link Fallback
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    console.log('\n==================================================');
    console.log('IF TERMINAL QR IS DISTORTED, OPEN THIS LINK TO SCAN:');
    console.log(qrImageUrl);
    console.log('==================================================\n');
});

// 6. Readiness Confirmation
client.on('ready', () => {
    console.log('[ONLINE] WhatsApp On-Demand Bot is Online and Ready!');
});

// 7. Message Event Listener (Only triggers on valid !reply commands)
client.on('message_create', async (msg) => {
    // Ignore status broadcast updates
    if (msg.from === 'status@broadcast' || msg.to === 'status@broadcast') {
        return;
    }

    // Ignore empty non-text messages
    if (!msg.body || msg.body.trim() === '') {
        return;
    }

    // Process commands starting with !reply
    if (msg.body.startsWith('!reply')) {
        console.log(`[ACTION] Executing command: "${msg.body}"`);
        const prompt = msg.body.replace('!reply', '').trim();

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Write ONLY the raw direct response message text to send back. Do NOT include preambles, options, or extra text. Instruction: ${prompt}`,
            });

            console.log(`[SUCCESS] Gemini output: "${response.text}"`);
            await msg.reply(response.text);
        } catch (err) {
            console.error('[ERROR] Gemini API failed:', err.message);
        }
    }
});

// 8. Initialize Client
client.initialize();