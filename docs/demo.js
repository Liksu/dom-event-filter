import { DomEventFilter } from "https://unpkg.com/dom-event-filter@latest/index.js";

const filter = new DomEventFilter({
    save: { code: 'KeyS', ctrlKey: true },
    open: { code: 'KeyO', altKey: true },

    game: {
        jump: { code: 'Space' },
        arrowJump: { key: 'ArrowUp' },
        shoot: { key: 'Control' },
        xShoot: { code: 'KeyX' },
        speedUp: { code: 'Equal' },
        speedDown: { code: 'Minus' },
        numSpeedUp: { code: 'NumpadAdd' },
        numSpeedDown: { code: 'NumpadSubtract' },
        arrowDown: { key: 'ArrowDown' },
        touchStart: { type: 'touchstart', target: '#game-canvas' },
        touchEnd: { type: 'touchend', target: '#game-canvas' },
        focusArena: { type: 'click', target: '#game-area' }
    },

    editor: {
        save: { code: 'KeyS', ctrlKey: true },
        autocomplete: [{ code: 'Tab' }, { code: 'Tab' }],
        toolbar: {
            bold:     { type: 'click',  target: '[data-action="bold"]' },
            italic:   { type: 'click',  target: '[data-action="italic"]' },
            fontSize: { type: 'change', target: '[data-action="fontSize"]' }
        },
        canvas: {
            focusBody: { type: 'focusin', target: '#editor-canvas' },
            blurBody: { type: 'focusout', target: '#editor-canvas' },
            editBody: { type: 'input', target: '#editor-canvas' }
        }
    },

    form: {
        profile: {
            focusName: { type: 'focusin', target: '#register-name' },
            focusEmail: { type: 'focusin', target: '#register-email' },
            validateName: { type: 'change', target: '#register-name' },
            validateEmail: { type: 'change', target: '#register-email' }
        },
        security: {
            focusPassword: { type: 'focusin', target: '#register-password' },
            validatePassword: { type: 'change', target: '#register-password' }
        },
        meta: {
            roleChange: { type: 'change', target: '#register-role' }
        },
        actions: {
            validate: { type: 'click', target: '#validate-btn' },
            resetClick: { type: 'click', target: '#reset-btn' },
            submitClick: { type: 'click', target: '#submit-btn' }
        },
        submit: { code: 'Enter', ctrlKey: true },
        reset: { code: 'Escape' }
    },

    iddqd: [
        { code: 'KeyI' }, { code: 'KeyD' }, { code: 'KeyD' }, { code: 'KeyQ' }, { code: 'KeyD' }
    ],
    idkfa: [
        { code: 'KeyI' }, { code: 'KeyD' }, { code: 'KeyK' }, { code: 'KeyF' }, { code: 'KeyA' }
    ]
}, {
    eventType: 'keydown click change focusin focusout input touchstart touchend',
    resultEventType: ['{{fullContext}}.{{name}}', '{{fullContext}}', '{{context}}.{{name}}', '{{name}}', '*', 'DOMFilterEvent']
});

// ── DOM refs ──

const allEventsList = document.getElementById('all-events-list');
const editorStatus = document.getElementById('editor-status');
const formStatus = document.getElementById('form-status');

const contextCards = {
    game: document.getElementById('game-card'),
    editor: document.getElementById('editor-card'),
    form: document.getElementById('form-card')
};

const contextStates = {
    game: document.getElementById('game-context-state'),
    editor: document.getElementById('editor-context-state'),
    form: document.getElementById('form-context-state')
};

// ── Event log ──

let allEventCount = 0;

function renderEvent(list, title, detail, count, className = '') {
    const empty = list.querySelector('.empty-log');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = `event-item ${className}`.trim();

    const contextLabel = detail.fullContext || detail.context || 'global';
    const sourceType = detail.originalEvent?.type || 'custom';
    const time = new Date().toLocaleTimeString();

    const nameEl = document.createElement('div');
    nameEl.className = 'event-name';
    nameEl.textContent = title;

    const contextEl = document.createElement('div');
    contextEl.className = 'event-context';
    contextEl.textContent = `#${count} \u2022 context: ${contextLabel} \u2022 source: ${sourceType}`;

    const timeEl = document.createElement('div');
    timeEl.className = 'event-time';
    timeEl.textContent = time;

    item.append(nameEl, contextEl, timeEl);
    list.insertBefore(item, list.firstChild);
    while (list.children.length > 10) {
        list.removeChild(list.lastChild);
    }
}

function logAll(detail, label, className = '') {
    allEventCount += 1;
    renderEvent(allEventsList, label, detail, allEventCount, className);
}


// ── Context tracking ──

