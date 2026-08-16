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

async function sendWebsiteStatus(status, message = '') {
  if (currentStatusState === status && statusMessageId) {
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
    const message = online ? 'The website is online.' : 'The website is offline.';
    sendWebsiteStatus(status, message);
  }

  sendHeartbeat();
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
});
