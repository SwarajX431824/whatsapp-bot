const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. Clear leftover Chromium SingletonLock file on startup
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

// 3. Cloud Container Flags for Puppeteer
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

// 4. Render QR Code & Web Browser Link
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    console.log('\n==================================================');
    console.log('VIEW CLEAN QR CODE IN BROWSER TAB:');
    console.log(qrImageUrl);
    console.log('==================================================\n');
});

// 5. Readiness Listener
client.on('ready', () => {
    console.log('[ONLINE] WhatsApp On-Demand Bot is Online and Ready!');
});

// 6. Primary Event Listener (Intercepts both outgoing self-texts and incoming chats)
client.on('message_create', async (msg) => {
    // Skip status broadcast updates completely
    if (msg.from === 'status@broadcast' || msg.to === 'status@broadcast') {
        return;
    }

    // Print all chat text to Railway terminal so you can verify socket activity
    console.log(`[CHAT LOG] Message detected: "${msg.body}"`);

    // Execute only when triggered with !reply
    if (msg.body.startsWith('!reply')) {
        console.log(`[ACTION] Executing !reply command with prompt: "${msg.body}"`);
        const prompt = msg.body.replace('!reply', '').trim();

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Write ONLY the raw direct response message text to send back. Do NOT include preambles, options, or extra text. Instruction: ${prompt}`,
            });

            console.log(`[SUCCESS] Gemini output: "${response.text}"`);
            await msg.reply(response.text);
        } catch (err) {
            console.error('[ERROR] Gemini API execution failed:', err.message);
        }
    }
});

client.initialize();