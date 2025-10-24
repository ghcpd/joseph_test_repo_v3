# 2048 Puzzle – Browser Edition

A modern, responsive implementation of the classic **2048** puzzle built with Vite, vanilla JavaScript, and CSS. Slide numbered tiles with your keyboard or by swiping, combine matching values, and race toward the fabled 2048 tile while chasing high scores.

## Features

- **Authentic gameplay**: 4×4 grid, smooth tile sliding, merging, and random tile spawning.
- **Scoring & persistence**: Tracks current points and stores the best score in `localStorage`.
- **Win & loss states**: Celebrates reaching 2048 with a “Keep Playing” option and clearly signals when no moves remain.
- **Responsive UI**: Scales gracefully from mobile touch devices to desktop displays with animated tiles and polished styling.
- **Keyboard & touch controls**: Supports arrow keys, WASD, and swipe gestures on touch-enabled devices.
- **Accessible feedback**: Live regions announce score changes and overlays ensure outcomes are obvious.

## Getting Started

> Requires **Node.js 18+**.

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Testing

Unit tests cover board manipulation, merge behaviour, win blocking, game-over detection, and deterministic tile spawns.

```bash
npm run test
```

## Project Structure

```
/
├─ index.html          # Root HTML shell injected by Vite
├─ src/
│  ├─ game.js          # Core 2048 engine and board logic
│  ├─ main.js          # DOM bindings, input handling, animations
│  ├─ style.css        # Game board styling and animations
│  └─ game.test.js     # Vitest suite for core mechanics
└─ public/
   └─ vite.svg         # Favicon
```

## Security Notes

- Development and test tooling explicitly override `esbuild` to `^0.25.11`, eliminating a known request-smuggling vulnerability (GHSA-67mh-4wv8-2f99).
- No external network calls or backend services are required; all logic executes client-side.

Enjoy the puzzle! 🎉