function setActiveContext(name = null) {
    Object.entries(contextCards).forEach(([contextName, card]) => {
        const active = contextName === name;
        card.classList.toggle('is-active', active);
        contextStates[contextName].textContent = active ? 'active' : 'inactive';
    });

    // Highlight matching config block
    document.querySelectorAll('.config-ctx-block').forEach(el => {
        el.classList.toggle('is-active', el.dataset.cfgCtx === name);
    });

    // Pause/resume game based on context (needed for touch devices where blur doesn't fire)
    if (name === 'game' && !gameState.active) {
        gameState.active = true;
        gameMessage.textContent = gameState.running
            ? (isTouchDevice ? 'Swipe up to jump, tap to shoot.' : 'Game controls active. Space/Up jump, Ctrl/X shoot, +/- speed.')
            : (isTouchDevice ? 'Game over. Tap to restart.' : 'Game over. Press Space or Ctrl to restart.');
        startGameLoop();
    } else if (name !== 'game' && gameState.active) {
        gameState.active = false;
        gameMessage.textContent = isTouchDevice ? 'Game paused. Tap to continue.' : 'Game paused. Click the arena to continue.';
        stopGameLoop();
        drawGame();
    }
}

function findTopContext(target) {
    if (!target?.closest) return null;
    return target.closest('[data-context="game"], [data-context="editor"], [data-context="form"]')?.getAttribute('data-context') ?? null;
}

document.addEventListener('focusin', event => {
    setActiveContext(findTopContext(event.target));
});

document.addEventListener('click', event => {
    setActiveContext(findTopContext(event.target));
});

document.addEventListener('touchstart', event => {
    setActiveContext(findTopContext(event.target));
});

// ── Catch-all event log ──

document.addEventListener('*', event => {
    const { fullContext, name } = event.detail;
    const label = fullContext
        ? (fullContext.endsWith(name) ? fullContext : `${fullContext}.${name}`)
        : name;
    const isGame = (fullContext || '').startsWith('game') || event.detail.context === 'game';
    logAll(event.detail, label, isGame ? 'game' : '');
});

// ── Editor ──

const editorCanvas = document.getElementById('editor-canvas');
const fontSizeSelect = document.getElementById('font-size-select');

// Prevent toolbar buttons from stealing focus/selection from the editor
document.querySelector('.wysiwyg-toolbar').addEventListener('mousedown', e => {
    if (e.target.closest('.wysiwyg-btn')) e.preventDefault();
});

// Save selection when editor loses focus (e.g. clicking font-size dropdown)
let savedRange = null;
editorCanvas.addEventListener('focusout', () => {
    const sel = window.getSelection();
    if (sel.rangeCount && editorCanvas.contains(sel.anchorNode)) {
        savedRange = sel.getRangeAt(0).cloneRange();
    }
});

function restoreEditorSelection() {
    if (!savedRange) return false;
    editorCanvas.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
}

function updateEditorStatus(text, color = '') {
    editorStatus.textContent = text;
    editorStatus.style.color = color || '';
}

function applyEditorStyles(patch) {
    Object.assign(editorCanvas.style, patch);
}

function insertAutocomplete() {
    const variants = [
        ' DomEventFilter routes events by DOM context hierarchy.',
        ' Sequences like Tab-Tab are matched via ordered mask arrays.',
        ' Custom events are dispatched using configurable name templates.'
    ];
    document.execCommand('insertText', false, variants[Math.floor(Math.random() * variants.length)]);
}

document.addEventListener('save', event => {
    if ((event.detail.fullContext || '').startsWith('editor')) {
        updateEditorStatus('Editor snapshot saved via Ctrl+S.', 'var(--success)');
    } else {
        formStatus.textContent = 'Global save event captured (no editor context).';
        formStatus.style.color = 'var(--success)';
    }
});

document.addEventListener('open', () => {
    editorCanvas.textContent = 'Preset loaded. Shortcuts use event.code for layout-independent key matching.';
    fontSizeSelect.value = '18';
    applyEditorStyles({ fontSize: '18px' });
    updateEditorStatus('Preset loaded via Alt+O.', 'var(--success)');
});

document.addEventListener('editor.toolbar.bold', () => {
    document.execCommand('bold');
    updateEditorStatus('Bold toggled.', 'var(--accent)');
});

document.addEventListener('editor.toolbar.italic', () => {
    document.execCommand('italic');
    updateEditorStatus('Italic toggled.', 'var(--accent)');
});

document.addEventListener('editor.toolbar.fontSize', () => {
    const size = fontSizeSelect.value + 'px';
    restoreEditorSelection();
    const sel = window.getSelection();
    if (sel.rangeCount && !sel.isCollapsed && editorCanvas.contains(sel.anchorNode)) {
        document.execCommand('fontSize', false, '7');
        editorCanvas.querySelectorAll('font[size="7"]').forEach(font => {
            font.removeAttribute('size');
            font.style.fontSize = size;
        });
    } else {
        applyEditorStyles({ fontSize: size });
    }
    updateEditorStatus(`Font size set to ${fontSizeSelect.value}px.`, 'var(--accent)');
});

