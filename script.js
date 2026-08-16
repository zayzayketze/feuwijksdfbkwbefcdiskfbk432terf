// Interactive Cursor Background Effect
const createCursorEffect = () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-lines';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  const gridSize = 34;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let mouseX = width / 2;
  let mouseY = height / 2;
  let targetX = mouseX;
  let targetY = mouseY;

  canvas.width = width;
  canvas.height = height;

  const points = [];
  const cols = Math.ceil(width / gridSize) + 2;
  const rows = Math.ceil(height / gridSize) + 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        baseX: col * gridSize,
        baseY: row * gridSize,
        x: col * gridSize,
        y: row * gridSize,
        vx: 0,
        vy: 0,
      });
    }
  }

  const drawLine = (a, b) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  const animate = () => {
    mouseX += (targetX - mouseX) * 0.12;
    mouseY += (targetY - mouseY) * 0.12;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(196, 181, 253, 0.24)';

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const dx = mouseX - point.x;
      const dy = mouseY - point.y;
      const distance = Math.hypot(dx, dy);
      const influenceRadius = 170;

      if (distance < influenceRadius) {
        const angle = Math.atan2(dy, dx);
        const force = (1 - distance / influenceRadius) * 3.2;
        point.vx += Math.cos(angle) * force * 1.6;
        point.vy += Math.sin(angle) * force * 1.6;
      }

      const springX = (point.baseX - point.x) * 0.04;
      const springY = (point.baseY - point.y) * 0.04;
      point.vx += springX;
      point.vy += springY;
      point.vx *= 0.8;
      point.vy *= 0.8;
      point.x += point.vx;
      point.y += point.vy;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const point = points[idx];

        if (col < cols - 1) {
          drawLine(point, points[idx + 1]);
        }

        if (row < rows - 1) {
          drawLine(point, points[idx + cols]);
        }
      }
    }

    requestAnimationFrame(animate);
  };

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    targetX = width / 2;
    targetY = height / 2;
  });

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    targetX = width / 2;
    targetY = height / 2;
    mouseX = targetX;
    mouseY = targetY;
  });

  animate();
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
