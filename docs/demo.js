// import { DomEventFilter } from "https://unpkg.com/dom-event-filter@latest/index.js";
import { DomEventFilter } from "http://localhost:8888/index.js";

// Enhanced filter configuration with all examples from README
const filter = new DomEventFilter({
    // Global hotkeys
    save: { key: 's', ctrlKey: true },
    open: { key: 'o', altKey: true },

    // Body click events
    bodyClick: { target: document.body, type: 'click' },

    // Editor context events
    editor: {
        very: {
            deep: {
                save: { key: 's', ctrlKey: true },
            }
        },
        save: { key: 's', ctrlKey: true },
        autocomplete: [{ keyCode: 9 }, { keyCode: 9 }],
        // Form events in editor context
        validateInput: { type: 'change', target: '#editor-input' },
        focusTextarea: { type: 'focus', target: '#editor-textarea' },
        blurInput: { type: 'blur', target: 'input' }
    },

    // Info context events
    info: {
        target: '#info-btn',
        type: 'click',
        ctrlKey: true
    },

    // Game context events
    game: {
        moveUp: { key: 'ArrowUp' },
        moveDown: { key: 'ArrowDown' },
        moveLeft: { key: 'ArrowLeft' },
        moveRight: { key: 'ArrowRight' },
        jump: { key: ' ' },
        shoot: { key: 'x' }
    },

    // Event sequences (work globally, not just in game context)
    konami: [
        { key: 'ArrowUp' },
        { key: 'ArrowUp' },
        { key: 'ArrowDown' },
        { key: 'ArrowDown' },
        { key: 'ArrowLeft' },
        { key: 'ArrowRight' },
        { key: 'ArrowLeft' },
        { key: 'ArrowRight' },
        { key: 'b' },
        { key: 'a' }
    ],

    // Doom cheat codes
    iddqd: [
        { key: 'i' }, { key: 'd' }, { key: 'd' }, { key: 'q' }, { key: 'd' }
    ],

    idkfa: [
        { key: 'i' }, { key: 'd' }, { key: 'k' }, { key: 'f' }, { key: 'a' }
    ]
}, {
    resultEventType: ['{{fullContext}}.{{name}}', '*', '*.{{name}}', 'DOMFilterEvent']
});

// Events tracking system
const eventsList = document.getElementById('events-list');
let eventCounter = 0;

function logEvent(eventName, context, originalEvent) {
    eventCounter++;
    const eventItem = document.createElement('div');
    eventItem.className = 'event-item';

    const time = new Date().toLocaleTimeString();
    eventItem.innerHTML = `
        <div class="event-name">${eventName}</div>
        <div class="event-context">Context: ${context || 'global'}</div>
        <div class="event-time">#${eventCounter} at ${time}</div>
    `;

    eventsList.insertBefore(eventItem, eventsList.firstChild);

    // Keep only last 10 events
    while (eventsList.children.length > 10) {
        eventsList.removeChild(eventsList.lastChild);
    }

    // Auto-scroll to top
    eventsList.scrollTop = 0;
}

// Game mechanics
const player = document.getElementById('player');
const cheatStatus = document.getElementById('cheat-status');
let playerX = 50; // percentage
let playerY = 50; // percentage
let isGodMode = false;
let hasAllWeapons = false;

function updatePlayerPosition() {
    player.style.left = playerX + '%';
    player.style.top = playerY + '%';
}

function movePlayer(direction) {
    const step = 5; // 5% movement
    const boundary = 10; // 10% from edges

    switch (direction) {
        case 'up':
            if (playerY > boundary) playerY -= step;
            break;
        case 'down':
            if (playerY < 100 - boundary) playerY += step;
            break;
        case 'left':
            if (playerX > boundary) playerX -= step;
            break;
        case 'right':
            if (playerX < 100 - boundary) playerX += step;
            break;
    }

    updatePlayerPosition();
}

