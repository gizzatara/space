/* ===================================================
   script.js — Retro Pixel Art Portfolio Gizzatara
   Zero dependencies. Native browser APIs only.
   =================================================== */

// ── 1. RETRO HERO CANVAS — Starfield & Interactive Pixel Biplane ─────────────
(function initRetroHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let stars = [];
  let bullets = [];
  const STAR_COUNT = 80;
  
  // Plane state
  const plane = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 0.04, // follow speed
  };

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    if (stars.length === 0) {
      stars = Array.from({ length: STAR_COUNT }, () => mkStar(true));
      // Start plane in center
      plane.x = plane.targetX = W / 2;
      plane.y = plane.targetY = H / 2;
    }
  }

  function mkStar(randomY = false) {
    return {
      x: Math.random() * W,
      y: randomY ? Math.random() * H : 0,
      size: Math.floor(Math.random() * 3) + 1, // 1 to 3 pixel block
      speed: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.5 ? '#4ade80' : '#38bdf8' // Green or Cyan
    };
  }

  // Handle click to shoot!
  canvas.addEventListener('click', () => {
    // Shoot double pixel bullets from wing positions
    const angle = plane.angle;
    const wingOffset = 18;
    
    // Left wing bullet
    bullets.push({
      x: plane.x + Math.cos(angle) * 15 - Math.sin(angle) * wingOffset,
      y: plane.y + Math.sin(angle) * 15 + Math.cos(angle) * wingOffset,
      vx: Math.cos(angle) * 8,
      vy: Math.sin(angle) * 8,
      size: 4
    });
    
    // Right wing bullet
    bullets.push({
      x: plane.x + Math.cos(angle) * 15 - Math.sin(angle) * -wingOffset,
      y: plane.y + Math.sin(angle) * 15 + Math.cos(angle) * -wingOffset,
      vx: Math.cos(angle) * 8,
      vy: Math.sin(angle) * 8,
      size: 4
    });
  });

  function updateAndDraw() {
    ctx.clearRect(0, 0, W, H);

    // Deep space black color
    ctx.fillStyle = '#0c0c10';
    ctx.fillRect(0, 0, W, H);

    // 1. Draw stars (pixel blocks moving down)
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > H) {
        Object.assign(s, mkStar(false));
      }
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size * 2, s.size * 2);
    }

    // 2. Update plane position (lerp toward target)
    const dx = plane.targetX - plane.x;
    const dy = plane.targetY - plane.y;
    
    plane.x += dx * plane.speed;
    plane.y += dy * plane.speed;
    
    // Calculate angle towards target (with simple dampening)
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      const targetAngle = Math.atan2(dy, dx);
      // Smooth angle interpolation
      let angleDiff = targetAngle - plane.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      plane.angle += angleDiff * 0.1;
    }

    // 3. Draw Bullets
    ctx.fillStyle = '#facc15'; // Yellow laser bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      
      // Remove offscreen bullets
      if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
        bullets.splice(i, 1);
        continue;
      }
      
      // Draw pixel bullet
      ctx.fillRect(Math.floor(b.x - b.size/2), Math.floor(b.y - b.size/2), b.size, b.size);
    }

    // 4. Draw Retro Biplane (Pixel Art)
    ctx.save();
    ctx.translate(Math.floor(plane.x), Math.floor(plane.y));
    ctx.rotate(plane.angle);

    // Main fuselage (Red retro plane)
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-16, -6, 32, 12);
    
    // Tail wings
    ctx.fillStyle = '#ba1e3b';
    ctx.fillRect(-22, -10, 6, 20);
    ctx.fillRect(-24, -3, 4, 6);

    // Main wings (Arcade yellow)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-4, -30, 8, 60);

    // Cockpit windshield (Cyan)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, -4, 6, 8);

    // Nose cone / propeller hub
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(16, -3, 4, 6);

    // Propeller (rotating lines)
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const propLen = 16;
    const propAngle = (Date.now() / 40) % (Math.PI * 2);
    ctx.moveTo(20 - Math.sin(propAngle) * propLen, -Math.cos(propAngle) * propLen);
    ctx.lineTo(20 + Math.sin(propAngle) * propLen, Math.cos(propAngle) * propLen);
    ctx.stroke();

    ctx.restore();

    requestAnimationFrame(updateAndDraw);
  }

  window.addEventListener('resize', resize);
  
  // Follow cursor or track touch
  window.addEventListener('mousemove', e => {
    plane.targetX = e.clientX;
    plane.targetY = e.clientY;
  });

  window.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      plane.targetX = e.touches[0].clientX;
      plane.targetY = e.touches[0].clientY;
    }
  }, { passive: true });

  resize();
  updateAndDraw();
})();


// ── 2. SCROLL REVEAL ─────────────────────────────────────────────────────────
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // Retro stepped/staggered appearance
        const siblings = [...e.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
        const delay = siblings.indexOf(e.target) * 80;
        setTimeout(() => e.target.classList.add('visible'), delay);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
})();


// ── 3. ACTIVE NAV HIGHLIGHT on scroll ────────────────────────────────────────
(function initNavHighlight() {
  const sections = ['about', 'projects', 'contact'].map(id => document.getElementById(id));
  const links    = ['about', 'projects', 'contact'].map(id => document.getElementById('nav-' + id));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l && l.classList.remove('active'));
        const link = document.getElementById('nav-' + e.target.id);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => s && io.observe(s));
})();


// ── 4. TACTILE CLICK AUDIOS OR SOUND FX (Lazy Web Audio Synth) ───────────────
// We can synthesize a tiny retro beep when clicking links or buttons!
function playBeep(freq = 400, type = 'square', duration = 0.08) {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.15, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(actx.destination);
    
    osc.start();
    osc.stop(actx.currentTime + duration);
  } catch (e) {
    // Audio Context is blocked or not supported until interaction
  }
}

// Bind custom click sound to pixel buttons & links
document.querySelectorAll('.btn, nav a, .project-card').forEach(el => {
  el.addEventListener('click', () => {
    playBeep(300, 'square', 0.1);
  });
  el.addEventListener('mouseenter', () => {
    // Subtle short tick on hover
    playBeep(800, 'sine', 0.02);
  });
});


// ── 5. SMOOTH SCROLL for anchor links ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
