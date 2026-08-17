require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = Number(process.env.VPS_PORT || 5000);
const AUTH_TOKEN = process.env.VPS_AUTH_TOKEN || 'change-me';
const activeBots = new Map();

app.use(express.json());

app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'voidhaven-vps-worker', activeBots: activeBots.size });
});

app.post('/api/bots', async (req, res) => {
  const { action, data } = req.body || {};

  try {
    if (action === 'deploy') {
      return await deployBot(data, res);
    }
    if (action === 'remove') {
      return await removeBot(data, res);
    }
    if (action === 'status') {
      return await getStatus(data, res);
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (error) {
    console.error('[VPS] API error:', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

async function deployBot(data, res) {
  const { botId, userId, token, modules = {} } = data || {};
  if (!botId || !token) {
    return res.status(400).json({ error: 'botId and token are required.' });
  }

  if (activeBots.has(botId)) {
    await removeBot({ botId }, res);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.on('ready', () => {
    console.log(`[Bot ${botId}] Ready as ${client.user.tag}`);
    const current = activeBots.get(botId);
    if (current) current.status = 'online';
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
      await message.reply(`Pong! ${client.ws.ping}ms`);
    }
  });

  client.on('error', (error) => {
    console.error(`[Bot ${botId}] Client error:`, error.message);
    const current = activeBots.get(botId);
    if (current) {
      current.status = 'error';
      current.error = error.message;
    }
  });

  await client.login(token);

  activeBots.set(botId, {
    botId,
    userId,
    token,
    modules,
    status: 'starting',
    createdAt: new Date().toISOString(),
    client,
  });

  return res.status(201).json({ success: true, botId, status: 'starting' });
}

async function removeBot(data, res) {
  const { botId } = data || {};
  if (!botId) {
    return res.status(400).json({ error: 'botId is required.' });
  }

  const current = activeBots.get(botId);
  if (!current) {
    return res.status(404).json({ error: 'Bot not found.' });
  }

  try {
    await current.client.destroy();
  } catch (error) {
    console.error(`[Bot ${botId}] destroy error:`, error.message);
  }

  activeBots.delete(botId);
  return res.json({ success: true, botId, removed: true });
}

async function getStatus(data, res) {
  const { botId } = data || {};
  if (!botId) {
    return res.json({
      bots: [...activeBots.values()].map((bot) => ({
        botId: bot.botId,
        status: bot.status,
        userId: bot.userId,
        createdAt: bot.createdAt,
      })),
      count: activeBots.size,
    });
  }

  const current = activeBots.get(botId);
  if (!current) {
    return res.status(404).json({ error: 'Bot not found.' });
  }

  return res.json({
    botId,
    status: current.status,
    userId: current.userId,
    createdAt: current.createdAt,
    error: current.error || null,
  });
}

app.listen(PORT, () => {
  console.log(`VPS worker listening on port ${PORT}`);
  console.log(`Auth token loaded: ${AUTH_TOKEN.slice(0, 6)}...`);
});

process.on('SIGINT', async () => {
  for (const [botId, bot] of activeBots.entries()) {
    try {
      await bot.client.destroy();
      console.log(`Stopped bot ${botId}`);
    } catch (error) {
      console.error(`Could not stop bot ${botId}:`, error.message);
    }
  }
  process.exit(0);
});
