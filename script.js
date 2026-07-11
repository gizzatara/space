/* ==========================================================================
   script.js — Interactive Experiences, Particle Engines, & TargetCursor
   ========================================================================== */

(function initPortfolio() {

  // ========================================================================
  // ── 1. TARGET CURSOR (TargetCursor) ─────────────────────────────────────
  // ========================================================================
  const targetCursor = document.getElementById('target-cursor');
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const cursorPos = { x: mouse.x, y: mouse.y };
  const LERP_FACTOR = 0.15; // Smooth lag

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Track hovers globally using event delegation
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    // Check if element or any parent is a target
    const isTarget = target.classList.contains('cursor-target') || 
                     target.closest('.cursor-target') ||
                     target.tagName === 'A' || 
                     target.tagName === 'BUTTON';
                     
    if (isTarget && targetCursor) {
      targetCursor.classList.add('cursor-hovered');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    const isTarget = target.classList.contains('cursor-target') || 
                     target.closest('.cursor-target') ||
                     target.tagName === 'A' || 
                     target.tagName === 'BUTTON';
                     
    if (isTarget && targetCursor) {
      targetCursor.classList.remove('cursor-hovered');
    }
  });

  // Update cursor position with lerp
  function updateCursor() {
    cursorPos.x += (mouse.x - cursorPos.x) * LERP_FACTOR;
    cursorPos.y += (mouse.y - cursorPos.y) * LERP_FACTOR;
    
    if (targetCursor) {
      targetCursor.style.left = `${cursorPos.x}px`;
      targetCursor.style.top = `${cursorPos.y}px`;
    }
    requestAnimationFrame(updateCursor);
  }
  updateCursor();


  // ========================================================================
  // ── 2. CRT MODE TOGGLE ──────────────────────────────────────────────────
  // ========================================================================
  const crtToggle = document.getElementById('crt-toggle');
  
  if (crtToggle) {
    crtToggle.addEventListener('click', () => {
      document.body.classList.toggle('crt-active');
      const isActive = document.body.classList.contains('crt-active');
      crtToggle.textContent = isActive ? 'CRT: ON' : 'CRT: OFF';
    });
  }


  // ========================================================================
  // ── 3. TEXTTYPE ANIMATION (Custom Typing Effect) ────────────────────────
  // ========================================================================
  const typeTextElement = document.getElementById('hero-type-text');
  
  // Sentences to loop through
  const texts = [
    "dari kurasi pameran seni.",
    "visual branding, hingga eksperimen web.",
    "membangun ruang imersif & teknologi visual."
  ];
  
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  
  // Configurable parameters like React Bits props
  const typingSpeed = 70;
  const deletingSpeed = 40;
  const pauseDuration = 1800;

  function typeCycle() {
    if (!typeTextElement) return;

    const currentText = texts[textIndex];
    
    if (isDeleting) {
      // Removing characters
      typeTextElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      // Typing characters
      typeTextElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentText.length) {
      // Pause at full word
      delay = pauseDuration;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      // Go to next text
      textIndex = (textIndex + 1) % texts.length;
      delay = 500; // Small delay before typing next word
    }

    setTimeout(typeCycle, delay);
  }
  
  // Start the typing animation after page load
  setTimeout(typeCycle, 1000);


  // ========================================================================
  // ── 4. GLOBAL BACKGROUND CANVAS (Constellation Grid & Lightning Storm) ──
  // ========================================================================
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    let W, H;
    let particles = [];
    const PARTICLE_COUNT = 45;
    const MAX_DIST = 120; // Connecting distance

    // Background Lightning system (Purple - Hue 260)
    let bgLightningStrikes = [];
    let bgFlashOpacity = 0;

    function resizeBg() {
      W = bgCanvas.width = window.innerWidth;
      H = bgCanvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off bounds
        if (this.x < 0 || this.x > W) this.vx *= -1;
        if (this.y < 0 || this.y > H) this.vy *= -1;
      }
      draw() {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.4)'; // Retro Phosphor Green particle grid
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function spawnBgLightning() {
      if (Math.random() < 0.0035) { // Occasional global background lightning
        bgFlashOpacity = 0.25; // Faint screen flash
        
        const startX = Math.random() * W;
        let lx = startX;
        let ly = 0;
        const path = [{ x: lx, y: ly }];
        
        while (ly < H) {
          ly += Math.random() * 50 + 35;
          lx += (Math.random() - 0.5) * 60;
          path.push({ x: lx, y: ly });
          
          // Faint branch
          if (Math.random() < 0.15 && ly < H - 150) {
            let bx = lx;
            let by = ly;
            const bPath = [{ x: bx, y: by }];
            while (by < H && bPath.length < 5) {
              by += Math.random() * 25 + 15;
              bx += (Math.random() - 0.35) * 35;
              bPath.push({ x: bx, y: by });
            }
            bgLightningStrikes.push({
              path: bPath,
              opacity: 0.7,
              width: Math.random() * 2 + 1
            });
          }
        }
        
        bgLightningStrikes.push({
          path: path,
          opacity: 0.8,
          width: Math.random() * 4 + 2
        });
      }
    }

    function drawBgLightning() {
      spawnBgLightning();

      if (bgFlashOpacity > 0) {
        ctx.fillStyle = `rgba(139, 92, 246, ${bgFlashOpacity})`;
        ctx.fillRect(0, 0, W, H);
        bgFlashOpacity -= 0.02;
      }

      bgLightningStrikes.forEach((strike) => {
        ctx.save();
        ctx.strokeStyle = `hsla(260, 100%, 75%, ${strike.opacity})`;
        ctx.lineWidth = strike.width;
        
        const isCrt = document.body.classList.contains('crt-active');
        if (!isCrt) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = `hsla(260, 100%, 50%, ${strike.opacity})`;
        }
        
        ctx.beginPath();
        strike.path.forEach((pt, pIdx) => {
          if (pIdx === 0) ctx.moveTo(pt.x, pt.y);
          else {
            const prev = strike.path[pIdx - 1];
            const midX = prev.x + (pt.x - prev.x) / 2;
            ctx.lineTo(midX, prev.y);
            ctx.lineTo(midX, pt.y);
            ctx.lineTo(pt.x, pt.y);
          }
        });
        ctx.stroke();
        ctx.restore();

        strike.opacity -= 0.04;
      });

      bgLightningStrikes = bgLightningStrikes.filter(s => s.opacity > 0);
    }

    function initHeroParticles() {
      resizeBg();
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    }

    function drawHeroNetwork() {
      // Draw background space color
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0c0c10');
      grad.addColorStop(1, '#14141c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      
      // Draw Lightning Storm
      drawBgLightning();
      
      // Update and draw nodes
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.15;
            ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Brighter links to mouse cursor
      particles.forEach(p => {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_DIST * 1.5) {
          const alpha = (1 - dist / (MAX_DIST * 1.5)) * 0.25;
          ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`; // Glowing red/pink near cursor
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      });

      requestAnimationFrame(drawHeroNetwork);
    }

    window.addEventListener('resize', resizeBg);
    initHeroParticles();
    drawHeroNetwork();
  }


  // ========================================================================
  // ── 5. ARCADE PLAYGROUND (Eroding Asteroid Boss Mini-Game) ──────────────
  // ========================================================================
  const gameCanvas = document.getElementById('playground-canvas');
  if (gameCanvas) {
    const ctx = gameCanvas.getContext('2d');
    let W, H;
    let score = 0;
    
    // Plane tracking (Free flight, moves towards pointer, locks on to center)
    const plane = {
      x: 0,
      y: 0,
      angle: 0,
      width: 32,
      height: 24,
      speed: 4.5 // Constant speed towards cursor
    };

    // Asteroid (Idle in center, floating, deforming, & regenerating)
    const asteroid = {
      x: 0,
      y: 0,
      baseRadius: 80,
      angle: 0,
      rotSpeed: 0.005,
      hp: 100,
      maxHp: 100,
      shakeX: 0,
      shakeY: 0,
      floatOffset: 0,
      color: '#5c4033', // Default brown, will be random hsl on init/respawn
      fillColor: '#302018',
      points: [] // Holds points defining the deforming outline
    };

    // Arrays
    let lasers = [];
    let particles = []; // Smoke, Sparks, Explosion Chunks, Muzzle Flashes
    
    // Pointer coordinates (mouse/touch target)
    const pointer = { x: 0, y: 0 };
    let lastShotTime = 0;

    // Track mouse & touch coordinates relative to canvas
    function updatePointerPos(clientX, clientY) {
      const rect = gameCanvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
    }

    gameCanvas.addEventListener('mousemove', (e) => {
      updatePointerPos(e.clientX, e.clientY);
    });

    gameCanvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        updatePointerPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    gameCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        updatePointerPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // Lightning system (Purple - Hue 260, behind asteroid game)
    let lightningStrikes = [];
    let flashOpacity = 0;

    function spawnLightning() {
      if (Math.random() < 0.008) {
        flashOpacity = 0.35;
        const startX = Math.random() * W;
        let x = startX;
        let y = 0;
        const path = [{ x, y }];
        while (y < H) {
          y += Math.random() * 30 + 20;
          x += (Math.random() - 0.5) * 45;
          path.push({ x, y });
        }
        lightningStrikes.push({
          path: path,
          opacity: 1.0,
          width: Math.random() * 3 + 2
        });
      }
    }

    function updateAndDrawLightning() {
      spawnLightning();
      if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(139, 92, 246, ${flashOpacity})`;
        ctx.fillRect(0, 0, W, H);
        flashOpacity -= 0.03;
      }
      lightningStrikes.forEach((strike) => {
        ctx.save();
        ctx.strokeStyle = `hsla(260, 100%, 75%, ${strike.opacity})`;
        ctx.lineWidth = strike.width;
        ctx.beginPath();
        strike.path.forEach((pt, pIdx) => {
          if (pIdx === 0) ctx.moveTo(pt.x, pt.y);
          else {
            const prev = strike.path[pIdx - 1];
            const midX = prev.x + (pt.x - prev.x) / 2;
            ctx.lineTo(midX, prev.y);
            ctx.lineTo(midX, pt.y);
            ctx.lineTo(pt.x, pt.y);
          }
        });
        ctx.stroke();
        ctx.restore();
        strike.opacity -= 0.06;
      });
      lightningStrikes = lightningStrikes.filter(s => s.opacity > 0);
    }

    const scoreDisplay = document.getElementById('game-score');
    const targetsDisplay = document.getElementById('game-targets'); // Now showing Asteroid HP%

    // Curated retro neon color themes for the asteroid boss
    const asteroidThemes = [
      { outline: '#4ade80', fill: '#06200f' }, // Phosphor Green
      { outline: '#f43f5e', fill: '#250910' }, // Retro Hot Pink
      { outline: '#38bdf8', fill: '#041c2c' }, // Cyber Cyan
      { outline: '#facc15', fill: '#221802' }, // Arcade Gold
      { outline: '#a855f7', fill: '#1a082c' }, // Toxic Violet Purple
      { outline: '#f97316', fill: '#280e03' }  // Volcanic Lava Orange
    ];
    let currentThemeIdx = -1;

    // Setup/reset asteroid points (Picks curated theme on init/respawn)
    function initAsteroid() {
      asteroid.x = W / 2;
      asteroid.y = H / 2;
      asteroid.hp = 100;
      asteroid.points = [];
      
      // Select a new theme different from the current one
      let nextThemeIdx;
      do {
        nextThemeIdx = Math.floor(Math.random() * asteroidThemes.length);
      } while (nextThemeIdx === currentThemeIdx);
      currentThemeIdx = nextThemeIdx;

      const theme = asteroidThemes[currentThemeIdx];
      asteroid.color = theme.outline;
      asteroid.fillColor = theme.fill;
      
      const numPoints = 32; // Higher density for granular erosion
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints;
        const initialR = asteroid.baseRadius + (Math.random() - 0.5) * 16;
        asteroid.points.push({
          angle: angle,
          r: initialR,
          baseR: initialR
        });
      }
      if (targetsDisplay) targetsDisplay.textContent = '100%';
    }

    function resizeGame() {
      W = gameCanvas.width = gameCanvas.offsetWidth;
      H = gameCanvas.height = gameCanvas.offsetHeight;
      
      initAsteroid();
      
      // Start plane & pointer at distance from asteroid
      plane.x = W / 2 - 180;
      plane.y = H / 2;
      pointer.x = plane.x;
      pointer.y = plane.y;
    }

    function updateGameLogic() {
      // 1. Plane Movement (Auto-move towards pointer coordinate)
      const adx = pointer.x - plane.x;
      const ady = pointer.y - plane.y;
      const distToPointer = Math.sqrt(adx * adx + ady * ady);

      if (distToPointer > 6) {
        plane.x += (adx / distToPointer) * plane.speed;
        plane.y += (ady / distToPointer) * plane.speed;
      }

      // Target Lock-On: Plane automatically faces the center of the asteroid
      const floatY = Math.sin(asteroid.floatOffset) * 8;
      const targetAngle = Math.atan2((asteroid.y + floatY) - plane.y, asteroid.x - plane.x);
      plane.angle = targetAngle;

      // Engine smoke trail (procedural particles flowing backwards)
      if (Math.random() < 0.35) {
        const angle = plane.angle;
        particles.push({
          x: plane.x - Math.cos(angle) * 18,
          y: plane.y - Math.sin(angle) * 18,
          vx: -Math.cos(angle) * 2 + (Math.random() - 0.5) * 0.5,
          vy: -Math.sin(angle) * 2 + (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 2,
          color: 'rgba(244, 63, 94, 0.6)', // pink retro smoke
          opacity: 1,
          decay: 0.025,
          type: 'smoke'
        });
      }

      // 2. Asteroid Floating, Shaking, & INCREASED REGENERATION Update
      asteroid.floatOffset += 0.025;
      asteroid.angle += asteroid.rotSpeed;
      
      // Decay shake
      asteroid.shakeX *= 0.82;
      asteroid.shakeY *= 0.82;

      // Asteroid Regeneration (Slowly grow back outlines - Balanced at 0.025 per frame)
      asteroid.points.forEach(p => {
        if (p.r < p.baseR) {
          p.r = Math.min(p.baseR, p.r + 0.025); 
        }
      });

      // 3. Auto-Shooting (continuous at shotInterval)
      let currentTime = Date.now();
      const shotInterval = 185; // Automatic shoot speed
      if (currentTime - lastShotTime > shotInterval) {
        lastShotTime = currentTime;
        
        const angle = plane.angle;
        const wingDist = 14;

        // Double wing lasers
        const lX1 = plane.x + Math.cos(angle) * 16 - Math.sin(angle) * wingDist;
        const lY1 = plane.y + Math.sin(angle) * 16 + Math.cos(angle) * wingDist;
        const lX2 = plane.x + Math.cos(angle) * 16 - Math.sin(angle) * -wingDist;
        const lY2 = plane.y + Math.sin(angle) * 16 + Math.cos(angle) * -wingDist;

        lasers.push({
          x: lX1,
          y: lY1,
          vx: Math.cos(angle) * 11,
          vy: Math.sin(angle) * 11,
          size: 5,
          color: '#facc15'
        });

        lasers.push({
          x: lX2,
          y: lY2,
          vx: Math.cos(angle) * 11,
          vy: Math.sin(angle) * 11,
          size: 5,
          color: '#facc15'
        });

        // Add Muzzle Flash Particle effect on guns
        particles.push({
          x: lX1, y: lY1, vx: (Math.random()-0.5)*1, vy: (Math.random()-0.5)*1, size: 8, opacity: 1, decay: 0.15, type: 'flash', color: '#ff007f'
        });
        particles.push({
          x: lX2, y: lY2, vx: (Math.random()-0.5)*1, vy: (Math.random()-0.5)*1, size: 8, opacity: 1, decay: 0.15, type: 'flash', color: '#ff007f'
        });
      }

      // 4. Update Lasers & Detect Asteroid Erosion Collision
      const currentAsteroidY = asteroid.y + floatY;
      
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.x += l.vx;
        l.y += l.vy;

        // Remove if off bounds
        if (l.x < 0 || l.x > W || l.y < 0 || l.y > H) {
          lasers.splice(i, 1);
          continue;
        }

        // Calculate distance and angle relative to Asteroid center
        const adx = l.x - asteroid.x;
        const ady = l.y - currentAsteroidY;
        const dist = Math.sqrt(adx * adx + ady * ady);
        
        // Find angle of impact
        let impactAngle = Math.atan2(ady, adx) - asteroid.angle;
        while (impactAngle < 0) impactAngle += Math.PI * 2;
        while (impactAngle >= Math.PI * 2) impactAngle -= Math.PI * 2;

        // Check if collision with deforming outline radius
        const pointIndex = Math.round((impactAngle / (Math.PI * 2)) * asteroid.points.length) % asteroid.points.length;
        const currentRadius = asteroid.points[pointIndex].r;

        if (dist <= currentRadius + l.size) {
          // HIT! Remove laser
          lasers.splice(i, 1);

          // ERODE (KIKIS) - Reduce radius of points around the impact site
          const impactStrength = 6.5; // depth of erosion
          const spread = 2; // how many neighboring points are chipped
          
          for (let offset = -spread; offset <= spread; offset++) {
            const index = (pointIndex + offset + asteroid.points.length) % asteroid.points.length;
            const factor = 1 - Math.abs(offset) / (spread + 1); // decrease erosion at edges
            asteroid.points[index].r = Math.max(12, asteroid.points[index].r - (impactStrength * factor));
          }

          // Shaking impact effect
          asteroid.shakeX = -Math.cos(impactAngle + asteroid.angle) * 5;
          asteroid.shakeY = -Math.sin(impactAngle + asteroid.angle) * 5;
          
          // Flash outline briefly
          asteroid.flash = 6;

          // Spawn Chipped Rock fragments flying outwards (Erosion Animation with Generative Colors!)
          const angleOut = impactAngle + asteroid.angle;
          for (let k = 0; k < 6; k++) {
            particles.push({
              x: l.x,
              y: l.y,
              vx: Math.cos(angleOut + (Math.random() - 0.5) * 1.2) * (Math.random() * 4 + 2),
              vy: Math.sin(angleOut + (Math.random() - 0.5) * 1.2) * (Math.random() * 4 + 2),
              size: Math.random() * 3 + 2,
              color: Math.random() > 0.5 ? asteroid.color : '#facc15', // brown chunks or glowing sparks
              opacity: 1,
              decay: 0.04,
              type: 'rock'
            });
          }

          break;
        }
      }

      // Calculate remaining average radius to determine HP %
      const avgRadius = asteroid.points.reduce((sum, p) => sum + p.r, 0) / asteroid.points.length;
      const hpPercentage = Math.max(0, Math.round(((avgRadius - 12) / (asteroid.baseRadius - 12)) * 100));
      asteroid.hp = hpPercentage;
      if (targetsDisplay) targetsDisplay.textContent = `${asteroid.hp}%`;

      // Check if asteroid is fully eroded (HP/Size goes below 10%)
      if (asteroid.hp <= 10) {
        // Massive asteroid destruction!
        score += 100;
        if (scoreDisplay) scoreDisplay.textContent = score;

        // Shower of 30+ giant debris chunks (using generative asteroid color)
        for (let k = 0; k < 35; k++) {
          const expAngle = Math.random() * Math.PI * 2;
          const expSpeed = Math.random() * 7 + 3;
          particles.push({
            x: asteroid.x,
            y: currentAsteroidY,
            vx: Math.cos(expAngle) * expSpeed,
            vy: Math.sin(expAngle) * expSpeed,
            size: Math.random() * 7 + 3,
            color: Math.random() > 0.6 ? '#facc15' : asteroid.color, 
            opacity: 1,
            decay: 0.02,
            type: 'explosion'
          });
        }

        // Spawn screen flash
        flashOpacity = 0.5;

        // Re-spawn a new asteroid with a brand-new generative color!
        initAsteroid();
      }

      // 5. Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.decay;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
        }
      }
    }

    function drawGame() {
      // Clear with deep space black
      ctx.fillStyle = '#040308';
      ctx.fillRect(0, 0, W, H);

      const isCrt = document.body.classList.contains('crt-active');

      // Draw faint background grid
      ctx.strokeStyle = 'rgba(180, 151, 207, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Draw Lightning Background (Hue 260)
      updateAndDrawLightning();

      // Draw Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        
        if (p.type === 'smoke') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'flash') {
          // Muzzle flash: expanding pixel cross
          ctx.fillRect(p.x - p.size/2, p.y - 1, p.size, 2);
          ctx.fillRect(p.x - 1, p.y - p.size/2, 2, p.size);
        } else {
          // Rock fragments & explosions
          ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        ctx.restore();
      });

      // Draw Eroding Asteroid (animated floating, rotation, & deforming outline with generative colors)
      ctx.save();
      const floatY = Math.sin(asteroid.floatOffset) * 8;
      ctx.translate(asteroid.x + asteroid.shakeX, asteroid.y + floatY + asteroid.shakeY);
      ctx.rotate(asteroid.angle);

      // Glow setting (generates glow from HSL color)
      if (!isCrt) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = asteroid.color;
      }

      ctx.strokeStyle = asteroid.flash > 0 ? '#ffffff' : asteroid.color; // Flashing outline
      ctx.lineWidth = 3.5;
      ctx.fillStyle = asteroid.fillColor; // Generative dark core

      // Draw the deformed outline points (procedural polygon)
      ctx.beginPath();
      asteroid.points.forEach((p, idx) => {
        const ptX = Math.cos(p.angle) * p.r;
        const ptY = Math.sin(p.angle) * p.r;
        if (idx === 0) ctx.moveTo(ptX, ptY);
        else ctx.lineTo(ptX, ptY);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw inner pixelated details (craters / rock shading)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // Dark shadow block
      ctx.fillRect(-20, -10, 35, 25);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; // Light crater highlight
      ctx.fillRect(15, -25, 20, 15);
      ctx.fillRect(-30, 20, 15, 12);

      // Decreasing health indicates inner molten core glow!
      if (asteroid.hp < 70) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)'; // Orange core glow showing through cracks
        ctx.fillRect(-10, -15, 20, 20);
      }
      if (asteroid.hp < 40) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.6)'; // Red molten heat
        ctx.fillRect(-15, 5, 25, 10);
        ctx.fillRect(5, -20, 10, 10);
      }

      ctx.restore();

      // Draw Lasers
      lasers.forEach(l => {
        ctx.save();
        if (!isCrt) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = l.color;
        }
        ctx.fillStyle = l.color;
        ctx.fillRect(l.x - l.size/2, l.y - l.size/2, l.size, l.size);
        ctx.restore();
      });

      // Draw Cyber Biplane (facing the center asteroid)
      ctx.save();
      ctx.translate(plane.x, plane.y);
      ctx.rotate(plane.angle);

      // Glow setting
      if (!isCrt) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f43f5e';
      }

      // Fuselage (Retro Pink/Red wireframe)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(6, 5, 10, 0.8)';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-14, -8);
      ctx.lineTo(-20, -5);
      ctx.lineTo(-20, 5);
      ctx.lineTo(-14, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tail Wings (Dark Pink/Red)
      ctx.strokeStyle = '#ba1e3b';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-26, -10);
      ctx.lineTo(-22, -10);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-22, 10);
      ctx.lineTo(-26, 10);
      ctx.closePath();
      ctx.stroke();

      // Main Wings (Arcade Yellow)
      ctx.strokeStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-2, -32);
      ctx.lineTo(4, -32);
      ctx.lineTo(4, 32);
      ctx.lineTo(-2, 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit dome (Cyber Cyan)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(2, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Propeller Hub
      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(18, -2, 3, 4);

      // Propeller blades rotating line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const pLen = 15;
      const pAngle = (Date.now() / 30) % (Math.PI * 2);
      ctx.moveTo(21 - Math.sin(pAngle) * pLen, -Math.cos(pAngle) * pLen);
      ctx.lineTo(21 + Math.sin(pAngle) * pLen, Math.cos(pAngle) * pLen);
      ctx.stroke();

      ctx.restore();
    }

    function gameLoop() {
      updateGameLogic();
      drawGame();
      requestAnimationFrame(gameLoop);
    }

    // Initialize Game
    window.addEventListener('resize', resizeGame);
    resizeGame();
    gameLoop();
  }

})();