document.addEventListener('editor.canvas.focusBody', () => {
    updateEditorStatus('Editor body focused.', 'var(--accent)');
});

document.addEventListener('editor.canvas.blurBody', () => {
    updateEditorStatus('Editor body blurred.', '');
});

document.addEventListener('editor.canvas.editBody', () => {
    updateEditorStatus('Editor content changed.', 'var(--accent)');
});

document.addEventListener('editor.autocomplete', event => {
    event.detail.originalEvent?.preventDefault();
    insertAutocomplete();
    updateEditorStatus('Autocomplete inserted from Tab-Tab.', '#a56a00');
});

editorCanvas.addEventListener('paste', event => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
});

// ── Form ──

const registrationForm = document.getElementById('registration-form');
const nameInput = document.getElementById('register-name');
const emailInput = document.getElementById('register-email');
const passwordInput = document.getElementById('register-password');
const roleSelect = document.getElementById('register-role');

const notes = {
    name: document.getElementById('name-note'),
    email: document.getElementById('email-note'),
    password: document.getElementById('password-note')
};

function setNote(node, text, mode = '') {
    node.textContent = text;
    node.className = `validation-note ${mode}`.trim();
}

function validateName() {
    const valid = nameInput.value.trim().length >= 2;
    setNote(notes.name, valid ? 'Looks good.' : 'Name must contain at least 2 characters.', valid ? 'success' : 'error');
    return valid;
}

function validateEmail() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    setNote(notes.email, valid ? 'Email is valid.' : 'Enter a valid email address.', valid ? 'success' : 'error');
    return valid;
}

function validatePassword() {
    const valid = passwordInput.value.length >= 6;
    setNote(notes.password, valid ? 'Password length is valid.' : 'Password must be at least 6 characters.', valid ? 'success' : 'error');
    return valid;
}

function validateForm() {
    const valid = [validateName(), validateEmail(), validatePassword()].every(Boolean);
    formStatus.textContent = valid ? `Ready to submit as ${roleSelect.value}.` : 'Validation failed. Fix the fields.';
    formStatus.style.color = valid ? 'var(--success)' : 'var(--danger)';
    return valid;
}

function clearFormState() {
    Object.values(notes).forEach(node => setNote(node, ''));
    formStatus.textContent = 'Form ready. Ctrl+Enter dispatches form.submit, Escape dispatches form.reset.';
    formStatus.style.color = '';
}

document.addEventListener('form.profile.focusName', () => {
    formStatus.textContent = 'Editing name.';
    formStatus.style.color = '';
});

document.addEventListener('form.profile.focusEmail', () => {
    formStatus.textContent = 'Editing email.';
    formStatus.style.color = '';
});

document.addEventListener('form.security.focusPassword', () => {
    formStatus.textContent = 'Editing password.';
    formStatus.style.color = '';
});

document.addEventListener('form.profile.validateName', validateName);
document.addEventListener('form.profile.validateEmail', validateEmail);
document.addEventListener('form.security.validatePassword', validatePassword);

document.addEventListener('form.meta.roleChange', () => {
    formStatus.textContent = `Role changed to ${roleSelect.value}.`;
    formStatus.style.color = '';
});

document.addEventListener('form.actions.validate', validateForm);

document.addEventListener('form.actions.resetClick', () => {
    registrationForm.reset();
});

document.addEventListener('form.actions.submitClick', () => {
    completeSubmit();
});

function completeSubmit() {
    if (!validateForm()) return;
    formStatus.textContent = `Submitted for ${nameInput.value || 'anonymous'} (${roleSelect.value}).`;
    formStatus.style.color = 'var(--success)';
}

document.addEventListener('form.submit', event => {
    event.detail.originalEvent?.preventDefault();
    completeSubmit();
});

document.addEventListener('form.reset', event => {
    event.detail.originalEvent?.preventDefault();
    registrationForm.reset();
    clearFormState();
});

registrationForm.addEventListener('submit', event => {
    event.preventDefault();
    completeSubmit();
});

registrationForm.addEventListener('reset', () => {
    setTimeout(clearFormState, 0);
});

// ── Game ──

const isTouchDevice = matchMedia('(pointer: coarse)').matches;

const gameArea = document.getElementById('game-area');
const gameCanvas = document.getElementById('game-canvas');
const gameMessage = document.getElementById('game-message');
const cheatStatus = document.getElementById('cheat-status');
const gameScoreEl = document.getElementById('game-score');
const gameLivesEl = document.getElementById('game-lives');
const gameAmmoEl = document.getElementById('game-ammo');
const gameSpeedEl = document.getElementById('game-speed');
const ctx = gameCanvas.getContext('2d');

