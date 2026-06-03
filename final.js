const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let gameState = 'PLAYING'; 
let currentLevel = 1;      
let cameraX = 0;
let ticks = 0;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, type, duration, startTime = 0) {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + startTime);
        osc.stop(audioCtx.currentTime + startTime + duration);
    } catch(e){}
}

function sfxJump() { playTone(150, 'square', 0.1); playTone(300, 'square', 0.15, 0.05); }
function sfxCoin() { playTone(987.77, 'sine', 0.08); playTone(1318.51, 'sine', 0.25, 0.08); }
function sfxBump() { playTone(80, 'triangle', 0.15); }
function sfxStomp() { playTone(120, 'sawtooth', 0.1); }
function sfxDie() { playTone(400, 'sawtooth', 0.1); playTone(300, 'sawtooth', 0.1, 0.1); playTone(200, 'sawtooth', 0.2, 0.2); }
function sfxVasco() {
    let notes = [261.63, 293.66, 329.63, 349.23, 392.00, 392.00, 349.23, 329.63, 293.66, 329.63, 349.23, 261.63];
    let durs = [0.15, 0.15, 0.15, 0.15, 0.3, 0.2, 0.15, 0.15, 0.15, 0.15, 0.3, 0.4];
    let time = 0;
    for(let i=0; i<notes.length; i++) {
        playTone(notes[i], 'square', durs[i], time);
        time += durs[i] + 0.02;
    }
}

const PALETTES = {
    1: { sky: '#8cd4fc', outline: '#142c5c', iceLight: '#3cb4fc', iceDark: '#1c6cc4', snow: '#ffffff', fishOrange: '#fc6c14', fishBlue: '#2484dc', water: '#0c448c' },
    2: { sky: '#fca47c', outline: '#44141c', iceLight: '#fc6c5c', iceDark: '#bc243c', snow: '#ffe4dc', fishOrange: '#24dcdc', fishBlue: '#fcbc14', water: '#340c24' },
    3: { sky: '#2c1c3c', outline: '#0c0414', iceLight: '#b45cfc', iceDark: '#6c24bc', snow: '#e4c4ff', fishOrange: '#fcbc14', fishBlue: '#24dcdc', water: '#14042c' },
    4: { sky: '#0c243c', outline: '#040c14', iceLight: '#2484dc', iceDark: '#144c9c', snow: '#dcdcfc', fishOrange: '#fc4414', fishBlue: '#24dcdc', water: '#040c24' }
};

const player = {
    x: 40, y: 100, width: 16, height: 16,
    vx: 0, vy: 0,
    accel: 0.1, friction: 0.88, maxSpeed: 1.8,
    gravity: 0.25, jumpForce: -5.5,
    isGrounded: false, facing: 'right',
    state: 'NORMAL'
};

const PENGUIN_SPRITE = [
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,2,1,0,0,0,0,0,0],
    [0,0,1,2,2,3,3,2,2,2,1,0,0,0,0,0],
    [0,0,1,2,3,1,3,3,2,2,4,1,0,0,0,0],
    [0,0,1,2,3,3,3,3,2,4,4,4,1,0,0,0],
    [0,0,0,1,2,3,3,3,2,2,4,4,1,0,0,0],
    [0,0,0,0,1,5,5,5,5,5,1,1,0,0,0,0],
    [0,0,0,1,5,5,5,5,5,5,1,0,0,0,0,0],
    [0,0,1,2,2,2,2,2,2,2,2,1,0,0,0,0],
    [0,1,2,2,3,3,2,2,2,2,2,2,1,0,0,0],
    [1,2,2,3,3,3,3,2,2,2,2,2,1,0,0,0],
    [1,2,2,3,3,3,3,2,2,2,2,2,1,0,0,0],
    [0,1,2,2,3,3,2,2,2,2,2,1,0,0,0,0],
    [0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0],
    [0,0,0,1,4,4,1,1,4,4,1,0,0,0,0,0],
    [0,0,0,1,4,4,1,1,4,4,1,0,0,0,0,0]
];

