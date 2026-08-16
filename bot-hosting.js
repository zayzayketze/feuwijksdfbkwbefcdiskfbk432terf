const STORAGE_KEY = 'voidhaven_bot_hosting_accounts';
const BOT_LIMIT = 3;

function getMemoryStorage() {
  const globalScope = typeof globalThis !== 'undefined' ? globalThis : {};
  if (!globalScope.__voidhaven_memory_store) {
    globalScope.__voidhaven_memory_store = {};
  }
  return globalScope.__voidhaven_memory_store;
}

function getStorage() {
  try {
    const browserStorage = typeof localStorage !== 'undefined' ? localStorage : null;
    const rawValue = browserStorage ? browserStorage.getItem(STORAGE_KEY) : getMemoryStorage()[STORAGE_KEY];
    if (!rawValue) {
      return { users: [] };
    }
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : { users: [] };
  } catch (error) {
    return { users: [] };
  }
}

function saveStorage(state) {
  try {
    const browserStorage = typeof localStorage !== 'undefined' ? localStorage : null;
    const storageValue = JSON.stringify(state);
    if (browserStorage) {
      browserStorage.setItem(STORAGE_KEY, storageValue);
    } else {
      getMemoryStorage()[STORAGE_KEY] = storageValue;
    }
  } catch (error) {
    console.warn('Unable to persist bot hosting data:', error);
  }
}

function normalizeModules(rawModules = {}) {
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

  const normalized = { ...DEFAULT_MODULES, ...rawModules };
  return normalized;
}

function normalizeGitHubRepo(rawRepo) {
  const repo = String(rawRepo || '').trim();
  if (!repo) {
    return '';
  }

  const normalized = repo.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (/^github\.com\//i.test(normalized)) {
    return `https://${normalized}`;
  }

  if (/^github\.com$/i.test(normalized)) {
    return 'https://github.com';
  }

  return repo.startsWith('http') ? repo : `https://${repo}`;
}

function sanitizeBot(bot) {
  if (!bot || typeof bot !== 'object') {
    return null;
  }

  return {
    id: String(bot.id || Date.now() + Math.random().toString(16).slice(2)),
    name: String(bot.name || 'Unnamed bot').slice(0, 80),
    token: String(bot.token || '').slice(0, 500),
    ownerId: String(bot.ownerId || ''),
    createdAt: bot.createdAt || new Date().toISOString(),
    status: 'idle',
    githubRepo: normalizeGitHubRepo(bot.githubRepo),
    modules: normalizeModules(bot.modules),
  };
}

function createUser({ username, email, password }) {
  const state = getStorage();
  const sanitizedUsername = String(username || '').trim();
  const sanitizedEmail = String(email || '').trim().toLowerCase();
  const sanitizedPassword = String(password || '');

  if (!sanitizedUsername || !sanitizedEmail || !sanitizedPassword) {
    throw new Error('Username, email and password are required.');
  }

  const existingUser = state.users.find((user) => {
    return user.username.toLowerCase() === sanitizedUsername.toLowerCase() || user.email.toLowerCase() === sanitizedEmail;
  });

  if (existingUser) {
    throw new Error('A profile with that username or email already exists.');
  }

  const user = {
    id: `user_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    username: sanitizedUsername,
    email: sanitizedEmail,
    password: sanitizedPassword,
    createdAt: new Date().toISOString(),
    bots: [],
  };

  state.users.push(user);
  saveStorage(state);
  return { ...user };
}

function loginUser(usernameOrEmail, password) {
  const state = getStorage();
  const trimmedUsername = String(usernameOrEmail || '').trim();
  const trimmedPassword = String(password || '');

  const user = state.users.find((entry) => {
    return (
      entry.username.toLowerCase() === trimmedUsername.toLowerCase() ||
      entry.email.toLowerCase() === trimmedUsername.toLowerCase()
    ) && entry.password === trimmedPassword;
  });

  if (!user) {
    throw new Error('Invalid username/email or password.');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function getUserById(userId) {
  const state = getStorage();
  return state.users.find((user) => user.id === userId) || null;
}

function createBotForUser(userId, { name, token, modules = {}, githubRepo = '' }) {
  const state = getStorage();
  const user = state.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error('You must be signed in to host a bot.');
  }

  if (user.bots.length >= BOT_LIMIT) {
    throw new Error('You have reached the maximum of 3 bots per account.');
  }

  const bot = sanitizeBot({
    id: `bot_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    name,
    token,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
    githubRepo,
    modules,
  });

  if (!bot || !bot.token || !bot.name) {
    throw new Error('Bot name and token are required.');
  }

  user.bots.push(bot);
  saveStorage(state);
  return { ...bot };
}

function listUserBots(userId) {
  const user = getUserById(userId);
  if (!user) {
    return [];
  }
  return [...user.bots].map((bot) => ({ ...bot, modules: { ...bot.modules } }));
}

function deleteBotForUser(userId, botId) {
  const state = getStorage();
  const user = state.users.find((entry) => entry.id === userId);

  if (!user) {
    return false;
  }

  const previousLength = user.bots.length;
  user.bots = user.bots.filter((bot) => bot.id !== botId || bot.ownerId !== userId);
  saveStorage(state);

  return user.bots.length !== previousLength;
}

function resetBotHostingStorage() {
  saveStorage({ users: [] });
}

if (typeof window !== 'undefined') {
  window.botHosting = {
    STORAGE_KEY,
    BOT_LIMIT,
    createUser,
    loginUser,
    getUserById,
    createBotForUser,
    listUserBots,
    deleteBotForUser,
    resetBotHostingStorage,
    normalizeModules,
    getStorage,
    saveStorage,
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    STORAGE_KEY,
    BOT_LIMIT,
    createUser,
    loginUser,
    getUserById,
    createBotForUser,
    listUserBots,
    deleteBotForUser,
    resetBotHostingStorage,
    normalizeModules,
    getStorage,
    saveStorage,
  };
}
