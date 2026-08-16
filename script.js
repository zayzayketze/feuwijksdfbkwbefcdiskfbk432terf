// Interactive Cursor Background Effect
const createCursorEffect = () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-lines';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');

  let width = window.innerWidth;
  let height = window.innerHeight;
  let mouseX = width / 2;
  let mouseY = height / 2;

  canvas.width = width;
  canvas.height = height;

  const horizontal = [];
  const vertical = [];
  const spacing = 42;

  for (let y = -spacing; y < height + spacing; y += spacing) {
    horizontal.push({
      baseY: y,
      y: y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.45,
      amp: 8 + Math.random() * 12,
    });
  }

  for (let x = -spacing; x < width + spacing; x += spacing) {
    vertical.push({
      baseX: x,
      x: x,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.45,
      amp: 8 + Math.random() * 12,
    });
  }

  const drawLines = (time) => {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(196, 181, 253, 0.18)';

    for (const line of horizontal) {
      const drift = Math.sin(time * 0.0007 * line.speed + line.phase) * line.amp;
      const dy = Math.abs(mouseY - (line.baseY + drift));
      let y = line.baseY + drift;

      if (dy < 150) {
        const push = (1 - dy / 150) * 26;
        y += mouseY < y ? -push : push;
      }

      line.y += (y - line.y) * 0.1;

      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const wave = Math.sin((x * 0.04) + time * 0.001 + line.phase) * 4;
        const px = x;
        const py = line.y + wave;

        if (x === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(167, 139, 250, 0.14)';

    for (const line of vertical) {
      const drift = Math.sin(time * 0.0007 * line.speed + line.phase) * line.amp;
      const dx = Math.abs(mouseX - (line.baseX + drift));
      let x = line.baseX + drift;

      if (dx < 150) {
        const push = (1 - dx / 150) * 26;
        x += mouseX < x ? -push : push;
      }

      line.x += (x - line.x) * 0.1;

      ctx.beginPath();
      for (let y = 0; y <= height; y += 10) {
        const wave = Math.sin((y * 0.04) + time * 0.001 + line.phase) * 4;
        const px = line.x + wave;
        const py = y;

        if (y === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
  };

  const animate = (time) => {
    mouseX += (window.innerWidth * 0.5 - mouseX) * 0.01;
    mouseY += (window.innerHeight * 0.5 - mouseY) * 0.01;

    drawLines(time);
    requestAnimationFrame(animate);
  };

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouseX = width / 2;
    mouseY = height / 2;
  });

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    mouseX = width / 2;
    mouseY = height / 2;
  });

  requestAnimationFrame(animate);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createCursorEffect);
} else {
  createCursorEffect();
}

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
});
