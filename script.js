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
  let pointerActive = false;

  canvas.width = width;
  canvas.height = height;

  const nodeCount = 18;
  const connectionRange = 100;
  const nodes = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      phase: Math.random() * Math.PI * 2,
      drift: 0.4 + Math.random() * 0.8,
      radius: 1.6 + Math.random() * 2.3,
    });
  }

  const drawNode = (node) => {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(216, 180, 254, 0.9)';
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const updateNodes = (time) => {
    for (const node of nodes) {
      const driftX = Math.sin(time * 0.0005 * node.drift + node.phase) * 0.9;
      const driftY = Math.cos(time * 0.0006 * node.drift + node.phase) * 0.9;

      if (!pointerActive) {
        node.vx += (node.baseX + driftX * 30 - node.x) * 0.02;
        node.vy += (node.baseY + driftY * 30 - node.y) * 0.02;
        node.vx *= 0.87;
        node.vy *= 0.87;
        node.x += node.vx;
        node.y += node.vy;
        continue;
      }

      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const distance = Math.hypot(dx, dy) || 1;
      const repulseDist = 150;

      if (distance < repulseDist) {
        const force = (1 - distance / repulseDist) * 1.8;
        const angle = Math.atan2(dy, dx);
        node.vx -= Math.cos(angle) * force * 8;
        node.vy -= Math.sin(angle) * force * 8;
      }

      node.vx += (node.baseX + driftX * 30 - node.x) * 0.015;
      node.vy += (node.baseY + driftY * 30 - node.y) * 0.015;
      node.x += node.vx + driftX;
      node.y += node.vy + driftY;
      node.vx *= 0.84;
      node.vy *= 0.84;
    }
  };

  const drawConnections = () => {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      let connected = false;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);

        if (distance < connectionRange) {
          const alpha = (1 - distance / connectionRange) * 0.8;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          connected = true;
        }
      }

      if (connected) {
        drawNode(a);
      }
    }
  };

  const animate = (time) => {
    ctx.clearRect(0, 0, width, height);
    updateNodes(time);
    drawConnections();
    requestAnimationFrame(animate);
  };

  const handlePointerMove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    pointerActive = true;
  };

  document.addEventListener('mousemove', handlePointerMove);
  document.addEventListener('pointermove', handlePointerMove);

  document.addEventListener('mouseleave', () => {
    pointerActive = false;
    mouseX = width / 2;
    mouseY = height / 2;
  });

  document.addEventListener('pointerleave', () => {
    pointerActive = false;
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

    for (const node of nodes) {
      node.baseX = Math.random() * width;
      node.baseY = Math.random() * height;
      node.x = node.baseX;
      node.y = node.baseY;
      node.vx = 0;
      node.vy = 0;
    }
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