const FISH_SPRITE = [
    [0,0,0,0,0,1,1,1,0,0,0,0],
    [0,1,1,0,1,2,2,2,1,0,0,0],
    [1,2,2,1,2,2,3,2,2,1,0,0],
    [1,2,2,2,2,2,2,2,2,2,1,0],
    [1,2,2,2,2,2,2,2,2,2,1,0],
    [1,2,2,1,2,2,2,2,2,1,0,0],
    [0,1,1,0,1,2,2,2,1,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0]
];

const VASCO_FLAG_SPRITE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,3,1,1,1,1,1,1,1,1,1,0],
    [1,1,3,3,3,1,1,1,1,1,1,1,0,0],
    [1,1,1,3,1,1,4,4,1,1,1,0,0,0],
    [1,1,1,1,1,4,2,2,4,1,0,0,0,0],
    [1,1,1,1,4,2,4,4,2,4,0,0,0,0],
    [1,1,1,1,4,4,4,4,4,4,0,0,0,0],
    [1,1,1,1,4,2,4,4,2,4,0,0,0,0],
    [1,1,1,1,1,4,2,2,4,0,0,0,0,0],
    [1,1,1,1,1,1,4,4,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,0,0,0,0,0,0,0]
];

const ENEMY_SPRITE = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,3,3,3,3,3,3,1,0,0],
    [0,1,3,1,3,3,3,3,1,3,1,0],
    [1,3,3,3,3,3,3,3,3,3,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,3,3,1,1,1,1,3,3,1,0],
    [1,3,1,1,0,0,0,0,1,1,3,1],
    [1,1,0,0,0,0,0,0,0,0,1,1]
];

const JUMPING_SEAL_SPRITE = [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,3,3,3,3,1,0,0],
    [0,1,3,1,3,3,1,3,1,0],
    [0,1,3,3,3,3,3,3,1,0],
    [1,3,3,3,3,3,3,3,3,1],
    [1,3,1,3,3,3,3,1,3,1],
    [1,1,0,1,1,1,1,0,1,1],
    [0,0,0,1,1,1,1,0,0,0]
];

const keys = { left: false, right: false, up: false };
const TILE_SIZE = 16;

const MAPS = {
    1: [
        "............................................................",
        "............................................................",
        "............................................................",
        "............................................................",
        "......................?.?...................................",
        "............B.B......B...B..................B.B............",
        "............................................................",
        ".......B.B.............................F....................",
        "....................F....F........BB...BB...................",
        "...................BB...BB..............M...................",
        "....I..........................M........P....E..............",
        "GGGGGGGGGGWWGGGGGGGGGGGGGGGGGGGGWWGGGGGGGGWWGGGGGGGGGGGGGGGG"
    ],
    2: [
        "............................................................",
        "...................F........................................",
        ".................B...B..................F...................",
        ".......................................?.?..................",
        "..........?.?........................B.....B................",
        ".......................F....................................",
        "....B.B.............BB...BB.................................",
        "..................................B...B.M...................",
        "...........F....F...................................F.......",
        "..........BB...BB..................BBB.............BBB......",
        "....I...................M...................P....E..........",
        "GGGGGGGGGGWWGGGGGGGWWGGGGGGGGGGGWWGGGGGGGGWWGGGGGGGGGGGGGGGG"
    ],
    3: [
        "............................................................",
        "............................................................",
        "..........F..........F..........F..........F................",
        ".........?.?........?.?........?.?........?.?...............",
        "............................................................",
        "......B.......B..B.......B..B.......B..B.......B............",
        "............................................................",
        "....B...B..B.........B.......M...............B...B..........",
        "..........................F.......F.........................",
        ".........................BB.......BB........................",
        "....I.............M.........................P....E..........",
        "GGGGGGGGGGWWGGGGGGGGGGGGGGGGWWGGGGGGGGGGGGWWGGGGGGGGGGGGGGGG"
    ],
    4: [
        "............................................................",
        "....................................F.......................",
        "..................................BBBBB.....................",
        ".......................F....................................",
        "....................B..?...B.................F..............",
        "..........B...B............................B...B............",
        "..................................M.........................",
        "......B.B.......F...............F................B.B........",
        "...............BBB.............BBB..........................",
        ".......................M....................................",
        "....I.......................................P....E..........",
        "GGGGGGGGGGWWGGGGGGGGWWGGGGGGGGWWGGGGGGGGWWGGGGGGGGGGGGGGGGGG"
    ]
};

