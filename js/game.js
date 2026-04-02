/**
 * game.js
 * My Little Computer Science Amateur
 * Core Tomodachi-style simulation logic.
 *
 * ─── Architecture ────────────────────────────────────────────
 *  PetState        – stat values (hunger, thirst, energy, mood)
 *  PetAnimator     – sprite swaps and visual effects
 *  PetWalker       – autonomous + directed walking movement
 *  DragHandler     – click-drag-drop interaction
 *  HUD             – updates stat bars and clock
 *  ActionSystem    – button presses, walk-to-destination logic
 *  PixelParticles  – ambient pixel canvas animation
 *  Game            – main init and tick loop
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

// ============================================================
// CONSTANTS
// ============================================================

const TICK_MS = 3000;

const DRAIN = {
  hunger:  1.5,
  thirst:  2.0,
  energy:  1.0,
  mood:    0.8,
};

const ACTION_BOOST = {
  eat:     { hunger: +30, mood: +5  },
  drink:   { thirst: +30, mood: +5  },
  code:    { mood: +15, energy: -10 },
  workout: { energy: -20, mood: +20, hunger: -10 },
  sleep:   { energy: +40, mood: +5  },
  // Job app: DECREASES mood significantly (scary!)
  scared:  { mood: -30, energy: -5  },
};

const SPRITES = {
  idle:    'assets/sprites/EJ_idle.png',
  walk:    'assets/sprites/EJ_walk.png',
  eat:     'assets/sprites/EJ_eat.png',
  drink:   'assets/sprites/EJ_drink.png',
  code:    'assets/sprites/EJ_code.png',
  gaming:  'assets/sprites/EJ_gaming.png',   // Used when sitting at PC
  workout: 'assets/sprites/EJ_workout.png',
  sleep:   'assets/sprites/EJ_sleep.png',
  sleepy:  'assets/sprites/EJ_sleepy.png',
  scared:  'assets/sprites/EJ_scared.png',
  hungry:  'assets/sprites/EK_hungry.png',
  thirsty: 'assets/sprites/EJ_thirsty.png',
  pickup:  'assets/sprites/EJ_pickup.png',
  fall:    'assets/sprites/EJ_fall.png',
  ground:  'assets/sprites/EJ_ground.png',
};

const ACTION_SPEECH = {
  eat:     ["om nom nom", "finally, real food", "Reese's Puffs again", "pizza. always pizza."],
  drink:   ["cracking a cold one", "caffeine loading...", "I need this", "hydration moment"],
  code:    ["it works??", "undefined :(", "just one more bug", "CTRL+Z CTRL+Z CTRL+Z", "segfault again"],
  gaming:  ["one more game...", "LETS GOOO", "carried that match", "rank grind never stops"],
  workout: ["one more rep!!", "why am I doing this", "gains for the grind", "I hate this. same time tmr"],
  sleep:   ["*snores in Python*", "finally...", "zzz zzz zzz", "5 more minutes..."],
  scared:  ["NOT THE JOB APP", "I need more internships", "my GPA... gone", "BEHAVIORAL QUESTIONS NOOO"],
  hungry:  ["feed me or I segfault", "my stomach is O(n) complaining", "bro. FOOD."],
  thirsty: ["dehydrated dev detected", "no more coffee??", "water?? what's that"],
  sleepy:  ["can't... keep... eyes... open", "just one more commit", "zzz... wait no"],
  idle:    ["...", "staring at the void", "rubber duck debugging", "git blame myself"],
};

const COOLDOWNS = {
  eat:     4000,
  drink:   4000,
  code:    6000,
  workout: 8000,
  sleep:   10000,
  scared:  3000,
};

// ============================================================
// PET STATE
// ============================================================
const PetState = {
  hunger:  80,
  thirst:  80,
  energy:  80,
  mood:    80,

  apply(deltas) {
    for (const [key, val] of Object.entries(deltas)) {
      if (key in this) {
        this[key] = Math.max(0, Math.min(100, this[key] + val));
      }
    }
  },

  tick() {
    this.hunger = Math.max(0, this.hunger - DRAIN.hunger);
    this.thirst = Math.max(0, this.thirst - DRAIN.thirst);
    this.energy = Math.max(0, this.energy - DRAIN.energy);
    this.mood   = Math.max(0, this.mood   - DRAIN.mood);
  },

  urgentNeed() {
    if (this.hunger < 20) return 'hungry';
    if (this.thirst < 20) return 'thirsty';
    if (this.energy < 20) return 'sleepy';
    if (this.mood   < 20) return 'sad';
    return null;
  },
};

// ============================================================
// HUD
// ============================================================
const HUD = {
  bars: {
    hunger: document.getElementById('hungerBar'),
    thirst: document.getElementById('thirstBar'),
    energy: document.getElementById('energyBar'),
    mood:   document.getElementById('moodBar'),
  },
  blocks: {
    hunger: document.getElementById('statHunger'),
    thirst: document.getElementById('statThirst'),
    energy: document.getElementById('statEnergy'),
    mood:   document.getElementById('statMood'),
  },
  clockEl:   document.getElementById('gameClock'),
  startTime: Date.now(),

  update() {
    ['hunger', 'thirst', 'energy', 'mood'].forEach(stat => {
      const val   = PetState[stat];
      const bar   = this.bars[stat];
      const block = this.blocks[stat];
      if (bar)   bar.style.width = val + '%';
      if (block) block.classList.toggle('critical', val < 25);
    });
  },

  tickClock() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    if (this.clockEl) this.clockEl.textContent = `${m}:${s}`;
  },
};

// ============================================================
// PET ANIMATOR
// Handles sprite swaps, speech bubbles, and particle effects.
// ============================================================
const PetAnimator = {
  spriteEl:     document.getElementById('petSprite'),
  speechEl:     document.getElementById('gameSpeech'),
  speechTextEl: document.getElementById('gameSpeechText'),
  zzzEl:        document.getElementById('zzzEffect'),
  sweatEl:      document.getElementById('sweatEffect'),
  heartsEl:     document.getElementById('heartsEffect'),
  toastEl:      document.getElementById('toast'),

  currentState: 'idle',
  speechTimer:  null,
  stateTimer:   null,

  /**
   * setSprite – cross-fades to the given sprite state.
   * All PNG images must have transparent backgrounds — we do NOT
   * apply any background color here; we rely on CSS background:transparent.
   */
  setSprite(state) {
    const src = SPRITES[state] || SPRITES.idle;
    if (!this.spriteEl) return;
    this.currentState = state;

    this.spriteEl.style.opacity = '0';
    setTimeout(() => {
      this.spriteEl.src = src;
      this.spriteEl.style.transition = 'opacity 0.25s';
      this.spriteEl.style.opacity    = '1';
    }, 150);
  },

  speak(text, duration = 3000) {
    if (!this.speechEl || !this.speechTextEl) return;
    clearTimeout(this.speechTimer);
    this.speechTextEl.textContent = text;
    this._positionSpeechBubble();
    this.speechEl.classList.add('visible');
    this.speechTimer = setTimeout(() => {
      this.speechEl.classList.remove('visible');
    }, duration);
  },

  _positionSpeechBubble() {
    const pet    = document.getElementById('petContainer');
    const world  = document.getElementById('gameWorld');
    const bubble = this.speechEl;
    if (!pet || !world || !bubble) return;

    const petRect   = pet.getBoundingClientRect();
    const worldRect = world.getBoundingClientRect();

    const left = petRect.left - worldRect.left + petRect.width / 2 - 20;
    const top  = petRect.top  - worldRect.top  - 70;

    bubble.style.left = Math.max(8, Math.min(left, worldRect.width - 200)) + 'px';
    bubble.style.top  = Math.max(8, top) + 'px';
  },

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    setTimeout(() => this.toastEl.classList.remove('show'), 2200);
  },

  /**
   * playAction – pauses walking, sets sprite, then reverts after duration.
   */
  playAction(state, duration = 2500) {
    clearTimeout(this.stateTimer);
    this.setSprite(state);
    PetWalker.pause();

    this.stateTimer = setTimeout(() => {
      PetWalker.resume();
      this.autoSprite();
    }, duration);
  },

  autoSprite() {
    if (DragHandler.isDragging) return;
    const need = PetState.urgentNeed();
    if (need === 'hungry')  { this.setSprite('hungry');  return; }
    if (need === 'thirsty') { this.setSprite('thirsty'); return; }
    if (need === 'sleepy')  { this.setSprite('sleepy');  return; }
    this.setSprite(PetWalker.isWalking ? 'walk' : 'idle');
  },

  showZzz(visible) {
    if (!this.zzzEl) return;
    this._positionEffect(this.zzzEl, -60);
    this.zzzEl.classList.toggle('visible', visible);
  },

  showSweat(visible) {
    if (!this.sweatEl) return;
    this._positionEffect(this.sweatEl, -40);
    this.sweatEl.classList.toggle('visible', visible);
    if (!visible) return;
    setTimeout(() => this.sweatEl.classList.remove('visible'), 2000);
  },

  showHearts() {
    if (!this.heartsEl) return;
    this._positionEffect(this.heartsEl, -50);
    this.heartsEl.classList.remove('visible');
    void this.heartsEl.offsetWidth;
    this.heartsEl.classList.add('visible');
    setTimeout(() => this.heartsEl.classList.remove('visible'), 1600);
  },

  _positionEffect(el, yOffset) {
    const pet   = document.getElementById('petContainer');
    const world = document.getElementById('gameWorld');
    if (!pet || !world || !el) return;

    const petRect   = pet.getBoundingClientRect();
    const worldRect = world.getBoundingClientRect();

    el.style.left = (petRect.left - worldRect.left + petRect.width / 2 + 10) + 'px';
    el.style.top  = (petRect.top  - worldRect.top  + yOffset) + 'px';
  },

  randomSpeech(category) {
    const lines = ACTION_SPEECH[category] || ACTION_SPEECH.idle;
    return lines[Math.floor(Math.random() * lines.length)];
  },
};

