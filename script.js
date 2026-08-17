document.addEventListener('DOMContentLoaded', () => {

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
  const botPageApp = document.getElementById('bot-page-app');

  if (profileApp || botPageApp) {
    const BOT_MODULES = [
      'moderation', 'antiSpam', 'antiRaid', 'admin', 'logging', 'automod', 'ticketing', 'welcome',
      'farewell', 'verification', 'announcements', 'reactionRoles', 'roleManagement', 'levelSystem',
      'economy', 'music', 'utility', 'social', 'fun', 'games', 'ai', 'stats', 'reminders',
      'customCommands', 'webhooks', 'invites', 'voice', 'scheduler', 'polls', 'suggestions',
      'serverInsights', 'status', 'backup', 'automations', 'slashCommands', 'messageCommands',
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

    function setSession(user, token = '') {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || '',
        googleAuth: Boolean(user.googleAuth),
        token,
      }));
    }

    function clearSession() {
      localStorage.removeItem(SESSION_KEY);
    }

    async function apiFetch(path, options = {}) {
      const apiBases = [
        window.location.origin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ].filter((value, index, array) => value && array.indexOf(value) === index);

      let lastError = null;
      for (const base of apiBases) {
        const url = `${base}${path}`;
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...(options.headers || {}),
            },
          });

          const contentType = response.headers.get('content-type') || '';
          const data = contentType.includes('application/json') ? await response.json() : null;

          if (!response.ok) {
            throw new Error(data?.error || 'Request failed.');
          }

          return data;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error('Request failed.');
    }

    function getLocalFallbackAuthResult(type, payload) {
      const host = window.botHosting;
      if (!host) {
        return null;
      }

      if (type === 'signup') {
        const user = host.createUser({
          username: payload.username,
          email: payload.email,
          password: payload.password,
        });

        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || '',
            googleAuth: false,
          },
          token: `voidhaven-session-${user.id}`,
        };
      }

      if (type === 'login') {
        const user = host.loginUser(payload.usernameOrEmail, payload.password);
        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: '',
            googleAuth: false,
          },
          token: `voidhaven-session-${user.id}`,
        };
      }

      return null;
    }

    async function authRequest(path, payload, fallbackType) {
      try {
        return await apiFetch(path, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (error) {
        const fallback = getLocalFallbackAuthResult(fallbackType, payload);
        if (fallback) {
          return fallback;
        }
        throw error;
      }
    }

    async function botRequest(method, path, payload) {
      try {
        return await apiFetch(path, {
          method,
          body: payload ? JSON.stringify(payload) : undefined,
        });
      } catch (error) {
        if (!window.botHosting) {
          throw error;
        }

        if (method === 'POST' && path === '/api/bots') {
          const bot = window.botHosting.createBotForUser(payload.userId, {
            name: payload.name,
            token: payload.token,
            modules: payload.modules || {},
            githubRepo: payload.githubRepo || '',
          });
          return { bot, bots: window.botHosting.listUserBots(payload.userId) };
        }

        if (method === 'DELETE') {
          const match = path.match(/^\/api\/bots\/([^/]+)\/([^/]+)$/);
          if (match) {
            const [, userId, botId] = match;
            const deleted = window.botHosting.deleteBotForUser(userId, botId);
            return { deleted, bots: window.botHosting.listUserBots(userId) };
          }
        }

        if (method === 'GET') {
          const match = path.match(/^\/api\/bots\/([^/]+)$/);
          if (match) {
            const [, userId] = match;
            return { bots: window.botHosting.listUserBots(userId) };
          }
        }

        throw error;
      }
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

    function isValidBotToken(token) {
      return /^[MN][A-Za-z\d_-]{23,25}\.[A-Za-z\d_-]{6,7}\.[A-Za-z\d_-]{27}$/.test(token);
    }

    function updateModuleDisplay() {
      const botTokenInput = document.querySelector('input[name="botToken"]');
      const modulePanel = document.querySelector('.module-panel');
      if (!botTokenInput || !modulePanel) return;

      const token = botTokenInput.value.trim();
      const isValid = isValidBotToken(token);

      if (isValid && !modulePanel.innerHTML.includes('module-toggle')) {
        const moduleGrid = modulePanel.querySelector('.module-grid') || document.createElement('div');
        moduleGrid.className = 'module-grid';
        moduleGrid.id = moduleGrid.id || 'module-list';
        moduleGrid.innerHTML = renderModuleOptions();
        if (!modulePanel.querySelector('.module-grid')) {
          modulePanel.appendChild(moduleGrid);
        }
      } else if (!isValid && modulePanel.innerHTML.includes('module-toggle')) {
        const moduleGrid = modulePanel.querySelector('.module-grid');
        if (moduleGrid) {
          moduleGrid.innerHTML = '';
          moduleGrid.style.display = 'none';
        }
        if (!modulePanel.querySelector('.validation-message')) {
          const message = document.createElement('p');
          message.className = 'muted-label validation-message';
          message.textContent = 'Enter a valid bot token to see available modules';
          modulePanel.appendChild(message);
        }
      }
    }

    async function renderBotList(user) {
      const botList = document.getElementById('bot-list');
      const botCount = document.getElementById('bot-count');

      try {
        const data = await botRequest('GET', `/api/bots/${user.id}`);
        const totalBots = data?.bots || [];
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
          const githubRepo = bot.githubRepo ? `<div class="bot-meta"><span>GitHub: <a href="${bot.githubRepo}" target="_blank" rel="noreferrer">${bot.githubRepo.replace(/^https?:\/\//i, '')}</a></span></div>` : '';

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
              ${githubRepo}
              <div class="module-list">
                <strong>Modules</strong>
                <p>${enabledModules}</p>
              </div>
            </article>
          `;
        }).join('');
      } catch (error) {
        if (botCount) {
          botCount.textContent = '0/3 bots used';
        }
        if (botList) {
          botList.innerHTML = `<div class="empty-state">${error.message}</div>`;
        }
      }
    }

    async function renderAuthState() {
      const guestView = document.getElementById('guest-view');
      const dashboardView = document.getElementById('dashboard-view');
      const session = getSession();
      const user = session ? {
        id: session.id,
        username: session.username,
        email: session.email,
        avatar: session.avatar,
        googleAuth: Boolean(session.googleAuth),
      } : null;

      if (guestView && dashboardView) {
        if (!user) {
          guestView.hidden = false;
          dashboardView.hidden = true;
          updateLogoutButtonVisibility();
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
          accountInfo.textContent = `Signed in as ${user.username} • ${user.email}${user.googleAuth ? ' • Google Account' : ''}`;
        }

        updateLogoutButtonVisibility();
        await renderBotList(user);
        updateModuleDisplay();
      }
    }

    async function handleSignup(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const username = String(formData.get('signupUsername') || '').trim();
      const email = String(formData.get('signupEmail') || '').trim();
      const password = String(formData.get('signupPassword') || '');
      const statusId = form.id === 'bot-signup-form' ? 'bot-signup-status' : 'signup-status';

      try {
        const result = await authRequest('/api/auth/signup', { username, email, password }, 'signup');
        setSession(result.user, result.token);
        form.reset();
        await renderAuthState();
      } catch (error) {
        const message = document.getElementById(statusId) || document.getElementById('signup-status') || document.getElementById('bot-signup-status');
        if (message) {
          message.textContent = error.message;
        }
      }
    }

    async function handleLogin(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const username = String(formData.get('loginUsername') || '').trim();
      const password = String(formData.get('loginPassword') || '');
      const statusId = form.id === 'bot-login-form' ? 'bot-login-status' : 'login-status';

      try {
        const result = await authRequest('/api/auth/login', { usernameOrEmail: username, password }, 'login');
        setSession(result.user, result.token);
        form.reset();
        await renderAuthState();
      } catch (error) {
        const message = document.getElementById(statusId) || document.getElementById('login-status') || document.getElementById('bot-login-status');
        if (message) {
          message.textContent = error.message;
        }
      }
    }

    function handleLogout() {
      clearSession();
      renderAuthState();
    }

    async function handleCreateBot(event) {
      event.preventDefault();
      const session = getSession();
      const user = session ? {
        id: session.id,
        username: session.username,
        email: session.email,
        avatar: session.avatar,
        googleAuth: Boolean(session.googleAuth),
      } : null;

      if (!user) {
        return;
      }

      const form = event.currentTarget;
      const formData = new FormData(form);
      const token = String(formData.get('botToken') || '').trim();
      const githubRepo = String(formData.get('githubRepo') || '').trim();

      // Validate bot token
      if (!isValidBotToken(token)) {
        const botStatus = document.getElementById('bot-status');
        if (botStatus) {
          botStatus.textContent = 'Invalid bot token format. Please provide a valid Discord bot token.';
        }
        return;
      }

      const checkedModules = [...form.querySelectorAll('input[name="modules"]:checked')].map((checkbox) => checkbox.value);
      const modules = Object.fromEntries(BOT_MODULES.map((moduleName) => [moduleName, checkedModules.includes(moduleName)]));

      try {
        await botRequest('POST', '/api/bots', {
          userId: user.id,
          name: 'Discord Bot',
          token,
          modules,
          githubRepo,
        });
        form.reset();
        await renderAuthState();
        const botStatus = document.getElementById('bot-status');
        if (botStatus) {
          botStatus.textContent = 'Bot hosted successfully to your account.';
        }
        updateModuleDisplay();
      } catch (error) {
        const botStatus = document.getElementById('bot-status');
        if (botStatus) {
          botStatus.textContent = error.message;
        }
      }
    }

    async function handleDeleteBot(event) {
      const session = getSession();
      const user = session ? {
        id: session.id,
        username: session.username,
        email: session.email,
        avatar: session.avatar,
        googleAuth: Boolean(session.googleAuth),
      } : null;
      const button = event.target.closest('[data-delete-bot]');
      if (!button || !user) return;

      const botId = button.getAttribute('data-delete-bot');
      try {
        await botRequest('DELETE', `/api/bots/${user.id}/${botId}`);
        await renderAuthState();
      } catch (error) {
        const botStatus = document.getElementById('bot-status');
        if (botStatus) {
          botStatus.textContent = error.message;
        }
      }
    }

    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const createBotForm = document.getElementById('create-bot-form');
    const logoutButton = document.getElementById('logout-button');
    const botList = document.getElementById('bot-list');
    const botSignupForm = document.getElementById('bot-signup-form');
    const botLoginForm = document.getElementById('bot-login-form');
    const botCreateForm = document.getElementById('create-bot-form');
    const botLogoutButton = document.getElementById('bot-logout-button');
    const botPageBotList = document.getElementById('bot-list');

    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (botSignupForm) botSignupForm.addEventListener('submit', handleSignup);
    if (botLoginForm) botLoginForm.addEventListener('submit', handleLogin);
    if (createBotForm) {
      createBotForm.addEventListener('submit', handleCreateBot);
      const botTokenInput = createBotForm.querySelector('input[name="botToken"]');
      if (botTokenInput) {
        botTokenInput.addEventListener('input', updateModuleDisplay);
        botTokenInput.addEventListener('change', updateModuleDisplay);
      }
    }
    if (botCreateForm) {
      botCreateForm.addEventListener('submit', handleCreateBot);
      const botTokenInput = botCreateForm.querySelector('input[name="botToken"]');
      if (botTokenInput) {
        botTokenInput.addEventListener('input', updateModuleDisplay);
        botTokenInput.addEventListener('change', updateModuleDisplay);
      }
    }
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (botLogoutButton) botLogoutButton.addEventListener('click', handleLogout);

    // Hide logout button for non-signed-in users
    function updateLogoutButtonVisibility() {
      const session = getSession();
      if (logoutButton) {
        logoutButton.style.display = session ? 'block' : 'none';
      }
      if (botLogoutButton) {
        botLogoutButton.style.display = session ? 'block' : 'none';
      }
    }
    updateLogoutButtonVisibility();
    if (botList) botList.addEventListener('click', handleDeleteBot);
    if (botPageBotList) botPageBotList.addEventListener('click', handleDeleteBot);

    const googleButton = document.getElementById('google-signin-button');
    const profileGoogleButton = document.getElementById('profile-google-signin-button');
    const botGoogleButton = document.getElementById('bot-google-signin-button');
    const enableGoogleButton = (targetButton) => {
      if (!targetButton) return;
      targetButton.innerHTML = '';

      const initializeGoogle = async () => {
        try {
          const config = await apiFetch('/api/config');
          const clientId = config.googleClientId || '';
          if (!clientId) {
            targetButton.innerHTML = '<div class="status-text">Google sign-in is not configured yet. Add your client ID to .env.</div>';
            return;
          }

          const render = () => {
            const googleApi = window.google?.accounts?.id;
            if (!googleApi) {
              setTimeout(render, 250);
              return;
            }

            googleApi.initialize({
              client_id: clientId,
              callback: async (response) => {
                try {
                  const result = await apiFetch('/api/auth/google', {
                    method: 'POST',
                    body: JSON.stringify({ credential: response.credential }),
                  });
                  setSession(result.user, result.token);
                  await renderAuthState();
                } catch (error) {
                  const message = document.getElementById('login-status') || document.getElementById('bot-login-status');
                  if (message) {
                    message.textContent = error.message;
                  }
                }
              },
            });

            googleApi.renderButton(targetButton, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
            });
          };

          render();
        } catch (error) {
          targetButton.innerHTML = '<div class="status-text">Google sign-in could not be loaded from the server config.</div>';
        }
      };

      initializeGoogle();
    };

    if (googleButton) enableGoogleButton(googleButton);
    if (profileGoogleButton) enableGoogleButton(profileGoogleButton);
    if (botGoogleButton) enableGoogleButton(botGoogleButton);

    renderAuthState();
  }
});
