# Typothon ⚡🏎️

A production-grade, cyberpunk-minimal multiplayer typing test web application inspired by Monkeytype and modern Web3 dashboards. Built with **Vite**, **React 19**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Lucide React**, **Recharts**, and **Canvas-Confetti**.

---

## 🌟 Key Features

### 1. Visual Design & Theming ("New-Gen" Aesthetic)
- **3 Dynamic Themes**:
  - **Cyberpunk Neon**: Deep void (`#090A0F`), electric cyan (`#00F5FF`), hot violet (`#BD00FF`), and toxic lime (`#39FF14`).
  - **Amber Terminal**: 1980s CRT amber phosphor (`#FFB000`) with authentic scanlines.
  - **Dracula Slate**: Midnight slate (`#191A21`) with pastel purple (`#BD93F9`) and neon pink (`#FF79C6`).
- **Cyberpunk Typography**: Google Fonts `JetBrains Mono` and `Orbitron` display.
- **Glassmorphic HUD & Micro-Interactions**: Caret pulses, glowing character highlights, crimson error ripples, and speed surge meters.

### 2. Core Typing Engine
- **Accurate Real-Time Telemetry**: Gross WPM, Net WPM, Raw WPM, Accuracy (%), Error Count, Consistency (%), and Key Latency (ms).
- **Keystroke Navigation**: Backspace correction, word jump-backs, word auto-scrolling, and instant hotkey restarts (`Esc` or `Ctrl/Cmd + Enter`).
- **Modes**:
  - Timed tests (15s, 30s, 60s)
  - Word count targets (25, 50, 100 words)
  - Cyberpunk quotes (Matrix, Neuromancer, Blade Runner, Snow Crash, Linus Torvalds, Alan Turing)

### 3. Competition & Multiplayer Simulation
- **Live Cyber Gridway (`RaceTrack`)**: Multi-lane visual track showing real-time avatar progress, dynamic velocity trails, and live WPM badges.
- **AI Bot Racers**: 3 difficulty levels (*Rookie.bin* ~45 WPM, *GridRunner* ~75 WPM, *Overclocked_X* ~105 WPM) with natural humanized speed jitter.
- **Local Multi-Tab Peer Multiplayer**: Real-time room synchronization using the HTML5 `BroadcastChannel` API. Open 2+ tabs on the same device with the same room code to race head-to-head without any backend server.
- **Live Leaderboard**: Real-time position shifting using Framer Motion `layout` spring animations.

### 4. Audio Engine (Web Audio API)
- Built-in zero-dependency mechanical switch sound synthesizer:
  - `Thocky` (deep linear switch pop)
  - `Clicky` (crisp blue switch snap)
  - `Beep` (futuristic terminal blip)
  - Error buzzers, countdown pings, and victory fanfare.

### 5. Post-Race Analytics & Victory Screen
- Interactive **Velocity Telemetry Curve** (Recharts) plotting Net WPM and Raw WPM second-by-second.
- Character breakdown: Correct, Incorrect, Extra, Missed.
- Podium trophy awards (🥇, 🥈, 🥉) with multi-stage particle explosions (`canvas-confetti`).
- One-click formatted telemetry clipboard card sharing.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Clone the repository
git clone https://github.com/otakurg/Typothon.git
cd Typothon

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack
- **Framework**: React 19 (TypeScript)
- **Bundler**: Vite
- **Styling**: Tailwind CSS, PostCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Celebration**: Canvas-Confetti
- **Audio**: Web Audio API
- **Networking**: HTML5 BroadcastChannel API
