const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createUser,
  loginUser,
  createBotForUser,
  listUserBots,
  deleteBotForUser,
  resetBotHostingStorage,
} = require('./bot-hosting.js');

test('users can sign up and log in with a valid profile', () => {
  resetBotHostingStorage();

  const user = createUser({ username: 'alice', email: 'alice@example.com', password: 'Password123' });
  const session = loginUser('alice', 'Password123');

  assert.equal(user.username, 'alice');
  assert.equal(session.username, 'alice');
  assert.equal(session.id, user.id);
});

test('each account is capped at 3 hosted bots and ownership stays with the account', () => {
  resetBotHostingStorage();

  const userA = createUser({ username: 'alice', email: 'alice@example.com', password: 'Password123' });
  const userB = createUser({ username: 'bob', email: 'bob@example.com', password: 'Password123' });

  for (let index = 0; index < 3; index += 1) {
    const bot = createBotForUser(userA.id, {
      name: `Alice Bot ${index + 1}`,
      token: `token.${index + 1}.secret`,
      modules: { moderation: true }
    });
    assert.equal(bot.ownerId, userA.id);
  }

  const botsA = listUserBots(userA.id);
  assert.equal(botsA.length, 3);

  assert.throws(() => {
    createBotForUser(userA.id, {
      name: 'Alice Bot 4',
      token: 'token.4.secret',
      modules: { moderation: true }
    });
  }, /3 bots/i);

  const userBInitialBotCount = listUserBots(userB.id).length;
  assert.equal(userBInitialBotCount, 0);

  const deleted = deleteBotForUser(userB.id, 'not-real-bot');
  assert.equal(deleted, false);
});

test('hosted bots retain a GitHub repo link when provided', () => {
  resetBotHostingStorage();

  const user = createUser({ username: 'carol', email: 'carol@example.com', password: 'Password123' });
  const bot = createBotForUser(user.id, {
    name: 'GitHub Bot',
    token: 'MNzkxYzQxMjQ1NTEyMjA4MjY1N2R0b3A1',
    modules: { moderation: true },
    githubRepo: 'https://github.com/voidhaven/bot-github-bot'
  });

  assert.equal(bot.githubRepo, 'https://github.com/voidhaven/bot-github-bot');
  assert.equal(listUserBots(user.id)[0].githubRepo, 'https://github.com/voidhaven/bot-github-bot');
});
