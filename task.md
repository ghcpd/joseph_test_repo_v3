**Task:**
Create a browser-based implementation of the **2048 puzzle game**.

**Requirements:**

1. **Game Board:**

   * Implement a 4×4 grid board.
   * Tiles should contain numbers that are powers of 2 (2, 4, 8, …, 2048).
   * Tiles slide smoothly when moved.

2. **Gameplay Mechanics:**

   * Player can move tiles **up, down, left, right** using keyboard arrow keys (optionally WASD).
   * When two tiles with the same value collide, they merge into a single tile with double the value.
   * After every move, a new tile (2 or 4) is randomly spawned in an empty cell.
   * If no valid moves remain, the game ends.

3. **Scoring System:**

   * Add points equal to the value of the merged tile.
   * Display the **current score** and **best score** on the screen.

4. **Win/Loss Conditions:**

   * The player wins if they reach the **2048 tile**.
   * Display a “You Win” message with the option to continue playing.
   * Display a “Game Over” message when no moves are possible.

5. **UI/UX Requirements:**

   * Clean and minimalistic design similar to the original 2048 game.
   * Animate tile movements and merging for smooth gameplay.
   * Include **Restart button** to reset the game.
   * Make it responsive and playable on desktop and mobile browsers.

6. **Implementation Notes:**

   * Use **plain JavaScript with HTML/CSS**, or optionally React.
   * All logic should run in the browser without a backend.

7. **Optional Enhancements:**

   * Add **undo button** (one-step back).
   * Add **different board sizes** (e.g., 5×5, 6×6).
   * Support **dark/light themes**.

