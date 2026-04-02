# My Little Computer Science Amateur 🎮

A Tomodachi-style pet simulator featuring a pixel art CS student — powered by pure HTML, CSS, and JavaScript. No frameworks. No build steps. Drop the folder into VS Code, open with Live Server, and you're done.

---

## 📁 Folder Architecture

```
my-little-cs-amateur/
├── index.html              ← Title screen ("My Little Computer Science Amateur")
├── game.html               ← Main game / Tomodachi world
│
├── css/
│   ├── title.css           ← Styles for the title screen (CRT, neon, animations)
│   └── game.css            ← Styles for the game world, HUD, buttons, effects
│
├── js/
│   ├── title.js            ← Title screen logic (speech cycling, sprite cycling, start)
│   └── game.js             ← ALL game logic (see Architecture section below)
│
└── assets/
    └── sprites/            ← Transparent PNG character sprites
        ├── EJ_idle.png
        ├── EJ_walk.png
        ├── EJ_code.png
        ├── EJ_eat.png
        ├── EJ_drink.png
        ├── EJ_sleep.png
        ├── EJ_sleepy.png
        ├── EJ_workout.png
        ├── EJ_scared.png
        ├── EJ_pickup.png
        ├── EJ_fall.png
        ├── EJ_ground.png
        ├── EJ_thirsty.png
        └── EK_hungry.png
```

---

## 🚀 How to Run

### Option A – VS Code Live Server (recommended)
1. Open the `my-little-cs-amateur/` folder in VS Code
2. Install the **Live Server** extension (ritwickdey.LiveServer)
3. Right-click `index.html` → **Open with Live Server**

### Option B – GitHub Pages
1. Push the folder contents to a GitHub repo
2. Settings → Pages → Deploy from `main` branch, root `/`
3. Your site will be at `https://yourusername.github.io/repo-name/`

### Option C – Direct file open
Open `index.html` directly in a browser. Works for most features (sprite loading may vary by browser security policy for local files — Live Server is safer).

---

## 🎮 Game Features

| Feature | How |
|---|---|
| **Title screen** | Cycling speech bubbles, sprite swaps, CRT scanlines |
| **Stat system** | Hunger, Thirst, Energy, Mood — all drain over time |
| **Action buttons** | Feed, Drink, Code, Workout, Sleep, Job Application (scary!) |
| **Drag & drop** | Click and drag the character anywhere, drop to bounce |
| **Autonomous walk** | Pet walks back and forth at random intervals |
| **Speech bubbles** | Contextual quotes for every action + ambient muttering |
| **Visual effects** | Zzz for sleep, 💦 sweat for scared/workout, 💙 hearts for eating/drinking |
| **Toast notifications** | Brief pop-up confirmations for each action |
| **CRT aesthetic** | Scanline overlay, neon glow, pixel font throughout |

---

## 🧱 game.js Architecture

The game is split into self-contained modules inside `game.js`:

### `PetState`
Manages the four numerical stats (0–100 each).
- **`PetState.apply(deltas)`** — Add/subtract from any stat, auto-clamped to 0–100
- **`PetState.tick()`** — Called every `TICK_MS` to drain stats over time
- **`PetState.urgentNeed()`** — Returns `'hungry' | 'thirsty' | 'sleepy' | null`

### `HUD`
Updates the four stat bars in the top header.
- **`HUD.update()`** — Sets bar widths, adds `.critical` class when stat < 25%
- **`HUD.tickClock()`** — Updates the MM:SS elapsed clock every second

### `PetAnimator`
Controls all visual output — sprite swapping, speech bubbles, effects.
- **`PetAnimator.setSprite(state)`** — Cross-fades to the given sprite key
- **`PetAnimator.speak(text, duration)`** — Shows a speech bubble for N ms
- **`PetAnimator.playAction(state, duration)`** — Plays a sprite, then auto-reverts to idle
- **`PetAnimator.autoSprite()`** — Picks the right ambient sprite based on current needs
- **`PetAnimator.showZzz(bool)`** / **`showSweat(bool)`** / **`showHearts()`** — Effect toggles
- **`PetAnimator.showToast(message)`** — Top-of-world notification
- **`PetAnimator.randomSpeech(category)`** — Returns a random quote from `ACTION_SPEECH`

### `PetWalker`
Autonomous movement using `requestAnimationFrame`.
- **`PetWalker.init()`** — Sets starting position, begins walk cycle
- **`PetWalker.pause()`** — Stops movement (called during actions / drag)
- **`PetWalker.resume()`** — Re-enables movement after action ends

### `DragHandler`
Pointer-event based drag-and-drop.
- **`DragHandler.init()`** — Attaches `pointerdown`, `pointermove`, `pointerup` events
- On **pointerdown**: switches to `pickup` sprite, shows bubble
- On **pointermove**: repositions pet clamped to world bounds
- On **pointerup**: plays `fall` → `ground` → returns to idle

### `ActionSystem`
Maps button clicks to stat boosts, animations, and cooldowns.
- **`ActionSystem.trigger(action)`** — Main entry point; applies boost, plays animation, starts cooldown
- **`COOLDOWNS`** constant — Per-action cooldown times in ms
- **`ACTION_BOOST`** constant — Stat delta objects per action

### Constants (top of file)
| Constant | Purpose |
|---|---|
| `TICK_MS` | How often the game tick fires (ms) |
| `DRAIN` | Per-tick stat drain rates |
| `ACTION_BOOST` | Stat changes per button action |
| `SPRITES` | Maps state names → PNG paths |
| `ACTION_SPEECH` | Quote arrays per action category |
| `COOLDOWNS` | Button cooldown durations (ms) |

---

## 📌 Global Functions (called from HTML onclick)

```js
petAction('eat')      // Feed the pet
petAction('drink')    // Give water/drink
petAction('code')     // Make them code
petAction('workout')  // Send to gym
petAction('sleep')    // Let them sleep
petAction('scared')   // Show job application (terrifying)
dismissOverlay()      // Dismiss the sleep/status overlay
```

---

## ✏️ Customization

- **Add more quotes** — Edit `ACTION_SPEECH` or `AMBIENT_LINES` in `game.js`
- **Change drain speed** — Edit the `DRAIN` object at the top of `game.js`
- **Add a new action** — Add entry to `ACTION_BOOST`, `SPRITES`, `ACTION_SPEECH`, `COOLDOWNS`, add a button in `game.html`
- **Swap sprites** — Drop new PNGs in `assets/sprites/` and update the `SPRITES` map
- **Colors / fonts** — All CSS variables are in `:root` in both CSS files

---

## 📄 License
Personal / educational use. Built for COMP 484 vibes ☕