const CANVAS_H = 280;
const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const gameState = {
    active: false,
    running: true,
    score: 0,
    lives: 3,
    ammo: 5,
    speed: 3,
    speedOffset: 0,
    canvasWidth: 0,
    jumpVelocity: 0,
    gravity: isTouchDevice ? 0.45 : 0.65,
    groundTop: 240,
    playerGroundY: 200,
    player: { x: 84, y: 200, width: 28, height: 40 },
    obstacles: [],
    enemies: [],
    shots: [],
    spawnTimer: 0,
    ammoTimer: 0,
    lastTime: performance.now(),
    invulnerableUntil: 0,
    isGodMode: false,
    hasAllWeapons: false
};

let prevHud = {};
function updateHud() {
    const next = {
        score: String(Math.floor(gameState.score)),
        lives: gameState.isGodMode ? '\u221e' : String(gameState.lives),
        ammo: gameState.hasAllWeapons ? '\u221e' : String(gameState.ammo),
        speed: gameState.speed.toFixed(1)
    };
    if (next.score !== prevHud.score) gameScoreEl.textContent = next.score;
    if (next.lives !== prevHud.lives) gameLivesEl.textContent = next.lives;
    if (next.ammo !== prevHud.ammo) gameAmmoEl.textContent = next.ammo;
    if (next.speed !== prevHud.speed) gameSpeedEl.textContent = next.speed;
    prevHud = next;
}

function updateCheatStatus() {
    const parts = [];
    if (gameState.isGodMode) parts.push('GOD MODE');
    if (gameState.hasAllWeapons) parts.push('UNLIMITED AMMO');
    cheatStatus.textContent = parts.length ? parts.join(' \u2022 ') : 'No active sequences. Type IDDQD or IDKFA anywhere.';
}

function resetGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.ammo = 5;
    gameState.speed = 3;
    gameState.speedOffset = 0;
    gameState.jumpVelocity = 0;
    gameState.player.y = gameState.playerGroundY;
    gameState.obstacles = [];
    gameState.enemies = [];
    gameState.shots = [];
    gameState.spawnTimer = 1200;
    gameState.ammoTimer = 0;
    gameState.invulnerableUntil = 0;
    gameMessage.textContent = isTouchDevice
        ? 'Game started. Swipe up to jump, tap to shoot.'
        : 'Game started. Space/Up to jump, Ctrl/X to shoot, +/- speed.';
    updateHud();
}

function resizeCanvas() {
    const rect = gameCanvas.getBoundingClientRect();
    const width = Math.max(560, Math.floor(rect.width));
    const dpr = window.devicePixelRatio || 1;
    gameCanvas.width = width * dpr;
    gameCanvas.height = CANVAS_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gameState.canvasWidth = width;
}

function spawnObstacle() {
    const height = 30 + Math.round(Math.random() * 20);
    gameState.obstacles.push({
        x: gameState.canvasWidth + 30,
        y: gameState.groundTop - height,
        width: 20,
        height
    });
}

function spawnEnemy() {
    const minY = 60;
    const maxY = gameState.groundTop - 50;
    const y = minY + Math.round(Math.random() * (maxY - minY));
    gameState.enemies.push({
        x: gameState.canvasWidth + 30,
        y,
        width: 28,
        height: 28
    });
}

function shoot() {
    if (!gameState.running) {
        resetGame();
        return;
    }

    if (!gameState.hasAllWeapons && gameState.ammo <= 0) {
        gameMessage.textContent = 'Out of ammo. Reloads automatically every 1.6s.';
        return;
    }

    const startX = gameState.player.x + gameState.player.width + 4;
    const startY = gameState.player.y + gameState.player.height / 2 - 3;
    const speed = 12;
    let vy = 0;

    // Auto-aim at nearest enemy ahead
    const ahead = gameState.enemies.filter(e => e.x > gameState.player.x);
    if (ahead.length > 0) {
        ahead.sort((a, b) => a.x - b.x);
        const target = ahead[0];
        const targetY = target.y + target.height / 2 - 3;
        const dx = target.x - startX;
        if (dx > 0) {
            vy = ((targetY - startY) / dx) * speed;
        }
    }

    gameState.shots.push({
        x: startX,
        y: startY,
        width: 20,
        height: 6,
        vy
    });

    if (!gameState.hasAllWeapons) {
        gameState.ammo -= 1;
    }

    updateHud();
}

function jump() {
    if (!gameState.running) {
        resetGame();
        return;
    }

    if (gameState.player.y < gameState.playerGroundY) return;
    gameState.jumpVelocity = gameState.isGodMode ? -15 : (isTouchDevice ? -11 : -14);
}

function speedChange(offset = 0) {
    if (!gameState.running) return;
    if (offset === 0) return;

    gameState.speedOffset = +(gameState.speedOffset + offset).toFixed(1);
    updateHud();
    gameMessage.textContent = `Speed offset +${gameState.speedOffset.toFixed(1)}.`;
}

