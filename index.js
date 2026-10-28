const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Sarah AI WhatsApp sedang berjalan online 24/7!');
});

app.listen(PORT, () => {
    console.log(`Server web aktif di port ${PORT}`);
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY belum diatur. Silakan set environment variable sebelum menjalankan bot.');
    console.error('Contoh: $env:GEMINI_API_KEY=""');
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

client.on('qr', (qr) => {
    console.log('Scan QR Code ini menggunakan WhatsApp di HP kamu:');
    qrcode.generate(qr, { small: true });
});

client.on('auth_failure', (msg) => {
    console.error('Gagal login WhatsApp:', msg);
});

client.on('ready', () => {
    console.log('Bot Sarah siap dan sudah terhubung ke WhatsApp!');
});

client.on('message', async (msg) => {
    if (msg.from.endsWith('@g.us') || msg.isStatus || !msg.body || !msg.body.trim()) return;

    console.log(`Pesan masuk dari ${msg.from}: ${msg.body}`);

    if (!ai) {
        await msg.reply('Bot belum bisa dipakai karena API key Gemini belum diatur. Hubungi admin untuk mengatur GEMINI_API_KEY.');
        return;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Kamu adalah Sarah, asisten AI yang ramah, asyik, dan cerdas. Jawab pesan ini dengan santai: ${msg.body}`,
        });

        const replyText = response?.text || 'Maaf, Sarah lagi sariawan jadi belum bisa jawab.';
        await msg.reply(replyText);
    } catch (error) {
        console.error('Error saat menghubungi Gemini AI:', error);
        await msg.reply('Aduh, otak Sarah lagi agak macet nih. Coba tanya lagi nanti ya!');
    }
});

client.initialize();