// ============================================================
// PET WALKER
// Handles both autonomous roaming AND directed walks to a target
// (fridge on left, PC on right) before performing an action.
// ============================================================
const PetWalker = {
  petEl:       document.getElementById('petContainer'),
  worldEl:     document.getElementById('gameWorld'),
  isWalking:   false,
  isPaused:    false,
  targetX:     null,
  currentX:    null,
  walkSpeed:   1.8,     // px per animation frame (slightly faster than before)
  walkInterval: null,
  pauseTimer:  null,
  walkTimer:   null,

  /** Callback to run when the directed walk reaches its destination. */
  onArrival:   null,

  init() {
    if (!this.petEl || !this.worldEl) return;
    const bounds = this._bounds();
    this.currentX = bounds.min + (bounds.max - bounds.min) / 2;
    this._setX(this.currentX);
    this._scheduleNextWalk();
  },

  _bounds() {
    const world = this.worldEl.clientWidth;
    // Keep away from the very edges so the pet doesn't overlap interaction zones
    return { min: 80, max: world - 120 };
  },

  _setX(x) {
    this.petEl.style.left      = x + 'px';
    this.petEl.style.transform = 'none';
    this.currentX = x;
  },

  _scheduleNextWalk() {
    if (this.isPaused) return;
    const wait = 3000 + Math.random() * 5000;
    this.walkTimer = setTimeout(() => this._startWalk(), wait);
  },

  _startWalk(targetOverride = null) {
    if (this.isPaused || DragHandler.isDragging) {
      if (!targetOverride) this._scheduleNextWalk();
      return;
    }

    const bounds = this._bounds();

    // Use override target (directed) or pick a random autonomous destination
    this.targetX = targetOverride !== null
      ? targetOverride
      : bounds.min + Math.random() * (bounds.max - bounds.min);

    this.isWalking = true;

    const goingLeft = this.targetX < this.currentX;
    this.petEl.classList.toggle('facing-left', goingLeft);
    this.petEl.classList.add('walking');
    PetAnimator.setSprite('walk');

    this._stepLoop();
  },

  _stepLoop() {
    if (this.isPaused || DragHandler.isDragging) {
      this._stopWalk(false);
      return;
    }

    const diff = this.targetX - this.currentX;
    if (Math.abs(diff) < this.walkSpeed + 1) {
      // Arrived at destination
      this._setX(this.targetX);
      this._stopWalk(true);
      return;
    }

    const dir = diff > 0 ? 1 : -1;
    this._setX(this.currentX + dir * this.walkSpeed);
    this.walkInterval = requestAnimationFrame(() => this._stepLoop());
  },

  _stopWalk(arrived = false) {
    cancelAnimationFrame(this.walkInterval);
    this.isWalking = false;
    this.petEl.classList.remove('walking', 'facing-left');

    if (arrived && typeof this.onArrival === 'function') {
      // Fire the arrival callback then clear it
      const cb = this.onArrival;
      this.onArrival = null;
      cb();
      return; // Don't schedule next autonomous walk yet (action will call resume)
    }

    if (!this.isPaused) {
      PetAnimator.autoSprite();
      this._scheduleNextWalk();
    }
  },

  /**
   * walkTo – directed walk: pet moves to targetX then fires callback.
   * @param {number} targetX - absolute pixel x in game world
   * @param {Function} callback - runs on arrival
   */
  walkTo(targetX, callback) {
    // Cancel any in-progress autonomous walk
    clearTimeout(this.walkTimer);
    cancelAnimationFrame(this.walkInterval);
    this.isWalking   = false;
    this.isPaused    = false;
    this.onArrival   = callback;
    this._startWalk(targetX);
  },

  pause() {
    this.isPaused = true;
    clearTimeout(this.walkTimer);
    cancelAnimationFrame(this.walkInterval);
    this.isWalking = false;
    this.petEl.classList.remove('walking');
    this.onArrival = null; // Cancel any pending directed walk
  },

  resume() {
    this.isPaused  = false;
    this.onArrival = null;
    this._scheduleNextWalk();
  },
};