function intersects(a, b) {
    return !(
        a.x + a.width < b.x ||
        a.x > b.x + b.width ||
        a.y + a.height < b.y ||
        a.y > b.y + b.height
    );
}

function applyDamage(now) {
    if (gameState.isGodMode) return;
    if (now < gameState.invulnerableUntil) return;
    gameState.lives -= 1;
    gameState.invulnerableUntil = now + 900;
    gameMessage.textContent = gameState.lives > 0
        ? 'Hit! Obstacles and enemies are context-scoped objects.'
        : (isTouchDevice ? 'Game over. Tap to restart.' : 'Game over. Press Space or Ctrl to restart.');
    if (gameState.lives <= 0) {
        gameState.running = false;
    }
    updateHud();
}

function updateGame(delta, now) {
    if (!gameState.active) return;
    const dt = delta / 16.67; // normalize to 60fps

    if (gameState.running) {
        gameState.score += delta * 0.014;
        gameState.speed = (isTouchDevice ? 2 : 3) + Math.min(gameState.score / (isTouchDevice ? 250 : 150), isTouchDevice ? 2 : 3.5) + gameState.speedOffset;

        gameState.jumpVelocity += gameState.gravity * dt;
        gameState.player.y += gameState.jumpVelocity * dt;
        if (gameState.player.y > gameState.playerGroundY) {
            gameState.player.y = gameState.playerGroundY;
            gameState.jumpVelocity = 0;
        }

        gameState.spawnTimer -= delta;
        if (gameState.spawnTimer <= 0) {
            if (Math.random() < 0.3) {
                spawnEnemy();
            } else {
                spawnObstacle();
            }
            gameState.spawnTimer = Math.max(900, 1800 - gameState.speed * 120);
        }

        gameState.ammoTimer += delta;
        if (!gameState.hasAllWeapons && gameState.ammo < 5 && gameState.ammoTimer >= 1200) {
            gameState.ammo += 1;
            gameState.ammoTimer = 0;
        }
    }

    const worldSpeed = (gameState.running ? gameState.speed : 0) * dt;

    gameState.obstacles = gameState.obstacles.filter(obstacle => {
        obstacle.x -= worldSpeed;
        if (intersects(gameState.player, obstacle) && gameState.running) {
            applyDamage(now);
            return false;
        }
        return obstacle.x + obstacle.width > 0;
    });

    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.x -= worldSpeed + (gameState.running ? 0.8 * dt : 0);
        if (intersects(gameState.player, enemy) && gameState.running) {
            applyDamage(now);
            return false;
        }
        return enemy.x + enemy.width > 0;
    });

    gameState.shots = gameState.shots.filter(shot => {
        shot.x += 12 * dt;
        shot.y += (shot.vy || 0) * dt;

        // Off-screen vertically
        if (shot.y < -10 || shot.y > CANVAS_H + 10) return false;

        const enemyIndex = gameState.enemies.findIndex(enemy => intersects(shot, enemy));
        if (enemyIndex !== -1) {
            gameState.enemies.splice(enemyIndex, 1);
            gameState.score += 20;
            gameMessage.textContent = 'Enemy destroyed! +20 score.';
            return false;
        }

        return shot.x < gameState.canvasWidth + 20;
    });

    updateHud();
}