let platforms = [];
let collectibles = [];
let igloos = [];
let flagpoles = [];
let enemies = [];
let jumpingSeals = [];
let waterBlocks = [];

function buildMap() {
    platforms = [];
    collectibles = [];
    igloos = [];
    flagpoles = [];
    enemies = [];
    jumpingSeals = [];
    waterBlocks = [];
    
    let activeMap = MAPS[currentLevel];

    for (let row = 0; row < activeMap.length; row++) {
        for (let col = 0; col < activeMap[row].length; col++) {
            let char = activeMap[row][col];
            let px = col * TILE_SIZE;
            let py = row * TILE_SIZE;

            if (char === 'G' || char === 'B' || char === '?') {
                platforms.push({ x: px, y: py, w: TILE_SIZE, h: TILE_SIZE, type: char, hitAnim: 0, hasItem: char === '?' });
            } else if (char === 'W') {
                waterBlocks.push({ x: px, y: py, w: TILE_SIZE, h: TILE_SIZE });
                if (activeMap[row - 1] && activeMap[row - 1][col] === '.') {
                    jumpingSeals.push({
                        startX: px + 2,
                        startY: py + 4,
                        x: px + 2,
                        y: py + 20,
                        w: 10,
                        h: 8,
                        vy: 0,
                        state: 'WAITING',
                        timer: Math.floor(Math.random() * 120)
                    });
                }
            } else if (char === 'F') {
                collectibles.push({ x: px + 2, y: py + 4, w: 12, h: 8, active: true });
            } else if (char === 'I') {
                igloos.push({ x: px, y: py - 16, w: 32, h: 32, isEndGoal: false });
            } else if (char === 'E') {
                igloos.push({ x: px, y: py - 16, w: 32, h: 32, isEndGoal: true });
            } else if (char === 'P') {
                flagpoles.push({ x: px + 6, y: py - 64, w: 4, h: 80, flagY: py - 60 });
            } else if (char === 'M') {
                enemies.push({ x: px, y: py, w: 12, h: 8, vx: -0.5, alive: true, deathTimer: 0 });
            }
        }
    }
}

window.addEventListener('keydown', function(e) {
    initAudio();
    if (player.state !== 'NORMAL') return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.up = true;
    
    if ((gameState === 'GAMEOVER' || gameState === 'WIN') && e.code === 'Space') {
        resetGame();
    }
});

window.addEventListener('keyup', function(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.up = false;
});

function setupVirtualBtn(id, keyBind) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        initAudio();
        if (player.state !== 'NORMAL') return;
        keys[keyBind] = true;
        if (gameState === 'GAMEOVER' || gameState === 'WIN') resetGame();
    });
    btn.addEventListener('mouseup', function(e) { e.preventDefault(); keys[keyBind] = false; });
    btn.addEventListener('mouseleave', function(e) { e.preventDefault(); keys[keyBind] = false; });

    btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        initAudio();
        if (player.state !== 'NORMAL') return;
        keys[keyBind] = true;
        if (gameState === 'GAMEOVER' || gameState === 'WIN') resetGame();
    });
    btn.addEventListener('touchend', function(e) { e.preventDefault(); keys[keyBind] = false; });
}

function resetGame() {
    player.x = 40;
    player.y = 100;
    player.vx = 0;
    player.vy = 0;
    player.state = 'NORMAL';
    score = 0;
    currentLevel = 1;
    gameState = 'PLAYING';
    cameraX = 0;
    buildMap();
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.height > rect2.y;
}