function updateCheatStatus() {
    let status = [];
    if (isGodMode) status.push('GOD MODE');
    if (hasAllWeapons) status.push('ALL WEAPONS');

    cheatStatus.textContent = status.length > 0 ? status.join(' • ') : '';

    // Visual effects for cheats
    let icon = '';
    if (isGodMode && hasAllWeapons) {
        // Both cheats active
        player.style.background = 'linear-gradient(45deg, #ff6b6b, #ffa500, #00ff88, #00ccff)';
        player.style.boxShadow = '0 0 40px #ff6b6b';
        icon = '👑'; // King icon for both cheats
    } else if (isGodMode) {
        player.style.background = 'linear-gradient(45deg, #ff6b6b, #ffa500)';
        player.style.boxShadow = '0 0 30px #ff6b6b';
        icon = '🛡️'; // Shield for god mode
    } else if (hasAllWeapons) {
        player.style.background = 'linear-gradient(45deg, #00ff88, #00ccff)';
        player.style.boxShadow = '0 0 30px #00ff88';
        icon = '🔫'; // Gun for all weapons
    } else {
        player.style.background = '#00ff88';
        player.style.boxShadow = '0 0 20px #00ff88';
        icon = '';
    }

    // Add icon to player
    if (icon && !player.innerHTML.includes('🎮')) { // Don't override Konami icon
        player.innerHTML = icon;
        player.style.display = 'flex';
        player.style.alignItems = 'center';
        player.style.justifyContent = 'center';
        player.style.fontSize = '20px';
    } else if (!icon && !player.innerHTML.includes('🎮')) {
        player.innerHTML = '';
    }
}

