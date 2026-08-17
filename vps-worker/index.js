require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits, ActivityType, PermissionFlagsBits } = require('discord.js');

const app = express();
const PORT = Number(process.env.VPS_PORT || 5000);
const AUTH_TOKEN = process.env.VPS_AUTH_TOKEN || 'change-me';
const HOSTED_STATUS_TEXT = 'Powered by VoidHaven Hosting';
const activeBots = new Map();

const DEFAULT_MODULES = {
  moderation: false,
  antiSpam: false,
  antiRaid: false,
  admin: false,
  logging: false,
  automod: false,
  ticketing: false,
  welcome: false,
  farewell: false,
  verification: false,
  announcements: false,
  reactionRoles: false,
  roleManagement: false,
  levelSystem: false,
  economy: false,
  music: false,
  utility: false,
  social: false,
  fun: false,
  games: false,
  ai: false,
  stats: false,
  reminders: false,
  customCommands: false,
  webhooks: false,
  invites: false,
  voice: false,
  scheduler: false,
  polls: false,
  suggestions: false,
  nsfw: false,
  serverInsights: false,
  status: false,
  backup: false,
  automations: false,
  slashCommands: false,
  messageCommands: false,
  moderationPanel: false,
};

function normalizeModules(modules = {}) {
  return { ...DEFAULT_MODULES, ...modules };
}

function getHostedBotStatusText() {
  return HOSTED_STATUS_TEXT;
}

function buildModuleRuntime(modules = {}) {
  const normalized = normalizeModules(modules);
  const enabledNames = Object.entries(normalized)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([name]) => name);

  return enabledNames.map((name) => ({
    name,
    description: `${name} module is active`,
    code: `// ${name} module runtime injected at startup\nif (modules.${name}) { /* ${name} logic enabled */ }`,
  }));
}

function applyHostedBotStatus(client) {
  if (!client || !client.user) {
    return;
  }

  client.user.setPresence({
    activities: [{
      name: HOSTED_STATUS_TEXT,
      type: ActivityType.Custom,
      state: HOSTED_STATUS_TEXT,
    }],
    status: 'online',
  }).catch((error) => {
    console.warn('[Bot Status] Unable to set custom status:', error.message);
  });
}

