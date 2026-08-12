// Primary event listener
client.on('message_create', async (msg) => {
    // 1. Ignore status updates
    if (msg.from === 'status@broadcast' || msg.to === 'status@broadcast') {
        return;
    }

    // 2. Ignore empty non-text messages (media, reactions, etc.)
    if (!msg.body || msg.body.trim() === '') {
        return;
    }

    // 3. Log valid text messages
    console.log(`[CHAT LOG] Message detected: "${msg.body}"`);

    // 4. Process commands starting with !reply
    if (msg.body.startsWith('!reply')) {
        console.log(`[ACTION] Executing command with prompt: "${msg.body}"`);
        const prompt = msg.body.replace('!reply', '').trim();
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Write ONLY the raw direct response message text to send back. Do NOT include preambles, options, or extra text. Instruction: ${prompt}`,
            });
            await msg.reply(response.text);
            console.log(`[SUCCESS] Sent AI response.`);
        } catch (err) {
            console.error('[ERROR] Gemini API failed:', err.message);
        }
    }
});