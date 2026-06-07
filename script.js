const p1 = document.getElementById('player1');
const p1Bar = document.getElementById('p1-health');
const overlay = document.getElementById('game-over-overlay');
const winnerLabel = document.getElementById('winner-text');

let p1Pos = 200;
let p1Jumping = false;
let currentFrame = 0;
let playerSpeed = 0;
let currentAction = 'idle';
let actionTimer = 0;
let jumpProgress = 0;
let lastTime = 0;
let gameActive = true;
let punchToggle = false;
let airAction = 'none';
let airActionTimer = 0;
let queuedAirAction = 'none';

const keys = {};
const moveSpeed = 5;
const frameWidth = 64;
const jumpHeight = 220;
const jumpDuration = 600;

// Initial Styles
p1.style.bottom = '40px';
setFrame(p1, currentFrame);

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'd') {
        playerSpeed = moveSpeed;
        if (currentAction !== 'jump' && currentAction !== 'punch' && currentAction !== 'kick' && currentAction !== 'super' && currentAction !== 'crouch') {
            currentAction = 'walk';
        }
        p1.style.backgroundImage = "url('pebbles character/pebbles_right.png')";
    } else if (key === 'a') {
        playerSpeed = -moveSpeed;
        if (currentAction !== 'jump' && currentAction !== 'punch' && currentAction !== 'kick' && currentAction !== 'super' && currentAction !== 'crouch') {
            currentAction = 'walk';
        }
        p1.style.backgroundImage = "url('pebbles character/pebbles_left.png')";
    } else if (key === 'f') {
        if (currentAction === 'jump') {
            airAction = 'punch';
            airActionTimer = 0;
            punchToggle = !punchToggle;
        } else {
            currentAction = 'punch';
            actionTimer = 0;
            playerSpeed = 0;
            punchToggle = !punchToggle;
        }
    } else if (key === 'g') {
        if (currentAction === 'jump') {
            airAction = 'kick';
            airActionTimer = 0;
        } else {
            currentAction = 'kick';
            actionTimer = 0;
            playerSpeed = 0;
        }
    } else if (key === 'w') {
        if (currentAction !== 'jump') {
            currentAction = 'jump';
            airAction = 'none';
            airActionTimer = 0;
            queuedAirAction = 'none';
            queuedAirActionDelay = 0;
            actionTimer = 0;
            jumpProgress = 0;
            p1Jumping = true;
        }
    } else if (key === 's') {
        if (currentAction !== 'jump') {
            currentAction = 'crouch';
            playerSpeed = 0;
        }
    } else if (key === 'r') {
        if (currentAction !== 'jump') {
            currentAction = 'jump';
            airAction = 'none';
            airActionTimer = 0;
            queuedAirAction = 'super';
            actionTimer = 0;
            jumpProgress = 0;
            p1Jumping = true;
        } else {
            queuedAirAction = 'super';
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;

    if (key === 'd' || key === 'a') {
        playerSpeed = 0;
        if (currentAction === 'walk') {
            currentAction = 'idle';
            currentFrame = 0;
            setFrame(p1, currentFrame);
        }
    }
    if (key === 's' && currentAction === 'crouch') {
        currentAction = 'idle';
        p1.classList.remove('crouch');
    }
});

function gameLoop(timestamp) {
    if (!gameActive) return;
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    updateMovement();

    let p1Move = playerSpeed;
    if (p1Pos + p1Move < 0 || p1Pos + p1Move > window.innerWidth - 100) p1Move = 0;
    p1Pos += p1Move;
    p1.style.left = p1Pos + 'px';

    actionTimer += delta;
    airActionTimer += delta;
    updateActionState(delta);
    updateAnimations();
    checkGameOver();

    requestAnimationFrame(gameLoop);
}