// ============================================================
// DRAG HANDLER
// ============================================================
const DragHandler = {
  petEl:     document.getElementById('petContainer'),
  worldEl:   document.getElementById('gameWorld'),
  isDragging: false,
  offsetX:   0,
  offsetY:   0,
  dropBounce: null,

  init() {
    if (!this.petEl || !this.worldEl) return;
    this.petEl.addEventListener('pointerdown', (e) => this._onDown(e));
    window.addEventListener('pointermove',    (e) => this._onMove(e));
    window.addEventListener('pointerup',      (e) => this._onUp(e));
  },

  _onDown(e) {
    e.preventDefault();
    if (this.dropBounce) return;

    this.isDragging = true;
    PetWalker.pause();

    const rect    = this.petEl.getBoundingClientRect();
    this.offsetX  = e.clientX - rect.left  - rect.width  / 2;
    this.offsetY  = e.clientY - rect.top   - rect.height / 2;

    this.petEl.classList.add('dragging', 'held');
    PetAnimator.setSprite('pickup');
    PetAnimator.speak("hey! put me down!!");
  },

  _onMove(e) {
    if (!this.isDragging) return;
    const worldRect = this.worldEl.getBoundingClientRect();
    const petRect   = this.petEl.getBoundingClientRect();

    let newLeft = (e.clientX - worldRect.left) - this.offsetX - petRect.width  / 2;
    let newTop  = (e.clientY - worldRect.top)  - this.offsetY - petRect.height / 2;

    newLeft = Math.max(0, Math.min(newLeft, worldRect.width  - petRect.width));
    newTop  = Math.max(0, Math.min(newTop,  worldRect.height - petRect.height));

    this.petEl.style.left   = newLeft + 'px';
    this.petEl.style.top    = newTop  + 'px';
    this.petEl.style.bottom = 'auto';
    this.petEl.style.transform = 'none';

    PetWalker.currentX = newLeft;
  },

  _onUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.petEl.classList.remove('dragging', 'held');

    PetAnimator.setSprite('fall');
    PetAnimator.speak("oof", 1800);

    this.dropBounce = setTimeout(() => {
      const currentLeft = parseFloat(this.petEl.style.left) || 0;
      this.petEl.style.top    = '';
      this.petEl.style.bottom = '6px';
      this.petEl.style.left   = currentLeft + 'px';

      PetWalker.currentX = currentLeft;
      PetAnimator.setSprite('ground');

      setTimeout(() => {
        this.dropBounce = null;
        PetAnimator.autoSprite();
        PetWalker.resume();
      }, 800);
    }, 300);
  },
};

