require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize WhatsApp Web Client
const client = new Client({
    authStrategy: new LocalAuth()
});

// Display QR Code in Terminal
client.on('qr', (qr) => {
    console.log('Scan this QR code with WhatsApp on your phone:');
    qrcode.generate(qr, { small: true });
});

// Log when ready
client.on('ready', () => {
    console.log('WhatsApp On-Demand Bot is Online and Ready!');
});

// Listen for messages created by YOU in any chat
client.on('message_create', async (msg) => {
    // Only trigger if you type a message starting with "!reply "
    if (msg.body.startsWith('!reply ')) {
        const userInstruction = msg.body.replace('!reply ', '').trim();

        try {
            const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash', // Or your active model string
    contents: `Rephrase the following instruction into a polite, natural, professional WhatsApp reply. 
CRITICAL RULE: Provide ONLY the final message text to send. Do NOT give multiple options, explanations, intros, quotes, or conversational filler:

"${userInstruction}"`,
});

            await msg.reply(response.text);

        } catch (error) {
            if (error.status === 429) {
                console.log('Rate limit hit. Waiting for cooldown...');
                await msg.reply('⚠️ Sending requests too quickly! Please wait 15-20 seconds before using !reply again.');
            } else {
                console.error('Error generating AI response:', error);
            }
        }
    }
});

client.initialize();