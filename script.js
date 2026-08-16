const SITE_LOG_WEBHOOK_URL = 'https://discord.com/api/webhooks/1538619800174202943/_-QayvNbXoAavS5YKSjYNQDXIxPqxYDeAOGCfIH8QPqBdp6jYa5wtwUCPcTA-OrphFp5';

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

function sendSiteLog(eventType, details = {}) {
  const fields = Object.entries({
    page: window.location.pathname,
    url: window.location.href,
    ...details,
  }).slice(0, 8).map(([name, value]) => ({
    name,
    value: String(value).slice(0, 1024),
  }));

  const payload = {
    username: 'VoidHaven Website Logs',
    avatar_url: 'https://cdn.discordapp.com/icons/1477464933179588880/a_a061556c7f7e320ceaf1b7c1519636a6.webp?size=1024&animated=true',
    embeds: [
      {
        title: eventType.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        description: details.message || 'Website event log',
        color: 0x7c3aed,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return postToWebhook(SITE_LOG_WEBHOOK_URL, payload);
}

window.voidHavenLog = sendSiteLog;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {});
} else {
  // background effect removed
}

document.addEventListener('DOMContentLoaded', () => {
  sendSiteLog('website_started', {
    message: 'The website loaded successfully.',
    user_agent: navigator.userAgent,
  });

  window.addEventListener('beforeunload', () => {
    sendSiteLog('website_shutdown', {
      message: 'The website was closed or the tab was closed.',
      user_agent: navigator.userAgent,
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendSiteLog('website_hidden', {
        message: 'The website page was hidden or suspended in the background.',
      });
    }
  });

  window.addEventListener('error', (event) => {
    sendSiteLog('website_crash', {
      message: event.message || 'A browser error occurred.',
      file: event.filename || 'unknown',
      line: String(event.lineno || 'unknown'),
      column: String(event.colno || 'unknown'),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    sendSiteLog('unhandled_rejection', {
      message: event.reason ? String(event.reason).slice(0, 500) : 'Unhandled promise rejection',
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href) return;

    if (!href.startsWith('http') && !href.startsWith('#')) {
      sendSiteLog('page_navigation', {
        message: 'A visitor clicked a site link.',
        target: href,
        label: target.textContent.trim() || 'site link',
      });
    }
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
});
