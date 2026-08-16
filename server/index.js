const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

const users = [];
const botProfiles = new Map();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..')));

function getUserByGoogleId(googleId) {
  return users.find((user) => user.googleId === googleId);
}

function getUserById(userId) {
  return users.find((user) => user.id === userId);
}

function getBotsForUser(userId) {
  return botProfiles.get(userId) || [];
}

function saveBotsForUser(userId, bots) {
  botProfiles.set(userId, bots);
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'voidhaven-auth-bot-hosting' });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body || {};

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required.' });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ error: 'Google account information was incomplete.' });
    }

    const existingUser = getUserByGoogleId(payload.sub) || users.find((user) => user.email.toLowerCase() === payload.email.toLowerCase());

    const user = existingUser || {
      id: uuidv4(),
      username: payload.name || payload.email.split('@')[0],
      email: payload.email,
      password: null,
      googleId: payload.sub,
      avatar: payload.picture || null,
      createdAt: new Date().toISOString(),
    };

    if (!existingUser) {
      users.push(user);
    } else {
      user.username = payload.name || user.username;
      user.avatar = payload.picture || user.avatar;
      user.googleId = payload.sub;
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        googleAuth: true,
      },
      token: `voidhaven-session-${user.id}`,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({ error: 'Google sign-in failed.' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required.' });
  }

  const existingUser = users.find((user) =>
    user.username.toLowerCase() === String(username).trim().toLowerCase() ||
    user.email.toLowerCase() === String(email).trim().toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({ error: 'A profile with that username or email already exists.' });
  }

  const user = {
    id: uuidv4(),
    username: String(username).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    googleId: null,
    avatar: null,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      googleAuth: false,
    },
    token: `voidhaven-session-${user.id}`,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { usernameOrEmail, password } = req.body || {};

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  const user = users.find((entry) => {
    return entry.password && (
      entry.username.toLowerCase() === String(usernameOrEmail).trim().toLowerCase() ||
      entry.email.toLowerCase() === String(usernameOrEmail).trim().toLowerCase()
    ) && entry.password === String(password);
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      googleAuth: Boolean(user.googleId),
    },
    token: `voidhaven-session-${user.id}`,
  });
});

app.get('/api/profile/:userId', (req, res) => {
  const user = getUserById(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      googleAuth: Boolean(user.googleId),
    },
    bots: getBotsForUser(user.id),
  });
});

app.post('/api/bots', (req, res) => {
  const { userId, name, token, modules = {} } = req.body || {};

  if (!userId) {
    return res.status(401).json({ error: 'You must be signed in to host a bot.' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const existingBots = getBotsForUser(userId);
  if (existingBots.length >= 3) {
    return res.status(403).json({ error: 'You have reached the maximum of 3 bots per account.' });
  }

  if (!name || !token) {
    return res.status(400).json({ error: 'Bot name and token are required.' });
  }

  const bot = {
    id: uuidv4(),
    name: String(name).trim().slice(0, 80),
    token: String(token).trim().slice(0, 500),
    ownerId: user.id,
    createdAt: new Date().toISOString(),
    status: 'idle',
    modules: {
      moderation: Boolean(modules.moderation),
      antiSpam: Boolean(modules.antiSpam),
      antiRaid: Boolean(modules.antiRaid),
      admin: Boolean(modules.admin),
      logging: Boolean(modules.logging),
      automod: Boolean(modules.automod),
      ticketing: Boolean(modules.ticketing),
      welcome: Boolean(modules.welcome),
      farewell: Boolean(modules.farewell),
      verification: Boolean(modules.verification),
      announcements: Boolean(modules.announcements),
      reactionRoles: Boolean(modules.reactionRoles),
      roleManagement: Boolean(modules.roleManagement),
      levelSystem: Boolean(modules.levelSystem),
      economy: Boolean(modules.economy),
      music: Boolean(modules.music),
      utility: Boolean(modules.utility),
      social: Boolean(modules.social),
      fun: Boolean(modules.fun),
      games: Boolean(modules.games),
      ai: Boolean(modules.ai),
      stats: Boolean(modules.stats),
      reminders: Boolean(modules.reminders),
      customCommands: Boolean(modules.customCommands),
      webhooks: Boolean(modules.webhooks),
      invites: Boolean(modules.invites),
      voice: Boolean(modules.voice),
      scheduler: Boolean(modules.scheduler),
      polls: Boolean(modules.polls),
      suggestions: Boolean(modules.suggestions),
      nsfw: Boolean(modules.nsfw),
      serverInsights: Boolean(modules.serverInsights),
      status: Boolean(modules.status),
      backup: Boolean(modules.backup),
      automations: Boolean(modules.automations),
      slashCommands: Boolean(modules.slashCommands),
      messageCommands: Boolean(modules.messageCommands),
      moderationPanel: Boolean(modules.moderationPanel),
    },
  };

  const nextBots = [...existingBots, bot];
  saveBotsForUser(userId, nextBots);

  return res.json({ bot, bots: nextBots });
});

app.get('/api/bots/:userId', (req, res) => {
  const user = getUserById(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({ bots: getBotsForUser(user.id) });
});

app.delete('/api/bots/:userId/:botId', (req, res) => {
  const { userId, botId } = req.params;
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const currentBots = getBotsForUser(userId);
  const nextBots = currentBots.filter((bot) => bot.id !== botId || bot.ownerId !== userId);
  saveBotsForUser(userId, nextBots);

  return res.json({ bots: nextBots });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`VoidHaven auth server running on http://localhost:${PORT}`);
  console.log('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in a .env file to enable Google sign-in.');
});
