/**
 * VPS Bot Worker Template
 * 
 * This script runs on your VPS and receives bot deployment instructions
 * from your main VoidHaven website. It spawns and manages Discord bots.
 * 
 * Setup Instructions:
 * 1. Copy this file to your VPS
 * 2. Run: npm init -y && npm install express discord.js dotenv
 * 3. Create .env file with VPS_AUTH_TOKEN (must match your website's .env)
 * 4. Run: node vps-worker.js
 * 5. Your website will now be able to deploy bots to this VPS!
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Client, GatewayIntentBits } = require('discord.js');

dotenv.config();

const app = express();
const VPS_PORT = process.env.VPS_PORT || 5000;
const VPS_AUTH_TOKEN = process.env.VPS_AUTH_TOKEN || 'change-me';

// Store active bot instances
const activeBots = new Map();

app.use(express.json());

// Middleware to verify auth token
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  if (token !== VPS_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

/**
 * Deploy a new bot or update existing one
 * POST /api/bots
 * Body: { action: 'deploy', data: { botId, userId, token, modules } }
 */
app.post('/api/bots', async (req, res) => {
  const { action, data } = req.body;

  try {
    if (action === 'deploy') {
      return await deployBot(data, res);
    } else if (action === 'remove') {
      return await removeBot(data, res);
    } else if (action === 'status') {
      return await getBotStatus(data, res);
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Deploy a bot to this VPS
 */
async function deployBot(data, res) {
  const { botId, userId, token, modules } = data;

  if (!botId || !token) {
    return res.status(400).json({ error: 'botId and token are required' });
  }

  try {
    // If bot already exists, stop it first
    if (activeBots.has(botId)) {
      await removeBot({ botId, userId }, res);
    }

    // Create Discord client for this bot
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    // Setup basic event handlers
    client.on('ready', () => {
      console.log(`[Bot ${botId}] Ready as ${client.user.tag}`);
      // Update bot status
      if (activeBots.has(botId)) {
        const botData = activeBots.get(botId);
        botData.status = 'online';
      }
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      // Example: Simple ping command
      if (message.content === '!ping') {
        return message.reply(`Pong! Latency: ${client.ws.ping}ms`);
      }

      // Add module-based handlers here
      // if (modules.moderation && ...) { }
      // if (modules.logging && ...) { }
      // etc.
    });

    client.on('error', (error) => {
      console.error(`[Bot ${botId}] Error:`, error.message);
      if (activeBots.has(botId)) {
        const botData = activeBots.get(botId);
        botData.status = 'error';
        botData.error = error.message;
      }
    });

    client.on('disconnect', () => {
      console.log(`[Bot ${botId}] Disconnected`);
      if (activeBots.has(botId)) {
        const botData = activeBots.get(botId);
        botData.status = 'offline';
      }
    });

    // Login to Discord
    await client.login(token);

    // Store bot instance
    activeBots.set(botId, {
      client,
      userId,
      token,
      modules,
      status: 'starting',
      createdAt: new Date().toISOString(),
    });

    console.log(`[Deploy] Bot ${botId} deployed successfully`);
    return res.status(201).json({
      success: true,
      message: `Bot deployed: ${botId}`,
      botId,
      status: 'starting',
    });
  } catch (error) {
    console.error(`[Deploy Error] Bot ${botId}:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Remove/stop a bot
 */
async function removeBot(data, res) {
  const { botId } = data;

  if (!botId) {
    return res.status(400).json({ error: 'botId is required' });
  }

  try {
    if (!activeBots.has(botId)) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const botData = activeBots.get(botId);
    await botData.client.destroy();
    activeBots.delete(botId);

    console.log(`[Remove] Bot ${botId} removed successfully`);
    return res.json({
      success: true,
      message: `Bot removed: ${botId}`,
    });
  } catch (error) {
    console.error(`[Remove Error] Bot ${botId}:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get status of a bot
 */
async function getBotStatus(data, res) {
  const { botId } = data;

  if (!botId) {
    const allBots = [];
    activeBots.forEach((botData, id) => {
      allBots.push({
        botId: id,
        status: botData.status,
        userId: botData.userId,
        createdAt: botData.createdAt,
      });
    });
    return res.json({ bots: allBots, count: allBots.length });
  }

  if (!activeBots.has(botId)) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const botData = activeBots.get(botId);
  return res.json({
    botId,
    status: botData.status,
    userId: botData.userId,
    createdAt: botData.createdAt,
    error: botData.error || null,
  });
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'voidhaven-vps-worker',
    activeBots: activeBots.size,
  });
});

/**
 * Start server
 */
app.listen(VPS_PORT, () => {
  console.log(`VPS Worker running on port ${VPS_PORT}`);
  console.log(`Auth token: ${VPS_AUTH_TOKEN.slice(0, 4)}...`);
  console.log('Ready to receive bot deployment commands from your website');
});

/**
 * Graceful shutdown - stop all bots before exiting
 */
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  for (const [botId, botData] of activeBots.entries()) {
    try {
      await botData.client.destroy();
      console.log(`Stopped bot: ${botId}`);
    } catch (error) {
      console.error(`Error stopping bot ${botId}:`, error.message);
    }
  }
  process.exit(0);
});
