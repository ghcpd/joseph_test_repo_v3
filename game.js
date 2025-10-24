class Game2048 {
    constructor() {
        this.gridSize = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameWon = false;
        this.gameContinue = false;
        
        this.initializeDOM();
        this.setupEventListeners();
        this.newGame();
    }

    initializeDOM() {
        this.gridContainer = document.getElementById('grid-container');
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        this.restartButton = document.getElementById('restart-button');
        this.tryAgainButton = document.getElementById('try-again-button');
        this.continueButton = document.getElementById('continue-button');

        // Create grid cells
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            this.gridContainer.appendChild(cell);
        }

        this.updateBestScore();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.restartButton.addEventListener('click', () => this.newGame());
        this.tryAgainButton.addEventListener('click', () => this.newGame());
        this.continueButton.addEventListener('click', () => this.continueGame());

        // Touch support for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        });
    }

    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const minSwipeDistance = 30;

        if (Math.abs(diffX) < minSwipeDistance && Math.abs(diffY) < minSwipeDistance) {
            return;
        }

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                this.move('right');
            } else {
                this.move('left');
            }
        } else {
            // Vertical swipe
            if (diffY > 0) {
                this.move('down');
            } else {
                this.move('up');
            }
        }
    }

    handleKeyPress(event) {
        if (this.gameMessage.classList.contains('visible') && !this.gameContinue) {
            return;
        }

        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };

        const direction = keyMap[event.key];
        if (direction) {
            event.preventDefault();
            this.move(direction);
        }
    }

    newGame() {
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.gameWon = false;
        this.gameContinue = false;
        this.updateScore();
        this.hideMessage();
        this.clearTiles();
        
        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    continueGame() {
        this.gameContinue = true;
        this.hideMessage();
    }

    createEmptyGrid() {
        return Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
            return { row, col, value: this.grid[row][col], isNew: true };
        }
        return null;
    }

    move(direction) {
        let moved = false;
        const previousGrid = JSON.parse(JSON.stringify(this.grid));
        const mergedTiles = [];

        if (direction === 'up') {
            moved = this.moveUp(mergedTiles);
        } else if (direction === 'down') {
            moved = this.moveDown(mergedTiles);
        } else if (direction === 'left') {
            moved = this.moveLeft(mergedTiles);
        } else if (direction === 'right') {
            moved = this.moveRight(mergedTiles);
        }

        if (moved) {
            const newTile = this.addRandomTile();
            this.render(mergedTiles, newTile);
            
            if (!this.gameContinue && !this.gameWon && this.checkWin()) {
                this.gameWon = true;
                setTimeout(() => this.showWinMessage(), 300);
            } else if (this.isGameOver()) {
                setTimeout(() => this.showGameOverMessage(), 300);
            }
        }
    }

    moveLeft(mergedTiles) {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const originalRow = [...this.grid[row]];
            const newRow = this.slideAndMerge(this.grid[row], mergedTiles, row, 'left');
            this.grid[row] = newRow;
            if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
                moved = true;
            }
        }
        return moved;
    }

    moveRight(mergedTiles) {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const originalRow = [...this.grid[row]];
            const reversed = [...this.grid[row]].reverse();
            const newRow = this.slideAndMerge(reversed, mergedTiles, row, 'right').reverse();
            this.grid[row] = newRow;
            if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
                moved = true;
            }
        }
        return moved;
    }

    moveUp(mergedTiles) {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            for (let row = 0; row < this.gridSize; row++) {
                column.push(this.grid[row][col]);
            }
            const originalColumn = [...column];
            const newColumn = this.slideAndMerge(column, mergedTiles, col, 'up');
            for (let row = 0; row < this.gridSize; row++) {
                this.grid[row][col] = newColumn[row];
            }
            if (JSON.stringify(originalColumn) !== JSON.stringify(newColumn)) {
                moved = true;
            }
        }
        return moved;
    }

    moveDown(mergedTiles) {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            for (let row = 0; row < this.gridSize; row++) {
                column.push(this.grid[row][col]);
            }
            const originalColumn = [...column];
            const reversed = [...column].reverse();
            const newColumn = this.slideAndMerge(reversed, mergedTiles, col, 'down').reverse();
            for (let row = 0; row < this.gridSize; row++) {
                this.grid[row][col] = newColumn[row];
            }
            if (JSON.stringify(originalColumn) !== JSON.stringify(newColumn)) {
                moved = true;
            }
        }
        return moved;
    }

    slideAndMerge(line, mergedTiles, index, direction) {
        // Remove zeros
        const filtered = line.filter(val => val !== 0);
        const merged = [];
        let i = 0;

        while (i < filtered.length) {
            if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
                const mergedValue = filtered[i] * 2;
                merged.push(mergedValue);
                this.score += mergedValue;
                
                // Track merged tile position
                let row, col;
                if (direction === 'left') {
                    row = index;
                    col = merged.length - 1;
                } else if (direction === 'right') {
                    row = index;
                    col = this.gridSize - merged.length;
                } else if (direction === 'up') {
                    row = merged.length - 1;
                    col = index;
                } else if (direction === 'down') {
                    row = this.gridSize - merged.length;
                    col = index;
                }
                mergedTiles.push({ row, col, value: mergedValue });
                
                i += 2;
            } else {
                merged.push(filtered[i]);
                i += 1;
            }
        }

        // Fill with zeros
        while (merged.length < this.gridSize) {
            merged.push(0);
        }

        this.updateScore();
        return merged;
    }

    checkWin() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    isGameOver() {
        // Check for empty cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }

        // Check for possible merges
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const current = this.grid[row][col];
                // Check right
                if (col < this.gridSize - 1 && current === this.grid[row][col + 1]) {
                    return false;
                }
                // Check down
                if (row < this.gridSize - 1 && current === this.grid[row + 1][col]) {
                    return false;
                }
            }
        }

        return true;
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
            this.updateBestScore();
        }
    }

    updateBestScore() {
        this.bestScoreElement.textContent = this.bestScore;
    }

    loadBestScore() {
        return parseInt(localStorage.getItem('2048-best-score') || '0');
    }

    saveBestScore() {
        localStorage.setItem('2048-best-score', this.bestScore.toString());
    }

    showWinMessage() {
        this.messageText.textContent = 'You Win!';
        this.continueButton.style.display = 'inline-block';
        this.gameMessage.classList.add('visible');
    }

    showGameOverMessage() {
        this.messageText.textContent = 'Game Over!';
        this.continueButton.style.display = 'none';
        this.gameMessage.classList.add('visible');
    }

    hideMessage() {
        this.gameMessage.classList.remove('visible');
    }

    clearTiles() {
        this.tileContainer.innerHTML = '';
    }

    render(mergedTiles = [], newTile = null) {
        this.clearTiles();

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const tile = this.createTile(row, col, value);
                    
                    // Check if this tile was just merged
                    const wasMerged = mergedTiles.some(t => t.row === row && t.col === col && t.value === value);
                    if (wasMerged) {
                        tile.classList.add('tile-merged');
                    }
                    
                    // Check if this is a new tile
                    if (newTile && newTile.row === row && newTile.col === col && newTile.isNew) {
                        tile.classList.add('tile-new');
                    }
                    
                    this.tileContainer.appendChild(tile);
                }
            }
        }
    }

    createTile(row, col, value) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.classList.add(`tile-${value}`);
        if (value > 2048) {
            tile.classList.add('tile-super');
        }
        tile.textContent = value;

        const cellSize = (this.tileContainer.offsetWidth - (this.gridSize + 1) * 15) / this.gridSize;
        const posX = col * (cellSize + 15);
        const posY = row * (cellSize + 15);

        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        tile.style.left = `${posX}px`;
        tile.style.top = `${posY}px`;

        return tile;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
