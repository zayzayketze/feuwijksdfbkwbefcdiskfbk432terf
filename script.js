const SITE_STATUS_WEBHOOK_URL = 'https://discord.com/api/webhooks/1538620652645384344/sizlM1XcNQxitPs1UNYg22Rrhl_Id0fhpeNBbaFugOM4t2REXirGzdgWZSEvdaD84k7r';

function postToWebhook(webhookUrl, payload) {
  const content = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([content], { type: 'application/json' });
    return navigator.sendBeacon(webhookUrl, blob);
  }

  return fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: content,
  });
}

let currentStatusState = null;
let statusMessageId = null;
const SITE_STATUS_STORAGE_KEY = 'voidhaven_site_status';
const SITE_INITIAL_MSG_SENT_KEY = 'voidhaven_initial_status_sent';

function getStoredStatus() {
  try {
    return localStorage.getItem(SITE_STATUS_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function setStoredStatus(status) {
  try {
    localStorage.setItem(SITE_STATUS_STORAGE_KEY, status);
  } catch (error) {
    // Ignore storage failures for privacy or browser restrictions.
  }
}

function hasInitialMessageBeenSent() {
  try {
    return localStorage.getItem(SITE_INITIAL_MSG_SENT_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function markInitialMessageSent() {
  try {
    localStorage.setItem(SITE_INITIAL_MSG_SENT_KEY, 'true');
  } catch (error) {
    // Ignore storage failures.
  }
}

async function sendWebsiteStatus(status, message = '') {
  const previousStatus = getStoredStatus();

  if (previousStatus === status) {
    return;
  }

  const payload = {
    username: 'VoidHaven Site Status',
    avatar_url: 'https://cdn.discordapp.com/icons/1477464933179588880/a_a061556c7f7e320ceaf1b7c1519636a6.webp?size=1024&animated=true',
    embeds: [
      {
        title: status === 'online' ? 'Website Online' : 'Website Offline',
        description: message || (status === 'online' ? 'The website is currently online and reachable.' : 'The website is currently offline or unreachable.'),
        color: status === 'online' ? 0x22c55e : 0xef4444,
        fields: [
          { name: 'Status', value: status.toUpperCase() },
          { name: 'Page', value: window.location.href.slice(0, 1024) },
          { name: 'Time', value: new Date().toISOString() },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const endpoint = statusMessageId
      ? `${SITE_STATUS_WEBHOOK_URL}/messages/${statusMessageId}`
      : SITE_STATUS_WEBHOOK_URL;

    const response = await fetch(endpoint, {
      method: statusMessageId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord status update failed: ${response.status}`);
    }

    if (!statusMessageId) {
      const data = await response.json();
      statusMessageId = data?.id || null;
    }

    currentStatusState = status;
    setStoredStatus(status);
  } catch (error) {
    console.warn('Website status update failed:', error);
  }
}

window.voidHavenStatus = sendWebsiteStatus;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {});
} else {
  // background effect removed
}

document.addEventListener('DOMContentLoaded', () => {
  const heartbeatIntervalMs = 10000;

  function sendHeartbeat() {
    const online = navigator.onLine;
    const status = online ? 'online' : 'offline';
    const storedStatus = getStoredStatus();

    if (!hasInitialMessageBeenSent() && online) {
      sendWebsiteStatus(status, 'The website is now online.');
      markInitialMessageSent();
    } else if (storedStatus !== status) {
      sendWebsiteStatus(status, status === 'online' ? 'The website is now online.' : 'The website went offline.');
    }
  }

  setInterval(sendHeartbeat, heartbeatIntervalMs);

  window.addEventListener('offline', () => {
    sendWebsiteStatus('offline', 'The website went offline in the browser context.');
  });

  window.addEventListener('online', () => {
    sendWebsiteStatus('online', 'The website is back online.');
  });

  const memberCountNodes = document.querySelectorAll('[data-discord-member-count]');

  async function updateDiscordMemberCount() {
    try {
      const response = await fetch('https://discord.com/api/invites/voidhavensmp?with_counts=true');
      if (!response.ok) throw new Error('Failed to fetch Discord member count');

      const data = await response.json();
      const memberCount = data?.approximate_member_count ?? data?.member_count ?? null;

      if (memberCount !== null) {
        memberCountNodes.forEach((node) => {
          node.textContent = memberCount;
        });
      }
    } catch (error) {
      console.warn('Discord member count unavailable:', error);
    }
  }

  if (memberCountNodes.length > 0) {
    updateDiscordMemberCount();
  }

  const faqToggles = document.querySelectorAll('.faq-toggle');
  faqToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const faqItem = toggle.parentElement;
      const isOpen = faqItem.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach((item) => {
        item.classList.remove('open');
      });

      if (!isOpen) {
        faqItem.classList.add('open');
      }
    });
  });

  const brand = document.querySelector('.brand');
  if (brand) {
    brand.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    updateActiveNavLink();
  });

  function updateActiveNavLink() {
    const scrollPosition = window.scrollY + 100;

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        const sectionId = href.substring(1);
        const section = document.getElementById(sectionId);

        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            navLinks.forEach((l) => l.style.color = 'var(--muted)');
            link.style.color = 'var(--accent)';
          }
        }
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '#join') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .rule-item, .faq-item').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });

  const profileApp = document.getElementById('profile-app');
  if (profileApp) {
    const BOT_MODULES = [
      'moderation', 'antiSpam', 'antiRaid', 'admin', 'logging', 'automod', 'ticketing', 'welcome',
      'farewell', 'verification', 'announcements', 'reactionRoles', 'roleManagement', 'levelSystem',
      'economy', 'music', 'utility', 'social', 'fun', 'games', 'ai', 'stats', 'reminders',
      'customCommands', 'webhooks', 'invites', 'voice', 'scheduler', 'polls', 'suggestions',
      'nsfw', 'serverInsights', 'status', 'backup', 'automations', 'slashCommands', 'messageCommands',
      'moderationPanel'
    ];

    const SESSION_KEY = 'voidhaven_active_profile';
    const botHosting = window.botHosting || {};

    function getSession() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    }

    function setSession(user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, username: user.username }));
    }

    function clearSession() {
      localStorage.removeItem(SESSION_KEY);
    }

    function renderModuleOptions(selectedModules = {}) {
      return BOT_MODULES.map((moduleName) => {
        const checked = Boolean(selectedModules[moduleName]);
        return `
          <label class="module-toggle">
            <input type="checkbox" name="modules" value="${moduleName}" ${checked ? 'checked' : ''} />
            <span>${moduleName}</span>
          </label>
        `;
      }).join('');
    }

    function renderBotList(user) {
      const botList = document.getElementById('bot-list');
      const botCount = document.getElementById('bot-count');
      const totalBots = botHosting.listUserBots ? botHosting.listUserBots(user.id) : [];
      const activeBots = totalBots.length;

      if (botCount) {
        botCount.textContent = `${activeBots}/3 bots used`;
      }

      if (!botList) return;
      if (!activeBots) {
        botList.innerHTML = '<div class="empty-state">No bots created yet. Add your first bot below.</div>';
        return;
      }

      botList.innerHTML = totalBots.map((bot) => {
        const enabledModules = Object.entries(bot.modules || {})
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(', ') || 'No modules enabled';

        return `
          <article class="bot-card" data-bot-id="${bot.id}">
            <div class="bot-header">
              <div>
                <h3>${bot.name}</h3>
                <p class="bot-token">Token: ${bot.token.slice(0, 12)}••••••</p>
              </div>
              <button type="button" class="button button-secondary small-button" data-delete-bot="${bot.id}">Delete</button>
            </div>
            <div class="bot-meta">
              <span>Owner: ${user.username}</span>
              <span>Created: ${new Date(bot.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="module-list">
              <strong>Modules</strong>
              <p>${enabledModules}</p>
            </div>
          </article>
        `;
      }).join('');
    }

    function renderAuthState() {
      const guestView = document.getElementById('guest-view');
      const dashboardView = document.getElementById('dashboard-view');
      const session = getSession();
      const user = session ? (botHosting.getUserById ? botHosting.getUserById(session.id) : null) : null;

      if (guestView && dashboardView) {
        if (!user) {
          guestView.hidden = false;
          dashboardView.hidden = true;
          return;
        }

        guestView.hidden = true;
        dashboardView.hidden = false;
        const welcomeMessage = document.getElementById('welcome-message');
        const accountInfo = document.getElementById('account-info');

        if (welcomeMessage) {
          welcomeMessage.textContent = `Welcome back, ${user.username}!`;
        }

        if (accountInfo) {
          accountInfo.textContent = `Signed in as ${user.username} • ${user.email}`;
        }

        renderBotList(user);
      }
    }

    function handleSignup(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const username = String(formData.get('signupUsername') || '').trim();
      const email = String(formData.get('signupEmail') || '').trim();
      const password = String(formData.get('signupPassword') || '');

      try {
        const user = botHosting.createUser({ username, email, password });
        setSession(user);
        form.reset();
        renderAuthState();
      } catch (error) {
        const message = document.getElementById('signup-status');
        if (message) {
          message.textContent = error.message;
        }
      }
    }

    function handleLogin(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const username = String(formData.get('loginUsername') || '').trim();
      const password = String(formData.get('loginPassword') || '');

      try {
        const user = botHosting.loginUser(username, password);
        setSession(user);
        form.reset();
        renderAuthState();
      } catch (error) {
        const message = document.getElementById('login-status');
        if (message) {
          message.textContent = error.message;
        }
      }
    }

    function handleLogout() {
      clearSession();
      renderAuthState();
    }

    function handleCreateBot(event) {
      event.preventDefault();
      const session = getSession();
      const user = session ? (botHosting.getUserById ? botHosting.getUserById(session.id) : null) : null;

      if (!user) {
        return;
      }

      const form = event.currentTarget;
      const formData = new FormData(form);
      const name = String(formData.get('botName') || '').trim();
      const token = String(formData.get('botToken') || '').trim();
      const checkedModules = [...form.querySelectorAll('input[name="modules"]:checked')].map((checkbox) => checkbox.value);
      const modules = Object.fromEntries(BOT_MODULES.map((moduleName) => [moduleName, checkedModules.includes(moduleName)]));

      try {
        botHosting.createBotForUser(user.id, { name, token, modules });
        form.reset();
        renderAuthState();
        const botStatus = document.getElementById('bot-status');
        if (botStatus) {
          botStatus.textContent = 'Bot hosted successfully to your account.';
        }
      } catch (error) {
        const botStatus = document.getElementById('bot-status');
        if (botStatus) {
          botStatus.textContent = error.message;
        }
      }
    }

    function handleDeleteBot(event) {
      const session = getSession();
      const user = session ? (botHosting.getUserById ? botHosting.getUserById(session.id) : null) : null;
      const button = event.target.closest('[data-delete-bot]');
      if (!button || !user) return;

      const botId = button.getAttribute('data-delete-bot');
      botHosting.deleteBotForUser(user.id, botId);
      renderAuthState();
    }

    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const createBotForm = document.getElementById('create-bot-form');
    const logoutButton = document.getElementById('logout-button');
    const moduleContainer = document.getElementById('module-list');
    const botList = document.getElementById('bot-list');

    if (moduleContainer) {
      moduleContainer.innerHTML = renderModuleOptions();
    }

    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (createBotForm) createBotForm.addEventListener('submit', handleCreateBot);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (botList) botList.addEventListener('click', handleDeleteBot);

    renderAuthState();
  }
});
