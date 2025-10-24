# 2048 Game

A browser-based implementation of the popular 2048 puzzle game built with vanilla JavaScript, HTML, and CSS.

## 🎮 Play Now

Simply open `index.html` in your web browser to start playing!

## ✨ Features

### Core Gameplay
- **4×4 Grid Board**: Classic 2048 game board layout
- **Tile Movement**: Smooth tile sliding animations in all four directions
- **Tile Merging**: Tiles with the same value merge when they collide
- **Random Tile Spawning**: New tiles (2 or 4) appear after each move

### Controls
- **Arrow Keys**: ↑ ↓ ← → to move tiles
- **WASD Keys**: Alternative controls (W/A/S/D)
- **Touch Support**: Swipe gestures for mobile devices

### Scoring System
- Points awarded equal to the value of merged tiles
- **Current Score**: Tracks your score for the current game
- **Best Score**: Automatically saved to local storage and persists across sessions

### Win/Loss Conditions
- **Win Condition**: Reach the 2048 tile
- **Win Message**: "You Win!" with option to continue playing
- **Loss Detection**: Game detects when no valid moves remain
- **Game Over Message**: "Game Over!" with option to restart

### UI/UX
- **Clean Design**: Minimalistic interface inspired by the original 2048
- **Smooth Animations**: Tile movements and merges are animated
- **Color-Coded Tiles**: Each tile value has a unique color scheme
  - 2, 4: Beige tones
  - 8, 16, 32, 64: Orange to red gradient
  - 128, 256, 512: Yellow tones
  - 1024, 2048: Gold tones
  - Higher values: Dark theme
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Restart Button**: "New Game" button to start fresh anytime

## 🚀 How to Play

1. Use arrow keys (or WASD) to move tiles
2. When two tiles with the same number touch, they merge into one
3. Keep merging tiles to reach 2048
4. The game ends when no valid moves are possible

## 📁 Project Structure

```
.
├── index.html    # Main HTML structure
├── styles.css    # Styling and animations
├── game.js       # Game logic and mechanics
└── README.md     # This file
```

## 🛠️ Technical Details

- **No Dependencies**: Pure vanilla JavaScript, HTML5, and CSS3
- **Local Storage**: Best score persists across browser sessions
- **Client-Side Only**: No backend required
- **Browser Compatibility**: Works in all modern browsers

## 📱 Responsive Design

The game automatically adapts to different screen sizes:
- Desktop: Full-sized tiles with larger fonts
- Mobile (< 520px): Adjusted tile sizes and fonts
- Small Mobile (< 400px): Further optimized for small screens

## 🎨 Customization

The game can be easily customized by modifying:
- **Tile Colors**: Edit `.tile-*` classes in `styles.css`
- **Board Size**: Modify `gridSize` in `game.js` (currently 4×4)
- **Animation Speed**: Adjust transition durations in `styles.css`
- **Spawn Probability**: Change the 90/10 split for 2 vs 4 tiles in `game.js`

## 🧪 Testing

The game has been tested for:
- ✅ Tile movement in all four directions
- ✅ Correct merging behavior
- ✅ Score calculation and tracking
- ✅ Win condition detection (2048 tile)
- ✅ Game over detection
- ✅ Responsive design on multiple screen sizes
- ✅ Touch/swipe support on mobile devices
- ✅ Best score persistence
- ✅ Security vulnerabilities (CodeQL scan: 0 issues)

## 📄 License

This implementation is created for educational and demonstration purposes.

## 🎯 Requirements Met

This implementation fulfills all specified requirements:

1. ✅ **Game Board**: 4×4 grid with power-of-2 tiles
2. ✅ **Gameplay Mechanics**: Arrow/WASD controls, merging, random spawning, game over detection
3. ✅ **Scoring System**: Current score and best score display
4. ✅ **Win/Loss Conditions**: Win message at 2048, continue option, game over detection
5. ✅ **UI/UX**: Clean design, animations, restart button, responsive layout
6. ✅ **Implementation**: Plain JavaScript, HTML, CSS - runs entirely in browser
7. ✅ **Security**: No vulnerabilities detected by CodeQL analysis

## 🖼️ Screenshots

### Initial Game State
![Initial State](https://github.com/user-attachments/assets/1b3c192c-325e-4d81-ada7-758c3938bd0c)

### After First Move
![After Move](https://github.com/user-attachments/assets/d6e48304-226e-40bf-a500-2ede27fddd5a)

### Tiles Merging
![Merging](https://github.com/user-attachments/assets/56f59a0b-7e7e-4b6f-8e73-8d401b2d5c27)

### Mobile View
![Mobile](https://github.com/user-attachments/assets/e7c6fd87-e60b-4b74-ae20-ad078409bbe2)

### Gameplay with Higher Tiles
![Gameplay](https://github.com/user-attachments/assets/03965063-431a-4a86-abce-6eb64427765b)