// ============================================================
// ACTION SYSTEM
// Buttons now make the pet WALK to the appropriate location
// before performing the action.
//
// Destination logic:
//   eat  → fridge on left  (~8% of world width)
//   code → PC on right     (~78% of world width)
//   All others → perform in-place
// ============================================================
const ActionSystem = {
  cooldowns: {},

  /**
   * trigger – walks pet to the correct location then executes the action.
   * @param {string} action
   */
  trigger(action) {
    if (this.cooldowns[action]) return;

    const worldWidth = document.getElementById('gameWorld')?.clientWidth || 800;

    // Determine if this action needs a walk-to-location first
    if (action === 'eat') {
      // Walk to fridge (left side of room, ~8% in)
      const fridgeX = Math.round(worldWidth * 0.08);
      PetAnimator.showToast('WALKING TO FRIDGE...');
      PetWalker.walkTo(fridgeX, () => this._executeAction(action));
    } else if (action === 'code') {
      // Walk to PC desk (right side of room, ~72% in)
      const pcX = Math.round(worldWidth * 0.72);
      PetAnimator.showToast('WALKING TO PC...');
      PetWalker.walkTo(pcX, () => this._executeAction(action));
    } else {
      // Perform in-place (drink, workout, sleep, scared)
      this._executeAction(action);
    }
  },

  /**
   * _executeAction – applies stat changes and runs the animation.
   * Called after walking is complete (or immediately for in-place actions).
   * @param {string} action
   * @private
   */
  _executeAction(action) {
    // Apply stat boosts/penalties
    const boost = ACTION_BOOST[action];
    if (boost) PetState.apply(boost);

    // Pick speech line
    const speechCategory = action === 'code' ? 'gaming' : action;
    const line = PetAnimator.randomSpeech(speechCategory);

    // Duration for each action animation
    const durations = { eat: 3000, drink: 3000, code: 5000, workout: 4000, sleep: 5000, scared: 3000 };
    const dur = durations[action] || 2500;

    // Use EJ_gaming sprite when at the PC
    const spriteState = action === 'code' ? 'gaming' : action;
    PetAnimator.playAction(spriteState, dur);
    PetAnimator.speak(line, dur - 300);

    // Special visual effects
    if (action === 'sleep')   PetAnimator.showZzz(true);
    if (action === 'scared')  PetAnimator.showSweat(true);
    if (action === 'eat' || action === 'drink') PetAnimator.showHearts();

    // Toast feedback
    const toastMessages = {
      eat:     'NOM NOM NOM',
      drink:   'HYDRATED +30',
      code:    'GAMING SESSION...',
      workout: 'GAINS UNLOCKED',
      sleep:   'RESTING...',
      scared:  'JOB APPLICATION TERROR  MOOD--',
    };
    PetAnimator.showToast(toastMessages[action] || 'OK');

    // Flash the button
    const btnMap = { eat: 'btnFeed', drink: 'btnDrink', code: 'btnCode', workout: 'btnWorkout', sleep: 'btnSleep', scared: 'btnScare' };
    const btnEl = document.getElementById(btnMap[action]);
    if (btnEl) {
      btnEl.classList.add('active-glow');
      setTimeout(() => btnEl.classList.remove('active-glow'), 600);
    }

    // Start cooldown
    const cd = COOLDOWNS[action] || 3000;
    this._startCooldown(action, cd, btnEl);

    HUD.update();
  },

  _startCooldown(action, ms, btnEl) {
    if (btnEl) btnEl.classList.add('cooldown');
    this.cooldowns[action] = setTimeout(() => {
      delete this.cooldowns[action];
      if (btnEl) btnEl.classList.remove('cooldown');
    }, ms);
  },
};