// Event listeners for filtered events
document.addEventListener('save', e => {
    logEvent('Global Save', e.detail.context, e.detail.originalEvent);

    // Visual feedback
    document.body.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    setTimeout(() => {
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 200);
});

document.addEventListener('open', e => {
    logEvent('Global Open', e.detail.context, e.detail.originalEvent);

    // Visual feedback
    document.body.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    setTimeout(() => {
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 200);
});

document.addEventListener('editor.save', e => {
    logEvent('Editor Save', e.detail.context, e.detail.originalEvent);

    const textarea = document.getElementById('editor-textarea');
    textarea.style.borderColor = '#4CAF50';
    textarea.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.2)';

    setTimeout(() => {
        textarea.style.borderColor = '#e1e5e9';
        textarea.style.boxShadow = 'none';
    }, 1000);
});

document.addEventListener('editor.autocomplete', e => {
    logEvent('Autocomplete', e.detail.context, e.detail.originalEvent);

    const textarea = document.getElementById('editor-textarea');
    const currentText = textarea.value;
    const suggestions = ['function()', 'document.', 'console.log()', 'addEventListener()'];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    textarea.value = currentText + randomSuggestion;

    // Visual feedback
    textarea.style.background = 'rgba(255, 193, 7, 0.1)';
    setTimeout(() => {
        textarea.style.background = 'rgba(255, 255, 255, 0.8)';
    }, 500);
});

document.addEventListener('editor.validateInput', e => {
    logEvent('Input Validation', e.detail.context, e.detail.originalEvent);
});

document.addEventListener('editor.focusTextarea', e => {
    logEvent('Textarea Focus', e.detail.context, e.detail.originalEvent);
});

document.addEventListener('*.info', e => {
    logEvent('Info Action', e.detail.context, e.detail.originalEvent);

    const button = document.getElementById('info-btn');
    button.style.transform = 'scale(1.1)';
    button.textContent = 'Info Activated!';

    setTimeout(() => {
        button.style.transform = 'scale(1)';
        button.textContent = 'Info Button (try Ctrl+Click)';
    }, 1000);
});

// Game movement events
document.addEventListener('game.moveUp', e => {
    logEvent('Move Up', e.detail.context, e.detail.originalEvent);
    movePlayer('up');
});

document.addEventListener('game.moveDown', e => {
    logEvent('Move Down', e.detail.context, e.detail.originalEvent);
    movePlayer('down');
});

document.addEventListener('game.moveLeft', e => {
    logEvent('Move Left', e.detail.context, e.detail.originalEvent);
    movePlayer('left');
});

document.addEventListener('game.moveRight', e => {
    logEvent('Move Right', e.detail.context, e.detail.originalEvent);
    movePlayer('right');
});

document.addEventListener('game.jump', e => {
    logEvent('Jump', e.detail.context, e.detail.originalEvent);

    player.style.transform = 'translate(-50%, -60%) scale(1.2)';
    setTimeout(() => {
        player.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 300);
});

document.addEventListener('game.shoot', e => {
    logEvent('Shoot', e.detail.context, e.detail.originalEvent);

    // Create bullet effect
    const bullet = document.createElement('div');
    bullet.style.cssText = `
        position: absolute;
        width: 4px;
        height: 10px;
        background: #ffff00;
        box-shadow: 0 0 10px #ffff00;
        left: ${playerX}%;
        top: ${playerY - 5}%;
        transition: all 0.5s ease;
        border-radius: 2px;
    `;

    document.querySelector('.game-area').appendChild(bullet);

    // Animate bullet
    setTimeout(() => {
        bullet.style.top = '10%';
        bullet.style.opacity = '0';
    }, 50);

    // Remove bullet
    setTimeout(() => {
        bullet.remove();
    }, 600);
});

// Special sequences
document.addEventListener('konami', e => {
    logEvent('🎮 KONAMI CODE!', e.detail.context, e.detail.originalEvent);

    // Epic effect
    document.body.style.background = 'linear-gradient(45deg, #ff0080, #00ff80, #8000ff, #ff8000)';
    document.body.style.backgroundSize = '400% 400%';
    document.body.style.animation = 'rainbow 2s ease infinite';

    // Add Konami icon to player
    player.innerHTML = '🎮';
    player.style.display = 'flex';
    player.style.alignItems = 'center';
    player.style.justifyContent = 'center';
    player.style.fontSize = '20px';

    setTimeout(() => {
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        document.body.style.animation = 'none';
        player.innerHTML = '';
    }, 3000);
});

document.addEventListener('iddqd', e => {
    logEvent('🛡️ GOD MODE', e.detail.context, e.detail.originalEvent);
    isGodMode = !isGodMode;
    updateCheatStatus();
});

document.addEventListener('idkfa', e => {
    logEvent('🔫 ALL WEAPONS', e.detail.context, e.detail.originalEvent);
    hasAllWeapons = !hasAllWeapons;
    updateCheatStatus();
});

// Catch all other filtered events
document.addEventListener('DOMFilterEvent', e => {
    // Only log if not handled by specific handlers above
    const handledEvents = [
        'save', 'open', 'editor.save', 'editor.autocomplete', 'editor.validateInput',
        'editor.focusTextarea', 'info', 'game.moveUp', 'game.moveDown', 'game.moveLeft',
        'game.moveRight', 'game.jump', 'game.shoot', 'konami', 'iddqd', 'idkfa'
    ];

    if (!handledEvents.some(event => e.type.includes(event))) {
        console.log('Unhandled event:', e.type, e.detail);
    }
});

// Add rainbow animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
`;
document.head.appendChild(style);

// Initialize game
updatePlayerPosition();
updateCheatStatus();

// Make game area focusable and auto-focus on click
const gameArea = document.querySelector('.game-area');
gameArea.setAttribute('tabindex', '0');
gameArea.addEventListener('click', () => {
    gameArea.focus();
});

// Auto-focus game area when page loads
setTimeout(() => {
    gameArea.focus();
}, 1000);

// Make filter available in console for debugging
window.filter = filter;

// Welcome message
setTimeout(() => {
    logEvent('🎯 Playground Ready!', 'system', null);
}, 500);