function update() {
    if (gameState !== 'PLAYING') return;

    ticks++;

    if (player.state === 'FLAG_SLIDE') {
        player.vx = 0;
        player.vy = 1;
        player.y += player.vy;
        
        let pole = flagpoles[0];
        if (pole && pole.flagY < pole.y + pole.h - 16) {
            pole.flagY += 1.5;
        }

        if (player.y >= pole.y + pole.h - player.height) {
            player.y = pole.y + pole.h - player.height;
            player.state = 'WALK_TO_IGLOO';
        }
        return;
    }

    if (player.state === 'WALK_TO_IGLOO') {
        player.vx = 1;
        player.x += player.vx;
        player.facing = 'right';

        let goal = igloos.find(i => i.isEndGoal);
        if (goal && player.x >= goal.x + 4) {
            if (MAPS[currentLevel + 1]) {
                currentLevel++;
                player.x = 40;
                player.y = 100;
                player.vx = 0;
                player.vy = 0;
                player.state = 'NORMAL';
                cameraX = 0;
                buildMap();
            } else {
                gameState = 'WIN';
            }
        }
        return;
    }

    if (keys.left) {
        player.vx -= player.accel;
        if (player.vx < -player.maxSpeed) player.vx = -player.maxSpeed;
        player.facing = 'left';
    } else if (keys.right) {
        player.vx += player.accel;
        if (player.vx > player.maxSpeed) player.vx = player.maxSpeed;
        player.facing = 'right';
    } else {
        player.vx *= player.friction;
        if (Math.abs(player.vx) < 0.05) player.vx = 0;
    }

    if (keys.up && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
        sfxJump();
    }

    player.vy += player.gravity;

    player.x += player.vx;
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        if (checkCollision(player, p)) {
            if (player.vx > 0) player.x = p.x - player.width;
            if (player.vx < 0) player.x = p.x + p.w;
        }
    }

    player.y += player.vy;
    player.isGrounded = false;

    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        if (checkCollision(player, p)) {
            if (player.vy > 0) {
                player.y = p.y - player.height;
                player.vy = 0;
                player.isGrounded = true;
            } else if (player.vy < 0) {
                player.y = p.y + p.h;
                player.vy = 0;
                p.hitAnim = 4;
                sfxBump();
                if (p.type === '?' && p.hasItem) {
                    p.hasItem = false;
                    score += 10;
                    sfxCoin();
                }
            }
        }
        if (p.hitAnim > 0) p.hitAnim -= 0.5;
    }

    for (let i = 0; i < waterBlocks.length; i++) {
        if (checkCollision(player, waterBlocks[i])) {
            gameState = 'GAMEOVER';
            sfxDie();
        }
    }

    for (let i = 0; i < jumpingSeals.length; i++) {
        let s = jumpingSeals[i];
        if (s.state === 'WAITING') {
            s.timer--;
            if (s.timer <= 0) {
                s.state = 'JUMPING';
                s.vy = -6.5; 
            }
        } else if (s.state === 'JUMPING') {
            s.vy += 0.2; 
            s.y += s.vy;
            if (s.y > s.startY + 16) {
                s.y = s.startY + 16;
                s.state = 'WAITING';
                s.timer = 90 + Math.floor(Math.random() * 90);
            }
        }

        if (s.state === 'JUMPING' && checkCollision(player, s)) {
            gameState = 'GAMEOVER';
            sfxDie();
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (!e.alive) {
            if (e.deathTimer > 0) e.deathTimer--;
            continue;
        }

        e.x += e.vx;
        
        let turn = false;
        for (let j = 0; j < platforms.length; j++) {
            let p = platforms[j];
            if (e.x < p.x + p.w && e.x + e.w > p.x && e.y < p.y + p.h && e.y + e.h > p.y) {
                turn = true;
            }
        }
        if (turn) e.vx *= -1;

        if (checkCollision(player, e)) {
            if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 2) {
                e.alive = false;
                e.deathTimer = 30;
                player.vy = -3.5;
                score += 20;
                sfxStomp();
            } else {
                gameState = 'GAMEOVER';
                sfxDie();
            }
        }
    }

    for (let i = 0; i < collectibles.length; i++) {
        let c = collectibles[i];
        if (c.active && checkCollision(player, c)) {
            c.active = false;
            score += 10;
            sfxCoin();
        }
    }

    for (let i = 0; i < flagpoles.length; i++) {
        let pole = flagpoles[i];
        if (checkCollision(player, { x: pole.x, y: pole.y, w: pole.w, h: pole.h })) {
            player.state = 'FLAG_SLIDE';
            player.x = pole.x - 6;
            keys.left = false;
            keys.right = false;
            keys.up = false;
            sfxVasco();
        }
    }

    if (player.y > canvas.height) {
        gameState = 'GAMEOVER';
        sfxDie();
    }

    cameraX = player.x - 120;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > 640) cameraX = 640;
}