// ============================================================
// PIXEL PARTICLES (ambient background)
// Small glowing pixels and code symbols floating up the room.
// ============================================================
const PixelParticles = {
  canvas: null,
  ctx:    null,
  particles: [],
  dots:   [],
  animId: null,

  SYMBOLS: ['{}', '01', '//', '()', '!=', '&&', '++', '[]', '??', '/*'],

  init() {
    this.canvas = document.getElementById('pixelCanvas');
    if (!this.canvas) return;

    const resize = () => {
      this.canvas.width  = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    this.ctx = this.canvas.getContext('2d');

    // Create symbol particles
    for (let i = 0; i < 18; i++) {
      this.particles.push(this._makeParticle(true));
    }
    // Create pixel dots
    for (let i = 0; i < 30; i++) {
      this.dots.push(this._makeDot(true));
    }

    this._frame();
  },

  _makeParticle(initial = false) {
    const c = this.canvas;
    const roll = Math.random();
    return {
      x:      Math.random() * c.width,
      y:      initial ? Math.random() * c.height : c.height + 10,
      speed:  0.15 + Math.random() * 0.35,
      drift:  (Math.random() - 0.5) * 0.25,
      symbol: this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)],
      alpha:  0.06 + Math.random() * 0.12,
      size:   8 + Math.floor(Math.random() * 6),
      color:  roll < 0.5 ? '#00e5ff' : roll < 0.85 ? '#39ff14' : '#ff2d78',
      flicker: Math.random() > 0.6,
      fSpeed:  0.025 + Math.random() * 0.05,
      fPhase:  Math.random() * Math.PI * 2,
    };
  },

  _makeDot(initial = false) {
    const c = this.canvas;
    return {
      x:     Math.random() * c.width,
      y:     initial ? Math.random() * c.height : c.height + 4,
      size:  1 + Math.floor(Math.random() * 3),
      speed: 0.3 + Math.random() * 0.6,
      alpha: 0.04 + Math.random() * 0.1,
      color: Math.random() < 0.6 ? '#00e5ff' : '#39ff14',
    };
  },

  _frame() {
    const ctx = this.ctx;
    const c   = this.canvas;
    ctx.clearRect(0, 0, c.width, c.height);

    const t = Date.now() * 0.001;

    // Draw dots
    this.dots.forEach(d => {
      d.y -= d.speed;
      if (d.y < -4) Object.assign(d, this._makeDot());

      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle   = d.color;
      ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
      ctx.restore();
    });

    // Draw symbol particles
    this.particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -20) Object.assign(p, this._makeParticle());

      const alpha = p.flicker
        ? p.alpha * (0.5 + 0.5 * Math.sin(t * p.fSpeed * 60 + p.fPhase))
        : p.alpha;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;
      ctx.font        = `${p.size}px "Press Start 2P", monospace`;
      ctx.imageSmoothingEnabled = false;
      ctx.fillText(p.symbol, p.x, p.y);
      ctx.restore();
    });

    this.animId = requestAnimationFrame(() => this._frame());
  },
};