function registerBotModules(client, botId, modules = {}) {
  const normalized = normalizeModules(modules);
  const runtime = buildModuleRuntime(normalized);

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) {
      return;
    }

    if (message.content === '!ping') {
      await message.reply(`Pong! ${client.ws.ping}ms`);
    }

    if (normalized.moderation && message.content.startsWith('!clear ')) {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return;
      }

      const amount = Number.parseInt(message.content.split(' ')[1], 10) || 5;
      const target = Math.min(Math.max(amount, 1), 25);
      await message.channel.bulkDelete(target, true).catch(() => {});
    }

    if (normalized.logging) {
      console.log(`[Bot ${botId}] ${message.author.tag}: ${message.content}`);
    }

    if (normalized.utility && message.content === '!help') {
      const enabledList = runtime.map((module) => module.name).join(', ') || 'none';
      await message.reply(`Enabled modules: ${enabledList}`);
    }

    if (normalized.status && message.content === '!status') {
      await message.reply(HOSTED_STATUS_TEXT);
    }

    if (normalized.economy && message.content === '!balance') {
      await message.reply('Balance: 100 coins');
    }

    if (normalized.fun && message.content === '!roll') {
      await message.reply(`You rolled a ${Math.floor(Math.random() * 6) + 1}`);
    }

    if (normalized.music && message.content.startsWith('!play ')) {
      await message.reply('Music module is active and ready to queue tracks.');
    }
  });

  if (normalized.welcome) {
    client.on('guildMemberAdd', async (member) => {
      await member.send(`Welcome to the server, ${member.user.username}!`).catch(() => {});
    });
  }

  if (normalized.farewell) {
    client.on('guildMemberRemove', async (member) => {
      const channel = member.guild.systemChannel;
      if (channel) {
        await channel.send(`Goodbye, ${member.user.tag}!`).catch(() => {});
      }
    });
  }

  if (normalized.antiSpam) {
    const spamTracker = new Map();
    client.on('messageCreate', (message) => {
      if (message.author.bot || !message.guild) {
        return;
      }
      const key = `${message.author.id}:${message.guild.id}`;
      const now = Date.now();
      const recent = spamTracker.get(key) || [];
      const next = recent.filter((timestamp) => now - timestamp < 5000);
      next.push(now);
      spamTracker.set(key, next);
      if (next.length >= 5) {
        message.member?.timeout(10000, 'Auto-spam protection').catch(() => {});
      }
    });
  }

  if (normalized.antiRaid) {
    const joinTracker = new Map();
    client.on('guildMemberAdd', (member) => {
      const recent = joinTracker.get(member.guild.id) || [];
      const now = Date.now();
      const next = recent.filter((timestamp) => now - timestamp < 15000);
      next.push(now);
      joinTracker.set(member.guild.id, next);
      if (next.length >= 5) {
        member.kick('Possible raid detected').catch(() => {});
      }
    });
  }

  if (normalized.logging) {
    client.on('guildMemberAdd', (member) => {
      console.log(`[Bot ${botId}] Member joined: ${member.user.tag}`);
    });
    client.on('guildMemberRemove', (member) => {
      console.log(`[Bot ${botId}] Member left: ${member.user.tag}`);
    });
  }

  if (normalized.announcements) {
    client.on('messageCreate', async (message) => {
      if (message.content === '!announce') {
        const channel = message.channel;
        await channel.send('Announcement module is active for this hosted bot.');
      }
    });
  }

  if (normalized.roleManagement) {
    client.on('messageCreate', async (message) => {
      if (message.content.startsWith('!role ')) {
        const [command, roleName] = message.content.split(' ');
        if (!roleName || command !== '!role') {
          return;
        }
        const guildRole = message.guild.roles.cache.find((role) => role.name.toLowerCase() === roleName.toLowerCase());
        if (guildRole) {
          await message.member.roles.add(guildRole).catch(() => {});
        }
      }
    });
  }

  if (normalized.levelSystem) {
    const xpMap = new Map();
    client.on('messageCreate', (message) => {
      if (message.author.bot || !message.guild) {
        return;
      }
      const key = `${message.author.id}:${message.guild.id}`;
      const current = xpMap.get(key) || 0;
      xpMap.set(key, current + 10);
      if (current % 100 === 0) {
        message.reply('Level up!').catch(() => {});
      }
    });
  }

  if (normalized.admin) {
    client.on('messageCreate', async (message) => {
      if (message.content === '!restart' && message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('Admin controls are enabled.');
      }
    });
  }

  if (normalized.automations) {
    setInterval(() => {
      console.log(`[Bot ${botId}] automation tick: ${new Date().toISOString()}`);
    }, 60000).unref();
  }

  return runtime;
}

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
    await removeBot({ botId }, { json: (payload) => payload });
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

  const runtime = registerBotModules(client, botId, modules);

  client.on('ready', () => {
    console.log(`[Bot ${botId}] Ready as ${client.user.tag}`);
    applyHostedBotStatus(client);
    const current = activeBots.get(botId);
    if (current) current.status = 'online';
  });

  client.on('error', (error) => {
    console.error(`[Bot ${botId}] Client error:`, error.message);
    const current = activeBots.get(botId);
    if (current) {
      current.status = 'error';
      current.error = error.message;
    }
  });

  try {
    await client.login(token);
  } catch (error) {
    console.error(`[Bot ${botId}] Login failed:`, error.message);
    return res.status(500).json({ error: `Bot login failed: ${error.message}` });
  }

  activeBots.set(botId, {
    botId,
    userId,
    token,
    modules: normalizeModules(modules),
    status: 'starting',
    createdAt: new Date().toISOString(),
    client,
    runtime,
  });

  return res.status(201).json({ success: true, botId, status: 'starting', modules: runtime });
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`VPS worker listening on port ${PORT}`);
    console.log(`Auth token loaded: ${AUTH_TOKEN.slice(0, 6)}...`);
  });
}

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

module.exports = {
  DEFAULT_MODULES,
  normalizeModules,
  buildModuleRuntime,
  registerBotModules,
  getHostedBotStatusText,
  applyHostedBotStatus,
  deployBot,
  removeBot,
  getStatus,
};