function draw() {
    let currentPalette = PALETTES[currentLevel];

    ctx.fillStyle = currentPalette.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(cameraX), 0);

    for (let i = 0; i < waterBlocks.length; i++) {
        let w = waterBlocks[i];
        ctx.fillStyle = currentPalette.water;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        let wave = Math.floor(Math.sin(ticks * 0.1 + w.x) * 2);
        ctx.fillRect(w.x, w.y + wave, w.w, 2);
    }

    for (let i = 0; i < jumpingSeals.length; i++) {
        let s = jumpingSeals[i];
        if (s.state === 'JUMPING') {
            ctx.save();
            ctx.translate(Math.floor(s.x), Math.floor(s.y));
            if (s.vy > 0) {
                ctx.scale(1, -1);
                ctx.translate(0, -8);
            }
            for (let r = 0; r < 8; r++) {
                for (let col = 0; col < 10; col++) {
                    let pId = JUMPING_SEAL_SPRITE[r][col];
                    if (pId === 0) continue;
                    if (pId === 1) ctx.fillStyle = currentPalette.outline;
                    else if (pId === 3) ctx.fillStyle = '#bcbcbc';
                    ctx.fillRect(col, r, 1, 1);
                }
            }
            ctx.restore();
        }
    }

    for (let i = 0; i < flagpoles.length; i++) {
        let pole = flagpoles[i];
        ctx.fillStyle = currentPalette.snow;
        ctx.fillRect(pole.x, pole.y, pole.w, pole.h);
        ctx.strokeStyle = currentPalette.outline;
        ctx.strokeRect(pole.x, pole.y, pole.w, pole.h);

        ctx.fillStyle = '#fcbc14';
        ctx.beginPath();
        ctx.arc(pole.x + 2, pole.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(pole.x + 4, Math.floor(pole.flagY));
        for (let r = 0; r < 11; r++) {
            for (let c = 0; c < 14; c++) {
                let pixel = VASCO_FLAG_SPRITE[r][c];
                if (pixel === 0) continue;
                if (pixel === 1) ctx.fillStyle = '#000000';
                else if (pixel === 2) ctx.fillStyle = '#ffffff';
                else if (pixel === 3) ctx.fillStyle = '#dc2434';
                else if (pixel === 4) ctx.fillStyle = currentPalette.outline;
                ctx.fillRect(c, r, 1, 1);
            }
        }
        ctx.restore();
    }

    for (let i = 0; i < igloos.length; i++) {
        let ig = igloos[i];
        ctx.fillStyle = currentPalette.snow;
        ctx.fillRect(ig.x, ig.y, ig.w, ig.h);
        ctx.strokeStyle = currentPalette.outline;
        ctx.strokeRect(ig.x, ig.y, ig.w, ig.h);
        
        ctx.fillStyle = currentPalette.outline;
        ctx.fillRect(ig.x + 10, ig.y + 16, 12, 16);
    }

    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        let offsetOffsetY = Math.floor(p.hitAnim) ? -2 : 0;
        
        if (p.type === 'G') {
            ctx.fillStyle = currentPalette.iceDark; 
        } else if (p.type === '?') {
            ctx.fillStyle = p.hasItem ? '#fcbc14' : '#bc8c24';
        } else {
            ctx.fillStyle = currentPalette.iceLight; 
        }
        
        ctx.fillRect(p.x, p.y + offsetOffsetY, p.w, p.h);
        ctx.strokeStyle = currentPalette.outline;
        ctx.strokeRect(p.x, p.y + offsetOffsetY, p.w, p.h);

        if (p.type === '?' && p.hasItem) {
            ctx.fillStyle = currentPalette.outline;
            ctx.font = "bold 10px monospace";
            ctx.fillText("?", p.x + 5, p.y + 12 + offsetOffsetY);
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (!e.alive && e.deathTimer <= 0) continue;

        ctx.save();
        ctx.translate(Math.floor(e.x), Math.floor(e.y));
        if (!e.alive) {
            ctx.scale(1, -0.3);
            ctx.translate(0, -16);
        }

        for (let r = 0; r < 8; r++) {
            for (let col = 0; col < 12; col++) {
                let pId = ENEMY_SPRITE[r][col];
                if (pId === 0) continue;
                if (pId === 1) ctx.fillStyle = currentPalette.outline;
                else if (pId === 3) ctx.fillStyle = '#fc4444';
                ctx.fillRect(col, r, 1, 1);
            }
        }
        ctx.restore();
    }

    for (let i = 0; i < collectibles.length; i++) {
        let c = collectibles[i];
        if (c.active) {
            ctx.save();
            let floatAnim = Math.floor(Math.sin(ticks * 0.1 + c.x) * 2);
            ctx.translate(c.x, c.y + floatAnim);

            for (let r = 0; r < 8; r++) {
                for (let col = 0; col < 12; col++) {
                    let pixelId = FISH_SPRITE[r][col];
                    if (pixelId === 0) continue;

                    if (pixelId === 1) ctx.fillStyle = currentPalette.outline;
                    else if (pixelId === 2) ctx.fillStyle = currentPalette.fishOrange;
                    else if (pixelId === 3) ctx.fillStyle = currentPalette.snow; 

                    ctx.fillRect(col, r, 1, 1);
                }
            }
            ctx.restore();
        }
    }

    ctx.save();
    ctx.translate(Math.floor(player.x), Math.floor(player.y));
    
    if (player.facing === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-16, 0); 
    }

    let isMoving = Math.abs(player.vx) > 0.1 || player.state === 'WALK_TO_IGLOO';
    let walkFrame = isMoving ? Math.floor(ticks / 6) % 2 : 0;

    for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
            let colorId = PENGUIN_SPRITE[row][col];
            
            if (isMoving && walkFrame === 1) {
                if (row === 14 || row === 15) {
                    if (col >= 4 && col <= 6) continue;
                }
            }
            if (!player.isGrounded && player.state === 'NORMAL') {
                if (row === 9 || row === 10) {
                    if (col === 0 || col === 15) colorId = 1;
                }
            }

            if (colorId === 0) continue; 

            if (colorId === 1) ctx.fillStyle = currentPalette.outline;
            else if (colorId === 2) ctx.fillStyle = currentPalette.iceDark;
            else if (colorId === 3) ctx.fillStyle = currentPalette.snow;
            else if (colorId === 4) ctx.fillStyle = currentPalette.fishOrange;
            else if (colorId === 5) ctx.fillStyle = '#dc2434'; 

            ctx.fillRect(col, row, 1, 1); 
        }
    }
    ctx.restore(); 

    ctx.restore(); 

    ctx.fillStyle = currentPalette.outline;
    ctx.font = "bold 11px monospace";
    ctx.fillText("PONTOS: " + score, 10, 20);
    ctx.fillText("MISSAO: " + currentLevel, 250, 20);

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(20, 44, 92, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = currentPalette.snow;
        ctx.font = "bold 16px monospace";
        ctx.textAlign = 'center';
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "10px monospace";
        ctx.fillText("Pressione ESPAÇO para tentar de novo", canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = 'left';
    }

    if (gameState === 'WIN') {
        ctx.fillStyle = 'rgba(28, 108, 196, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = currentPalette.snow;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = 'center';
        ctx.fillText("CAMPANHA CONCLUIDA!", canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = "11px monospace";
        ctx.fillText("CR Vasco da Gama campeão mundial!", canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText("Pressione ESPAÇO para reiniciar", canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

buildMap();
setupVirtualBtn('ctrl-left', 'left');
setupVirtualBtn('ctrl-right', 'right');
setupVirtualBtn('ctrl-up', 'up');
setupVirtualBtn('ctrl-a', 'up');
setupVirtualBtn('ctrl-b', 'up');

gameLoop();