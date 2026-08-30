# 🙈 GuessUp - Phone on Your Forehead!

A sleek, ultra-responsive party word guessing game built with **React**, **TypeScript**, and **Vite** — inspired by *Heads Up!* and *Guess Up*.

Hold the phone flat against your forehead facing your friends. Tilt **down** when you guess right, tilt **up** to pass!

---

## ✨ Features

- **🎮 3D World-Space Normal Tilt Detection**:
  - Uses vector normal `z = cos(beta) * cos(gamma)` for consistent tilt detection across portrait and landscape.
  - Tilt **Down** (Screen faces floor) = **Got it** (Green flash & chime).
  - Tilt **Up** (Screen faces sky) = **Pass** (Red flash & pass tone).
  - Visual tiltmeter on the ready screen to test and calibrate orientation before starting.
- **👆 Touch & Keyboard Controls**:
  - Tap the bottom of the screen or press `ArrowDown`/`Space`/`Enter` for **Got it**.
  - Tap the top of the screen or press `ArrowUp` for **Pass**.
  - `Escape` to finish early.
- **🎬 141-Card Movies & Series Deck**:
  - Includes iconic Bangladeshi (Dhallywood & OTT), Hindi / Bollywood, and English / Hollywood cinema classics and hits.
- **🃏 9 Curated Built-in Decks in `public/decks.json`**:
  - 🎬 *Movies & Series* (141 cards)
  - 🎭 *Act It Out* (30 cards)
  - 🦁 *Animals & Wildlife* (35 cards)
  - 🌟 *Superstars & Icons* (30 cards)
  - 🍕 *Food & Drinks* (30 cards)
  - 📼 *90s & 2000s Nostalgia* (26 cards)
  - 🎮 *Video Games* (26 cards)
  - 🌍 *World Landmarks* (25 cards)
  - 🎈 *Kids Fun & Cartoons* (25 cards)
- **✨ Custom Deck Editor & JSON Export/Import**:
  - Create custom decks in-app with emoji icons and color swatches.
  - Export all decks as a single `.json` file or import deck files anytime.
  - Custom decks are saved locally in the browser (`localStorage`).
  - Drop your exported JSON into `public/decks.json` to ship custom decks permanently to everyone!
- **🔊 Zero-Asset Web Audio Synthesizer**:
  - Crisp synthesized audio chimes, ticks, and buzzer with zero external audio assets.
- **📱 PWA & Mobile-First Design**:
  - Fullscreen immersive mode, screen wake-lock to prevent screen from dimming, and mobile safe-area insets.
- **🚀 Automated GitHub Actions Deployment**:
  - Pre-configured `.github/workflows/deploy.yml` and `base: './'` in `vite.config.ts`.

---

## 📁 Ultra-Minimal File Structure

```text
guess-up/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages deployment workflow
├── public/
│   └── decks.json          # Curated decks collection (easy to edit manually!)
├── src/
│   ├── App.tsx             # Complete game controller, screens & types
│   ├── styles.css          # Design tokens & styling
│   └── main.tsx            # React root entry point
├── index.html              # Shell with Archivo font & mobile meta tags
├── vite.config.ts          # Vite configuration (base: './')
└── package.json
```

---

## 🛠️ How to Manually Edit and Add Decks

### Method 1: Edit `public/decks.json` (Recommended for shipping to all players)
Open [`public/decks.json`](file:///d:/guess-up/public/decks.json) and add or edit any deck:

```json
{
  "id": "my-deck",
  "name": "My Custom Deck",
  "emoji": "🎉",
  "color": "#F2B705",
  "description": "Fun party clues",
  "words": [
    "Word 1",
    "Word 2",
    "Word 3",
    "Word 4"
  ]
}
```

### Method 2: In the App
1. Click **Settings** > **Export all decks** to download your current decks.
2. Edit or create new decks using the in-app **＋ New deck** tile.
3. Import JSON deck files anytime through the Settings screen.

---

## 🚀 Running Locally

```cmd
npm install
npm run dev
```

Open `http://localhost:5173` on your PC or mobile device on the same Wi-Fi network.

---

## 🌐 Deploying to GitHub Pages

1. **Commit & Push**:
   ```cmd
   git add .
   git commit -m "feat: apply custom design and decks"
   git push origin main
   ```
2. **Enable GitHub Pages**:
   - Go to your repository **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Your game is automatically built and deployed to `https://<your-username>.github.io/<repository-name>/`.