function updateMovement() {
    if (currentAction === 'jump') {
        // Full air control — allow A/D to change direction mid-jump.
        if (keys['d']) {
            playerSpeed = moveSpeed;
            p1.style.backgroundImage = "url('pebbles character/pebbles_right.png')";
        } else if (keys['a']) {
            playerSpeed = -moveSpeed;
            p1.style.backgroundImage = "url('pebbles character/pebbles_left.png')";
        } else {
            playerSpeed = 0;
        }
        return;
    }

    if (keys['d']) {
        playerSpeed = moveSpeed;
        p1.style.backgroundImage = "url('pebbles character/pebbles_right.png')";
        if (currentAction !== 'crouch' && currentAction !== 'punch' && currentAction !== 'kick' && currentAction !== 'super') {
            currentAction = 'walk';
        }
    } else if (keys['a']) {
        playerSpeed = -moveSpeed;
        p1.style.backgroundImage = "url('pebbles character/pebbles_left.png')";
        if (currentAction !== 'crouch' && currentAction !== 'punch' && currentAction !== 'kick' && currentAction !== 'super') {
            currentAction = 'walk';
        }
    } else {
        if (currentAction !== 'jump' && currentAction !== 'punch' && currentAction !== 'kick' && currentAction !== 'super' && currentAction !== 'crouch') {
            currentAction = 'idle';
            playerSpeed = 0;
        }
    }
}

function updateActionState(delta) {
    if (currentAction === 'jump') {
        jumpProgress += delta / jumpDuration;
        const progress = Math.min(jumpProgress, 1);
        const height = Math.sin(Math.PI * progress) * jumpHeight;
        p1.style.bottom = `${40 + height}px`;

        if (queuedAirAction === 'super' && jumpProgress > 0.75 && airAction === 'none') {
            airAction = queuedAirAction;
            queuedAirAction = 'none';
            airActionTimer = 0;
        }

        if (airAction !== 'none' && airActionTimer > 400) {
            airAction = 'none';
        }

        if (jumpProgress >= 1) {
            p1Jumping = false;
            p1.style.bottom = '40px';
            jumpProgress = 0;
            actionTimer = 0;
            airAction = 'none';
            airActionTimer = 0;
            if (keys['d']) {
                playerSpeed = moveSpeed;
                currentAction = 'walk';
            } else if (keys['a']) {
                playerSpeed = -moveSpeed;
                currentAction = 'walk';
            } else {
                playerSpeed = 0;
                currentAction = 'idle';
            }
        }
        return;
    }

    if (currentAction === 'punch' || currentAction === 'kick') {
        if (actionTimer > 400) {
            currentAction = playerSpeed !== 0 ? 'walk' : 'idle';
            actionTimer = 0;
        }
    } else if (currentAction === 'super') {
        if (actionTimer > 600) {
            currentAction = playerSpeed !== 0 ? 'walk' : 'idle';
            actionTimer = 0;
        }
    } else if (currentAction === 'walk' && playerSpeed === 0) {
        currentAction = 'idle';
    }
}

function updateAnimations() {
    p1.classList.remove('running', 'attack', 'crouch');
    p1.style.filter = '';

    if (currentAction === 'jump') {
        if (airAction === 'punch') {
            currentFrame = punchToggle ? 2 : 3;
            p1.classList.add('attack');
        } else if (airAction === 'kick') {
            currentFrame = airActionTimer < 200 ? 4 : 5;
            p1.classList.add('attack');
        } else if (airAction === 'super') {
            currentFrame = 8; // use the 9th frame in the sheet (0-based index)
            p1.classList.add('attack');
        } else {
            currentFrame = jumpProgress < 0.5 ? 6 : 7;
        }
    } else if (currentAction === 'punch') {
        currentFrame = punchToggle ? 2 : 3;
        p1.classList.add('attack');
    } else if (currentAction === 'kick') {
        currentFrame = actionTimer < 200 ? 4 : 5;
        p1.classList.add('attack');
    } else if (currentAction === 'super') {
        currentFrame = 8; // use the 9th frame in the sheet (0-based index)
        p1.classList.add('attack');
    } else if (currentAction === 'walk') {
        currentFrame = Math.floor(Date.now() / 200) % 2;
        p1.classList.add('running');
    } else if (currentAction === 'crouch') {
        currentFrame = 0;
        p1.classList.add('crouch');
    } else {
        currentFrame = Math.floor(Date.now() / 400) % 2;
    }

    setFrame(p1, currentFrame);
}

function setFrame(character, frameIndex) {
    const newXPosition = -(frameIndex * frameWidth);
    character.style.backgroundPosition = `${newXPosition}px 0px`;
}

function checkGameOver() {
    // Single-player test mode: no opponent game over logic.
}

function resetGame() {
    location.reload();
}

requestAnimationFrame(gameLoop);