// ============================================================
// ZONE CLICK HANDLERS
// Clicking directly on the fridge/PC zone also triggers action.
// ============================================================
function initZoneHandlers() {
  const fridgeZone = document.getElementById('fridgeZone');
  const pcZone     = document.getElementById('pcZone');

  if (fridgeZone) {
    fridgeZone.addEventListener('click', () => {
      if (!ActionSystem.cooldowns['eat']) petAction('eat');
    });
  }

  if (pcZone) {
    pcZone.addEventListener('click', () => {
      if (!ActionSystem.cooldowns['code']) petAction('code');
    });
  }
}

// ============================================================
// CLOCK TICKER
// ============================================================
setInterval(() => HUD.tickClock(), 1000);

// ============================================================
// AMBIENT SPEECH
// ============================================================
const AMBIENT_LINES = [
  "...still no job offers",
  "i should refactor this",
  "what is REST anyway",
  "O(n^2) is fine, right?",
  "Stack Overflow is a co-author",
  "git blame: it was me",
  "undefined... of course",
  "please just work",
  "one more energy drink",
  "need more RAM",
];

function scheduleAmbientSpeech() {
  const delay = 12000 + Math.random() * 12000;
  setTimeout(() => {
    if (!DragHandler.isDragging && PetAnimator.currentState === 'idle') {
      const line = AMBIENT_LINES[Math.floor(Math.random() * AMBIENT_LINES.length)];
      PetAnimator.speak(line, 3000);
    }
    scheduleAmbientSpeech();
  }, delay);
}

// ============================================================
// MAIN GAME TICK
// ============================================================
function gameTick() {
  PetState.tick();
  HUD.update();

  if (!DragHandler.isDragging && PetAnimator.currentState === 'idle') {
    PetAnimator.autoSprite();
  }

  if (PetAnimator.currentState !== 'sleep') {
    PetAnimator.showZzz(false);
  }

  const need = PetState.urgentNeed();
  if (need && !PetAnimator.speechEl?.classList.contains('visible')) {
    const line = PetAnimator.randomSpeech(need) || 'help...';
    PetAnimator.speak(line, 3500);
  }
}

// ============================================================
// GLOBAL FUNCTIONS (called by inline onclick attributes)
// ============================================================
function petAction(action) {
  ActionSystem.trigger(action);
}

function dismissOverlay() {
  document.getElementById('statusOverlay').style.display = 'none';
  PetAnimator.showZzz(false);
  PetAnimator.autoSprite();
  PetWalker.resume();
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  HUD.update();
  PetWalker.init();
  DragHandler.init();
  PixelParticles.init();
  initZoneHandlers();

  setInterval(gameTick, TICK_MS);
  scheduleAmbientSpeech();

  // Opening line
  setTimeout(() => {
    PetAnimator.speak("another day of debugging...", 3500);
  }, 1500);
});