function drawGame() {
    const w = gameState.canvasWidth;

    ctx.clearRect(0, 0, w, CANVAS_H);

    // ground
    ctx.fillStyle = '#d8e2eb';
    ctx.fillRect(0, gameState.groundTop, w, CANVAS_H - gameState.groundTop);
    ctx.strokeStyle = '#b5c2cf';
    ctx.beginPath();
    ctx.moveTo(0, gameState.groundTop);
    ctx.lineTo(w, gameState.groundTop);
    ctx.stroke();

    const now = performance.now();
    const flashing = gameState.invulnerableUntil > now && Math.floor(now / 100) % 2 === 0;

    // player body
    ctx.fillStyle = flashing ? '#8fb4c7' : '#4c6f8f';
    const p = gameState.player;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    // player head
    ctx.fillStyle = '#93a8bd';
    ctx.fillRect(p.x + 4, p.y - 14, p.width - 8, 14);

    // obstacles (green ground blocks)
    ctx.fillStyle = '#2f9e44';
    gameState.obstacles.forEach(o => {
        ctx.fillRect(o.x, o.y, o.width, o.height);
    });

    // enemies (red drones at varied heights)
    ctx.fillStyle = '#e03131';
    gameState.enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#1b2430';
        ctx.fillRect(e.x + 6, e.y + 8, 5, 5);
        ctx.fillRect(e.x + 17, e.y + 8, 5, 5);
        ctx.fillStyle = '#e03131';
    });

    // projectiles (rotated to match trajectory)
    ctx.fillStyle = '#f08c00';
    gameState.shots.forEach(s => {
        if (s.vy) {
            const angle = Math.atan2(s.vy, 12);
            ctx.save();
            ctx.translate(s.x + s.width / 2, s.y + s.height / 2);
            ctx.rotate(angle);
            ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
            ctx.restore();
        } else {
            ctx.fillRect(s.x, s.y, s.width, s.height);
        }
    });

    // game over overlay
    if (!gameState.running) {
        ctx.fillStyle = 'rgba(27, 36, 48, 0.55)';
        ctx.fillRect(0, 0, w, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = `bold 24px ${FONT_STACK}`;
        ctx.fillStyle = '#fff';
        ctx.fillText('GAME OVER', w / 2, 126);

        ctx.font = `13px ${FONT_STACK}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Score: ' + Math.floor(gameState.score) + '  \u2022  ' + (isTouchDevice ? 'Tap to restart' : 'Press Space or Ctrl to restart'), w / 2, 154);

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }
}

let animationId = 0;

function startGameLoop() {
    if (animationId) return;
    gameState.lastTime = performance.now();
    animationId = requestAnimationFrame(frame);
}

function stopGameLoop() {
    if (!animationId) return;
    cancelAnimationFrame(animationId);
    animationId = 0;
}

function frame(now) {
    const delta = Math.min(now - gameState.lastTime, 32);
    gameState.lastTime = now;
    updateGame(delta, now);
    drawGame();
    animationId = requestAnimationFrame(frame);
}

gameArea.addEventListener('click', () => {
    gameArea.focus();
});

gameArea.addEventListener('focus', () => {
    gameState.active = true;
    gameMessage.textContent = gameState.running
        ? (isTouchDevice ? 'Swipe up to jump, tap to shoot.' : 'Game controls active. Space/Up jump, Ctrl/X shoot, +/- speed.')
        : (isTouchDevice ? 'Game over. Tap to restart.' : 'Game over. Press Space or Ctrl to restart.');
    startGameLoop();
});

gameArea.addEventListener('blur', () => {
    gameState.active = false;
    gameMessage.textContent = isTouchDevice ? 'Game paused. Tap to continue.' : 'Game paused. Click the arena to continue.';
    stopGameLoop();
    drawGame();
});

document.addEventListener('game.focusArena', () => {
    gameMessage.textContent = 'Arena focused. game.jump and game.shoot events are now active.';
});

document.addEventListener('game.jump', jump);
document.addEventListener('game.arrowJump', jump);
document.addEventListener('game.shoot', shoot);
document.addEventListener('game.xShoot', shoot);

let touchStartY = 0;
let touchStartX = 0;

document.addEventListener('game.touchStart', e => {
    const t = e.detail.originalEvent?.touches?.[0];
    if (t) { touchStartX = t.clientX; touchStartY = t.clientY; }
    e.detail.originalEvent?.preventDefault();
    if (!gameState.active) { gameState.active = true; startGameLoop(); }
});

document.addEventListener('game.touchEnd', e => {
    const t = e.detail.originalEvent?.changedTouches?.[0];
    if (!t) return;
    e.detail.originalEvent?.preventDefault();
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        shoot();
    } else if (Math.abs(dy) > Math.abs(dx) && dy < -20) {
        jump();
    }
});

document.addEventListener('game.speedUp', speedChange.bind(null, 0.1));
document.addEventListener('game.numSpeedUp', speedChange.bind(null, 0.1));
document.addEventListener('game.speedDown', speedChange.bind(null, -0.1));
document.addEventListener('game.numSpeedDown', speedChange.bind(null, -0.1));

window.gameState = gameState 

document.addEventListener('iddqd', () => {
    gameState.isGodMode = !gameState.isGodMode;
    updateCheatStatus();
    updateHud();
});

document.addEventListener('idkfa', () => {
    gameState.hasAllWeapons = !gameState.hasAllWeapons;
    if (gameState.hasAllWeapons) {
        gameState.ammo = 999;
    } else {
        gameState.ammo = Math.min(gameState.ammo, 5);
    }
    updateCheatStatus();
    updateHud();
});

window.addEventListener('resize', () => {
    resizeCanvas();
    drawGame();
});

window.filter = filter;

// ── Context debug toggle ──

const ctxToggle = document.getElementById('ctx-toggle');
ctxToggle.addEventListener('click', () => {
    const active = document.body.classList.toggle('show-contexts');
    ctxToggle.lastChild.textContent = active ? ' Hide contexts' : ' Show contexts';
});

// ── Config panel toggle & syntax highlight ──

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenizeJS(src) {
    const re = /('(?:[^'\\]|\\.)*')|(\btrue\b|\bfalse\b|\bnull\b)|(-?\b\d+(?:\.\d+)?\b)|([$_a-zA-Z][$_\w]*\s*(?=\s*:))|([\[\]{},:])/g;
    let result = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
        if (m.index > last) result += escHtml(src.slice(last, m.index));
        if      (m[1] !== undefined) result += `<span class="syn-str">${escHtml(m[1])}</span>`;
        else if (m[2] !== undefined) result += `<span class="syn-bool">${escHtml(m[2])}</span>`;
        else if (m[3] !== undefined) result += `<span class="syn-num">${escHtml(m[3])}</span>`;
        else if (m[4] !== undefined) result += `<span class="syn-key">${escHtml(m[4])}</span>`;
        else if (m[5] !== undefined) result += `<span class="syn-punct">${escHtml(m[5])}</span>`;
        last = re.lastIndex;
    }
    if (last < src.length) result += escHtml(src.slice(last));
    return result;
}

const CONFIG_SRC = `{
  save: { code: 'KeyS', ctrlKey: true },
  open: { code: 'KeyO', altKey: true },

  game: {
    jump:       { code: 'Space' },
    arrowJump:  { key: 'ArrowUp' },
    shoot:      { key: 'Control' },
    xShoot:     { code: 'KeyX' },
    speedUp:    { code: 'Equal' },
    speedDown:  { code: 'Minus' },
    numSpeedUp:   { code: 'NumpadAdd' },
    numSpeedDown: { code: 'NumpadSubtract' },
    focusArena: { type: 'click', target: '#game-area' }
  },

  editor: {
    save:         { code: 'KeyS', ctrlKey: true },
    autocomplete: [{ code: 'Tab' }, { code: 'Tab' }],
    toolbar: {
      bold:     { type: 'click',  target: '[data-action="bold"]' },
      italic:   { type: 'click',  target: '[data-action="italic"]' },
      fontSize: { type: 'change', target: '[data-action="fontSize"]' }
    },
    canvas: {
      focusBody: { type: 'focusin',  target: '#editor-canvas' },
      blurBody:  { type: 'focusout', target: '#editor-canvas' },
      editBody:  { type: 'input',    target: '#editor-canvas' }
    }
  },

  form: {
    profile: {
      focusName:     { type: 'focusin', target: '#register-name' },
      focusEmail:    { type: 'focusin', target: '#register-email' },
      validateName:  { type: 'change',  target: '#register-name' },
      validateEmail: { type: 'change',  target: '#register-email' }
    },
    security: {
      focusPassword:    { type: 'focusin', target: '#register-password' },
      validatePassword: { type: 'change',  target: '#register-password' }
    },
    meta: {
      roleChange: { type: 'change', target: '#register-role' }
    },
    actions: {
      validate:    { type: 'click', target: '#validate-btn' },
      resetClick:  { type: 'click', target: '#reset-btn' },
      submitClick: { type: 'click', target: '#submit-btn' }
    },
    submit: { code: 'Enter', ctrlKey: true },
    reset:  { code: 'Escape' }
  },

  iddqd: [
    { code: 'KeyI' }, { code: 'KeyD' }, { code: 'KeyD' },
    { code: 'KeyQ' }, { code: 'KeyD' }
  ],
  idkfa: [
    { code: 'KeyI' }, { code: 'KeyD' }, { code: 'KeyK' },
    { code: 'KeyF' }, { code: 'KeyA' }
  ]
}`;

const OPTIONS_SRC = `{
  eventType: 'keydown click change focusin focusout input',
  resultEventType: [
    '{{fullContext}}.{{name}}',
    '{{context}}.{{name}}',
    '{{name}}', '*', 'DOMFilterEvent'
  ]
}`;

// Map context names to line ranges in CONFIG_SRC (1-based line indices)
const CTX_LINE_RANGES = {
    game:   { from: 5, to: 15 },
    editor: { from: 17, to: 30 },
    form:   { from: 32, to: 52 }
};

function renderConfigPanel() {
    const el = document.getElementById('config-source');
    if (!el || el.children.length > 0) return;

    // Config block — group contiguous context lines into wrapper divs
    const g1 = document.createElement('div');
    g1.className = 'config-src-group';
    const h1 = document.createElement('h3');
    h1.textContent = 'Config';
    g1.appendChild(h1);

    const b1 = document.createElement('div');
    b1.className = 'config-src-block';

    const lines = CONFIG_SRC.split('\n');
    let currentCtx = null;
    let blockDiv = null;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        let ctx = null;
        for (const [name, range] of Object.entries(CTX_LINE_RANGES)) {
            if (lineNum >= range.from && lineNum <= range.to) {
                ctx = name;
                break;
            }
        }

        // Context changed — close previous block, open new one
        if (ctx !== currentCtx) {
            blockDiv = null;
            if (ctx) {
                blockDiv = document.createElement('div');
                blockDiv.className = 'config-ctx-block';
                blockDiv.dataset.cfgCtx = ctx;
                b1.appendChild(blockDiv);
            }
            currentCtx = ctx;
        }

        const lineEl = document.createElement('div');
        lineEl.className = 'cfg-line';
        lineEl.innerHTML = tokenizeJS(lines[i]);

        if (blockDiv) {
            blockDiv.appendChild(lineEl);
        } else {
            b1.appendChild(lineEl);
        }
    }

    g1.appendChild(b1);
    el.appendChild(g1);

    // Options block
    const g2 = document.createElement('div');
    g2.className = 'config-src-group';
    const h2 = document.createElement('h3');
    h2.textContent = 'Options';
    g2.appendChild(h2);
    const b2 = document.createElement('div');
    b2.className = 'config-src-block';
    OPTIONS_SRC.split('\n').forEach(line => {
        const d = document.createElement('div');
        d.className = 'cfg-line';
        d.innerHTML = tokenizeJS(line);
        b2.appendChild(d);
    });
    g2.appendChild(b2);
    el.appendChild(g2);

    // Listeners block — grouped like left sidebar
    const LISTENER_GROUPS = [
        { label: 'Global', items: [
            "document.addEventListener('save', ...)",
            "document.addEventListener('open', ...)",
        ]},
        { label: 'Game', items: [
            "document.addEventListener('game.focusArena', ...)",
            "document.addEventListener('game.jump', jump)",
            "document.addEventListener('game.arrowJump', jump)",
            "document.addEventListener('game.shoot', shoot)",
            "document.addEventListener('game.xShoot', shoot)",
            "document.addEventListener('game.speedUp', ...)",
            "document.addEventListener('game.speedDown', ...)",
            "document.addEventListener('game.numSpeedUp', ...)",
            "document.addEventListener('game.numSpeedDown', ...)",
        ]},
        { label: 'Editor', items: [
            "document.addEventListener('editor.toolbar.bold', ...)",
            "document.addEventListener('editor.toolbar.italic', ...)",
            "document.addEventListener('editor.toolbar.fontSize', ...)",
            "document.addEventListener('editor.canvas.focusBody', ...)",
            "document.addEventListener('editor.canvas.blurBody', ...)",
            "document.addEventListener('editor.canvas.editBody', ...)",
            "document.addEventListener('editor.autocomplete', ...)",
        ]},
        { label: 'Form', items: [
            "document.addEventListener('form.profile.focusName', ...)",
            "document.addEventListener('form.profile.focusEmail', ...)",
            "document.addEventListener('form.profile.validateName', ...)",
            "document.addEventListener('form.profile.validateEmail', ...)",
            "document.addEventListener('form.security.focusPassword', ...)",
            "document.addEventListener('form.security.validatePassword', ...)",
            "document.addEventListener('form.meta.roleChange', ...)",
            "document.addEventListener('form.actions.validate', ...)",
            "document.addEventListener('form.actions.resetClick', ...)",
            "document.addEventListener('form.actions.submitClick', ...)",
            "document.addEventListener('form.submit', ...)",
            "document.addEventListener('form.reset', ...)",
        ]},
        { label: 'Sequences', items: [
            "document.addEventListener('iddqd', ...)",
            "document.addEventListener('idkfa', ...)",
        ]},
        { label: 'Catch-all', items: [
            "document.addEventListener('*', ...)",
        ]},
    ];

    const g3 = document.createElement('div');
    g3.className = 'config-src-group';
    const h3el = document.createElement('h3');
    h3el.textContent = 'Listeners';
    g3.appendChild(h3el);

    LISTENER_GROUPS.forEach(group => {
        const section = document.createElement('div');
        section.className = 'listener-group';

        const heading = document.createElement('div');
        heading.className = 'listener-group-label';
        heading.textContent = group.label;
        section.appendChild(heading);

        group.items.forEach(item => {
            const line = document.createElement('div');
            line.className = 'listener-item';
            // Extract event name from the string for highlighting
            const match = item.match(/'([^']+)'/);
            if (match) {
                const eventName = match[1];
                line.innerHTML = `<span class="syn-punct">on</span> <span class="syn-str">'${escHtml(eventName)}'</span>`;
            } else {
                line.textContent = item;
            }
            section.appendChild(line);
        });

        g3.appendChild(section);
    });

    el.appendChild(g3);
}

const cfgToggle = document.getElementById('cfg-toggle');
cfgToggle.addEventListener('click', () => {
    const active = document.body.classList.toggle('show-config');
    cfgToggle.lastChild.textContent = active ? ' Hide config' : ' Show config';
    if (active) renderConfigPanel();
    resizeCanvas();
    drawGame();
});

// ── Init ──

resizeCanvas();
clearFormState();
updateCheatStatus();
updateHud();
setActiveContext(null);
resetGame();
drawGame();

setTimeout(() => {
    logAll({
        name: 'playground.ready',
        context: 'system',
        fullContext: 'system',
        originalEvent: null
    }, 'system.ready');
}, 150);
