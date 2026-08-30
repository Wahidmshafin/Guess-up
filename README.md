# 🎉 Guess Up! - Party Word Game

A modern, responsive charades and word guessing party game built with **React**, **TypeScript**, and **Vite** — inspired by *Heads Up!* and *Guess Up*.

Play with friends and family by holding your phone against your forehead, nodding down for **Correct** and tilting up to **Pass**, or using the on-screen touch and keyboard controls.

---

## ✨ Features

- **🎮 Authentic Forehead / Motion Gyro Gameplay**:
  - Place your phone on your forehead facing your friends.
  - **Tilt Down (Nod Forward)** 🟢 = **CORRECT** (+1 Point & chime).
  - **Tilt Up (Look Up)** 🟡 = **PASS** (amber flash & swoosh).
  - Built-in permission request for iOS Safari and calibration for Android/desktop.
- **👆 Screen Touch & Keyboard Fallback**:
  - Tap the right side of the screen or press `ArrowRight`/`Enter` for **Correct**.
  - Tap the left side of the screen or press `ArrowLeft`/`Escape` for **Pass**.
  - Press `Space` to pause/resume.
- **🃏 10+ Rich Built-In Decks**:
  - 🎬 *Blockbuster Movies & Series*
  - 🎭 *Act It Out (Charades)*
  - 🦁 *Animals & Wildlife*
  - 🌟 *Celebrities & Superstars*
  - 🍕 *Food, Snacks & Drinks*
  - 📼 *90s & 2000s Nostalgia*
  - 🎮 *Video Games & Characters*
  - 🌍 *World Travel & Landmarks*
  - 🎈 *Kids Fun & Cartoons*
- **✨ Custom Deck Builder**:
  - Create new decks with custom icons, color themes, descriptions, and word lists.
  - Edit or delete custom decks anytime.
- **📁 Decks Storage & Raw JSON Editor**:
  - View and edit all decks in raw JSON format directly in the app.
  - Export `.json` backup files or import/restore decks from files.
  - Factory reset button to restore default deck collection.
- **🔊 Web Audio API Sound Effects**:
  - Joyful synthesized chimes, countdown beeps, low-time ticking, and buzzer sounds (no external audio files required).
- **⏱️ Configurable Round Timers**:
  - Choose between 30s, 60s, 90s, or 120s rounds.
- **📊 Summary & Score Sharing**:
  - Detailed breakdown of correct vs passed cards.
  - Performance tier rating and one-click score sharing.
- **🚀 Automated GitHub Actions Deployment**:
  - Pre-configured `.github/workflows/deploy.yml` workflow for automated deployment to GitHub Pages.

---

## 📁 File Structure (Minimal & Compact)

To make modification and maintenance as easy as possible, the entire application is organized into just a few core files:

```text
guess-up/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated GitHub Pages deployment workflow
├── src/
│   ├── types.ts                  # TypeScript interfaces for Decks, Settings, Game State
│   ├── decks.ts                  # Default deck data + LocalStorage & JSON export/import helpers
│   ├── audio.ts                  # Web Audio API sound synthesizer
│   ├── hooks/
│   │   └── useDeviceOrientation.ts # Motion gyro tilt detection hook with iOS support
│   ├── App.tsx                   # Complete game controller & reactive UI
│   ├── App.css                   # Responsive party styling & animations
│   ├── index.css                 # Clean CSS reset
│   └── main.tsx                  # Vite React entry point
├── index.html                    # Game shell with mobile meta tags & fonts
├── vite.config.ts                # Vite config (base: './' for GitHub Pages)
└── package.json
```

---

## 🛠️ How to Manually Edit and Store Decks

You have **two easy ways** to edit and manage decks:

### Method 1: In the App (Recommended & Easiest)
1. Open the app and click the **📁 (Decks & JSON Editor)** button in the top right.
2. You will see the entire collection of decks formatted in clear JSON.
3. You can edit existing words, add new decks, paste your own card lists, or click **"Download Backup (.json)"** to save your decks to your computer.
4. Click **"Save & Apply JSON Changes"** — changes are instantly saved to your browser's `localStorage`.

### Method 2: In Code
1. Open `src/decks.ts`.
2. Look at the `DEFAULT_DECKS` array.
3. Add a new deck object or edit existing ones:
```typescript
{
  id: 'my-custom-deck',
  title: 'My Favorite Anime',
  description: 'Guess the anime character!',
  icon: '⚡',
  color: 'from-purple-600 to-indigo-600',
  category: 'Anime',
  cards: [
    'Naruto Uzumaki',
    'Monkey D. Luffy',
    'Goku',
    'Sailor Moon',
    'Levi Ackerman'
  ]
}
```
4. Run `npm run build` or push to GitHub to deploy!

---

## 🚀 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local development server**:
   ```bash
   npm run dev
   ```

3. Open your browser at the URL shown in the terminal (usually `http://localhost:5173`).

---

## 🌐 Deploying with GitHub Actions to GitHub Pages

This repository is already configured with `.github/workflows/deploy.yml` and `base: './'` in `vite.config.ts`.

### Setup Steps:
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Guess Up party game"
   git push origin main
   ```
2. **Enable GitHub Pages**:
   - In your repository on GitHub, go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. **Automatic Deployment**:
   - GitHub Actions will automatically run the build workflow and publish your game to `https://<your-username>.github.io/<repository-name>/`.
