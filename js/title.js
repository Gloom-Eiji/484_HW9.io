/**
 * title.js
 * My Little Computer Science Amateur
 * Title screen: pixel ambient background, speech cycles, sprite swaps.
 */

'use strict';

// ============================================================
// SPEECH BUBBLE LINES
// ============================================================
const TITLE_SPEECHES = [
  "why won't it compile...",
  "it works on my machine",
  "undefined is not a function",
  "git push --force",
  "just one more commit...",
  "this is fine.",
  "stackoverflow saves lives",
  "O(n^2)? close enough",
  "deadlines are a social construct",
  "404: sleep not found",
  "i should've studied bio",
  "npm install life",
  "have you tried turning it off?",
  "segfault :(",
];

// ============================================================
// TITLE SPRITE STATES
// ============================================================
const TITLE_SPRITES = [
  'assets/sprites/EJ_idle.png',
  'assets/sprites/EJ_code.png',
  'assets/sprites/EJ_sleepy.png',
];

let speechIndex   = 0;
let spriteIndex   = 0;
let speechTimeout = null;
let spriteTimeout = null;

// ============================================================
// PIXEL AMBIENT BACKGROUND ANIMATION
// Replaces the floating emoji decorations with a canvas-based
// particle system drawing tiny pixel shapes (code symbols, dots).
// ============================================================

const PIXEL_SYMBOLS = ['0', '1', '{', '}', ';', '//', '()', '[]', '??', '!=', '&&', '++'];
const PARTICLE_COUNT = 28;

class TitleParticle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * this.canvas.width;
    // On init, spread throughout canvas. On respawn, start from bottom.
    this.y = initial ? Math.random() * this.canvas.height : this.canvas.height + 20;
    this.speed = 0.2 + Math.random() * 0.5;
    this.drift = (Math.random() - 0.5) * 0.3;
    this.symbol = PIXEL_SYMBOLS[Math.floor(Math.random() * PIXEL_SYMBOLS.length)];
    this.alpha = 0.08 + Math.random() * 0.18;
    this.size  = 9 + Math.floor(Math.random() * 8);

    // Colour: mostly neon blue/green, occasional pink
    const roll = Math.random();
    if (roll < 0.5)       this.color = '#00e5ff';
    else if (roll < 0.85) this.color = '#39ff14';
    else                  this.color = '#ff2d78';

    this.flicker      = Math.random() > 0.7;
    this.flickerSpeed = 0.02 + Math.random() * 0.04;
    this.flickerPhase = Math.random() * Math.PI * 2;
  }

  update(t) {
    this.y -= this.speed;
    this.x += this.drift;

    // Flicker alpha
    if (this.flicker) {
      this.currentAlpha = this.alpha * (0.6 + 0.4 * Math.sin(t * this.flickerSpeed + this.flickerPhase));
    } else {
      this.currentAlpha = this.alpha;
    }

    // Respawn when off top
    if (this.y < -20) this.reset();
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.currentAlpha;
    ctx.fillStyle   = this.color;
    ctx.font        = `${this.size}px "Press Start 2P", monospace`;
    ctx.imageSmoothingEnabled = false;
    ctx.fillText(this.symbol, this.x, this.y);
    ctx.restore();
  }
}

// Additional: small pixel squares drifting up (visual noise)
class PixelDot {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }

  reset(initial = false) {
    this.x    = Math.random() * this.canvas.width;
    this.y    = initial ? Math.random() * this.canvas.height : this.canvas.height + 4;
    this.size = 1 + Math.floor(Math.random() * 3);
    this.speed = 0.3 + Math.random() * 0.8;
    this.alpha = 0.05 + Math.random() * 0.15;
    const roll = Math.random();
    this.color = roll < 0.5 ? '#00e5ff' : roll < 0.8 ? '#39ff14' : '#ffe600';
  }

  update() {
    this.y -= this.speed;
    if (this.y < -4) this.reset();
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
    ctx.restore();
  }
}

function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: PARTICLE_COUNT }, () => new TitleParticle(canvas));
  const dots      = Array.from({ length: 40 }, () => new PixelDot(canvas));

  let t = 0;
  let animId;

  function frame() {
    // Clear with a very slight trail effect for smooth fade
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    t++;

    dots.forEach(d => { d.update(); d.draw(ctx); });
    particles.forEach(p => { p.update(t); p.draw(ctx); });

    animId = requestAnimationFrame(frame);
  }

  frame();

  // Stop on page unload to avoid leaks
  window.addEventListener('beforeunload', () => cancelAnimationFrame(animId));
}

// ============================================================
// SPEECH BUBBLE UPDATE
// ============================================================
function updateSpeech() {
  const el     = document.getElementById('speechText');
  const bubble = document.querySelector('.speech-bubble');
  if (!el || !bubble) return;

  bubble.style.opacity   = '0';
  bubble.style.transform = 'scale(0.85)';

  setTimeout(() => {
    speechIndex = (speechIndex + 1) % TITLE_SPEECHES.length;
    el.textContent = TITLE_SPEECHES[speechIndex];
    bubble.style.transition = 'opacity 0.3s, transform 0.3s';
    bubble.style.opacity    = '1';
    bubble.style.transform  = 'scale(1)';
  }, 300);

  const delay = 4000 + Math.random() * 4000;
  speechTimeout = setTimeout(updateSpeech, delay);
}

// ============================================================
// SPRITE CYCLE
// ============================================================
function updateSprite() {
  const el = document.getElementById('titleSprite');
  if (!el) return;

  spriteIndex = (spriteIndex + 1) % TITLE_SPRITES.length;
  el.style.transition = 'opacity 0.3s';
  el.style.opacity    = '0';

  setTimeout(() => {
    el.src             = TITLE_SPRITES[spriteIndex];
    el.style.opacity   = '1';
  }, 300);

  const delay = 5000 + Math.random() * 5000;
  spriteTimeout = setTimeout(updateSprite, delay);
}

// ============================================================
// START GAME
// ============================================================
function startGame() {
  const btn = document.getElementById('startBtn');
  if (btn) {
    btn.style.background = 'rgba(57,255,20,0.25)';
    btn.style.transform  = 'scale(0.95)';
  }

  document.querySelector('.title-screen').classList.add('fade-out');

  clearTimeout(speechTimeout);
  clearTimeout(spriteTimeout);

  setTimeout(() => {
    window.location.href = 'game.html';
  }, 650);
}

// ============================================================
// KEYBOARD SHORTCUT
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') startGame();
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  speechTimeout = setTimeout(updateSpeech, 3000);
  spriteTimeout = setTimeout(updateSprite, 6000);
});
