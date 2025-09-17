
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');

    const TILE_SIZE = 20;
    let score = 0;
    let lastTime = 0;

    const layout = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 4, 1, 4, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 4, 4, 1, 0, 1, 4, 4, 4, 4, 4, 4, 4, 1, 0, 1, 4, 4, 1],
        [1, 1, 1, 1, 0, 1, 4, 1, 1, 4, 1, 1, 4, 1, 0, 1, 1, 1, 1],
        [4, 4, 4, 4, 0, 4, 4, 1, 4, 4, 4, 1, 4, 4, 0, 4, 4, 4, 4],
        [1, 1, 1, 1, 0, 1, 4, 1, 1, 1, 1, 1, 4, 1, 0, 1, 1, 1, 1],
        [1, 4, 4, 1, 0, 1, 4, 4, 4, 4, 4, 4, 4, 1, 0, 1, 4, 4, 1],
        [1, 1, 1, 1, 0, 1, 4, 1, 1, 1, 1, 1, 4, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 1],
        [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1],
        [1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    const ROWS = layout.length;
    const COLS = layout[0].length;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    const pacman = {
        x: 8 * TILE_SIZE + TILE_SIZE / 2,
        y: 17 * TILE_SIZE + TILE_SIZE / 2,
        dx: 0,
        dy: 0,
        speed: 80, // pixels per second
        radius: TILE_SIZE / 2 - 2,
        mouthOpen: 0.2,
        mouthSpeed: 0.05,
        angle: 0
    };

    const ghosts = [
        { x: 8, y: 9, dx: 1, dy: 0, color: 'red', id: 'blinky' },
        { x: 9, y: 9, dx: -1, dy: 0, color: 'pink', id: 'pinky' },
        { x: 10, y: 9, dx: 1, dy: 0, color: 'cyan', id: 'inky' },
        { x: 9, y: 8, dx: -1, dy: 0, color: 'orange', id: 'clyde' }
    ];
    ghosts.forEach(g => { g.moveTimer = 0; g.speed = 1.8; });

    function getTile(x, y) {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        // Handle wrapping for the horizontal tunnel
        if (col < 0) return layout[row][COLS - 1];
        if (col >= COLS) return layout[row][0];
        if (row < 0 || row >= ROWS) return 1; // Treat out of bounds as a wall
        return layout[row][col];
    }

    function isWall(x, y) {
        return getTile(x, y) === 1;
    }

    function drawMaze() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const tile = layout[row][col];
                ctx.fillStyle = '#000';
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                if (tile === 1) {
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (tile === 0) {
                    ctx.beginPath();
                    ctx.arc(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();
                } else if (tile === 2) {
                    ctx.beginPath();
                    ctx.arc(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFFF00';
                    ctx.fill();
                }
            }
        }
    }

    function drawPacman() {
        pacman.mouthOpen += pacman.mouthSpeed;
        if (pacman.mouthOpen > 0.4 || pacman.mouthOpen < 0.05) {
            pacman.mouthSpeed *= -1;
        }
        ctx.save();
        ctx.translate(pacman.x, pacman.y);
        ctx.rotate(pacman.angle);
        ctx.beginPath();
        ctx.arc(0, 0, pacman.radius, pacman.mouthOpen, Math.PI * 2 - pacman.mouthOpen);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = '#FFFF00';
        ctx.fill();
        ctx.restore();
    }

    function drawGhosts() {
        ghosts.forEach(ghost => {
            const x = ghost.x * TILE_SIZE + TILE_SIZE / 2;
            const y = ghost.y * TILE_SIZE + TILE_SIZE / 2;
            const radius = TILE_SIZE / 2 - 2;
            ctx.fillStyle = ghost.color;
            ctx.beginPath();
            ctx.arc(x, y, radius, Math.PI, 0);
            ctx.fillRect(x - radius, y, radius * 2, radius);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x - radius / 2.5, y - radius / 5, 2, 0, Math.PI * 2);
            ctx.arc(x + radius / 2.5, y - radius / 5, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function update(currentTime) {
        if (!lastTime) lastTime = currentTime;
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        updatePacman(deltaTime);
        updateGhosts(deltaTime);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
        drawPacman();
        drawGhosts();
        checkCollisions();

        requestAnimationFrame(update);
    }

    function updatePacman(deltaTime) {
        const moveDist = pacman.speed * deltaTime;
        const nextX = pacman.x + pacman.dx * moveDist;
        const nextY = pacman.y + pacman.dy * moveDist;

        // Wall collision detection
        if (!isWall(nextX + pacman.dx * pacman.radius, nextY + pacman.dy * pacman.radius)) {
            pacman.x = nextX;
            pacman.y = nextY;
        }

        // Handle horizontal tunnel wrapping
        if (pacman.x > canvas.width + pacman.radius) pacman.x = -pacman.radius;
        if (pacman.x < -pacman.radius) pacman.x = canvas.width + pacman.radius;

        eatPellet();
    }

    function updateGhosts(deltaTime) {
        ghosts.forEach(ghost => {
            ghost.moveTimer += deltaTime;
            if (ghost.moveTimer < 1 / ghost.speed) return;
            ghost.moveTimer = 0;

            const possibleMoves = [];
            // Check possible moves without turning back
            if (ghost.dx !== 1 && !isWall((ghost.x - 1) * TILE_SIZE, ghost.y * TILE_SIZE)) possibleMoves.push({ dx: -1, dy: 0 });
            if (ghost.dx !== -1 && !isWall((ghost.x + 1) * TILE_SIZE, ghost.y * TILE_SIZE)) possibleMoves.push({ dx: 1, dy: 0 });
            if (ghost.dy !== 1 && !isWall(ghost.x * TILE_SIZE, (ghost.y - 1) * TILE_SIZE)) possibleMoves.push({ dx: 0, dy: -1 });
            if (ghost.dy !== -1 && !isWall(ghost.x * TILE_SIZE, (ghost.y + 1) * TILE_SIZE)) possibleMoves.push({ dx: 0, dy: 1 });
            
            let move;
            // If there are choices, pick a random one that is not reversing direction
            if (possibleMoves.length > 0) {
                move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            } else {
                // Must reverse
                move = { dx: -ghost.dx, dy: -ghost.dy };
            }

            ghost.dx = move.dx;
            ghost.dy = move.dy;
            
            ghost.x += ghost.dx;
            ghost.y += ghost.dy;

            // Handle horizontal tunnel wrapping for ghosts
            if (ghost.x < 0) {
                ghost.x = COLS - 1;
            }
            if (ghost.x >= COLS) {
                ghost.x = 0;
            }
        });
    }

    function eatPellet() {
        const gridX = Math.floor(pacman.x / TILE_SIZE);
        const gridY = Math.floor(pacman.y / TILE_SIZE);

        if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;

        const tile = layout[gridY][gridX];
        if (tile === 0) {
            layout[gridY][gridX] = 4;
            score += 10;
            scoreEl.innerText = score;
        } else if (tile === 2) {
            layout[gridY][gridX] = 4;
            score += 50;
            scoreEl.innerText = score;
            // Add ghost frightening logic here
        }
    }

    function checkCollisions() {
        ghosts.forEach(ghost => {
            const ghostPixelX = ghost.x * TILE_SIZE + TILE_SIZE / 2;
            const ghostPixelY = ghost.y * TILE_SIZE + TILE_SIZE / 2;
            const dist = Math.hypot(pacman.x - ghostPixelX, pacman.y - ghostPixelY);

            if (dist < pacman.radius + TILE_SIZE / 2 - 2) {
                // Collision detected! Reset Pac-Man for now.
                pacman.x = 8 * TILE_SIZE + TILE_SIZE / 2;
                pacman.y = 17 * TILE_SIZE + TILE_SIZE / 2;
                pacman.dx = 0;
                pacman.dy = 0;
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp': pacman.dx = 0; pacman.dy = -1; pacman.angle = -Math.PI / 2; break;
            case 'ArrowDown': pacman.dx = 0; pacman.dy = 1; pacman.angle = Math.PI / 2; break;
            case 'ArrowLeft': pacman.dx = -1; pacman.dy = 0; pacman.angle = Math.PI; break;
            case 'ArrowRight': pacman.dx = 1; pacman.dy = 0; pacman.angle = 0; break;
        }
    });

    requestAnimationFrame(update);
});
