const p1 = document.getElementById('player1');
const p2 = document.getElementById('player2');
const p1Bar = document.getElementById('p1-health');
const p2Bar = document.getElementById('p2-health');
const overlay = document.getElementById('game-over-overlay');
const winnerLabel = document.getElementById('winner-text');

let p1Pos = 50; 
let p2Pos = 50; 
let p1Health = 100;
let p2Health = 100;
let p1Jumping = false;
let p2Jumping = false;
let gameActive = true;

const keys = {};
const speed = 10; 
const bodyWidth = 150; 

// Initial Styles
p1.style.bottom = '30px';
p2.style.bottom = '30px';

window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function gameLoop() {
    if (!gameActive) return; 

    let p1Move = 0;
    let p2Move = 0;

    if (keys['d']) p1Move = speed;
    if (keys['a']) p1Move = -speed;
    if (keys['arrowleft']) p2Move = speed;
    if (keys['arrowright']) p2Move = -speed;

    // --- TEKKEN COLLISION ---
    const p1RightEdge = p1Pos + bodyWidth;
    const p2LeftEdge = window.innerWidth - (p2Pos + bodyWidth);
    const isTouching = p1RightEdge + p1Move >= p2LeftEdge - p2Move;
    
    if (isTouching && !p1Jumping && !p2Jumping) {
        if (p1Move > 0) p1Move = 0;
        if (p2Move > 0) p2Move = 0;
    }

    // --- SCREEN WALLS ---
    if (p1Pos + p1Move < 0 || p1Pos + p1Move > window.innerWidth - 350) p1Move = 0;
    if (p2Pos + p2Move < 0 || p2Pos + p2Move > window.innerWidth - 350) p2Move = 0;

    p1Pos += p1Move;
    p2Pos += p2Move;
    p1.style.left = p1Pos + 'px';
    p2.style.right = p2Pos + 'px';

    updateAnimations(p1Move, p2Move);
    handleJumping();
    checkGameOver();

    requestAnimationFrame(gameLoop);
}

function updateAnimations(p1Move, p2Move) {
    if (p1Move !== 0) p1.style.backgroundPosition = '-400px 0px';
    else if (keys['j']) { p1.style.backgroundPosition = '-800px 0px'; checkHit('p1'); }
    else p1.style.backgroundPosition = '0px 0px';

    if (p2Move !== 0) p2.style.backgroundPosition = '-800px 0px';
    else if (keys['1']) { p2.style.backgroundPosition = '-400px 0px'; checkHit('p2'); }
    else p2.style.backgroundPosition = '-1200px 0px';
}

function checkHit(attacker) {
    const r1 = p1.getBoundingClientRect();
    const r2 = p2.getBoundingClientRect();
    const dist = Math.abs(r1.left - r2.left);

    if (dist < 230) {
        if (attacker === 'p1') {
            p2Health -= 2;
            p2Bar.style.width = p2Health + "%";
            if (p2Pos > 20) p2Pos -= 10; 
        } else {
            p1Health -= 2;
            p1Bar.style.width = p1Health + "%";
            if (p1Pos > 20) p1Pos -= 10;
        }
    }
}

function handleJumping() {
    if (keys['w'] && !p1Jumping) {
        p1Jumping = true;
        p1.style.bottom = '350px';
        setTimeout(() => { p1.style.bottom = '30px'; setTimeout(() => p1Jumping = false, 300); }, 400);
    }
    if (keys['arrowup'] && !p2Jumping) {
        p2Jumping = true;
        p2.style.bottom = '350px';
        setTimeout(() => { p2.style.bottom = '30px'; setTimeout(() => p2Jumping = false, 300); }, 400);
    }
}

function checkGameOver() {
    if (p1Health <= 0 || p2Health <= 0) {
        gameActive = false;
        overlay.style.display = 'flex'; 
        winnerLabel.innerText = p1Health <= 0 ? "PLAYER 2 WINS" : "PLAYER 1 WINS";
    }
}

function resetGame() {
    location.reload(); 
}

gameLoop();