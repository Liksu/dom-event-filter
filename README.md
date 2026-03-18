# DOM Event Filter

**DOM Event Filter** allows you to split your page into contextual areas and catch events (like hotkeys) by mask-objects from config. Define contexts with HTML attributes, configure event patterns, and get contextual custom events that bubble through your DOM hierarchy.

## 🚀 Features

- **Context-aware Event Handling**: Define nested page areas and catch events only where they matter
- **Universal Event Support**: Handle any DOM events - keyboard, mouse, touch, drag, focus, custom events
- **Hotkey Management**: Easy keyboard shortcut configuration with modifier key support
- **Event Sequences**: Support for complex key combinations and multi-step interactions
- **Custom Event Generation**: Automatic emission of contextual custom events
- **Flexible Configuration**: Object-based or array-based event configuration
- **Performance Optimized**: Smart event delegation and sequence timeout management
- **Zero Dependencies**: Lightweight and self-contained

## 🔑 Core Concept

The library works by establishing a direct relationship between your **configuration structure** and your **HTML context hierarchy**:

1. **Configuration Structure**: The nested structure of your config object defines which contexts an event belongs to
2. **HTML Context Hierarchy**: Elements with `data-context` attributes create contextual areas in your DOM
3. **Event Matching**: Events are matched when they occur within the corresponding context hierarchy
4. **Custom Event Generation**: The library generates custom events with names that reflect the context path

**Example:**
```javascript
const config = {
  editor: {
    save: { key: 's', ctrlKey: true },  // Will trigger by hotkey in editor context
    toolbar: {
        save: { type: 'click' }  // Will trigger in editor > toolbar context
    }
  }
}
```

```html
<div data-context="editor">
  <div data-context="toolbar">
    <button>Save</button>  <!-- Click here triggers 'toolbar.save' event -->
  </div>
  <textarea>Your text here...</textarea> <!-- Ctrl+S here triggers 'editor.save' event -->
</div>
```

The library subscribes to specified event types, finds the matching context hierarchy for each event, and re-fires new contextual events with meaningful names.   

## 📦 Installation

```bash
npm install dom-event-filter
# or
yarn add dom-event-filter
```

## 🔥 Quick Start

### HTML Structure
```html
<div>
  <div data-context="editor">
    <textarea>Your text here...</textarea>
    <button>Save</button>
  </div>
  <div data-context="sidebar">
    <button id="info-btn">Info</button>
  </div>
</div>
```

### JavaScript Configuration
```javascript
import { DomEventFilter } from 'dom-event-filter'

const filter = new DomEventFilter({
  // Global hotkeys
  save: { key: 's', ctrlKey: true },
  open: { key: 'o', altKey: true },

  // Context-specific events
  editor: {
    save: { key: 's', ctrlKey: true },
    autocomplete: [
      { keyCode: 9 },  // Tab sequence
      { keyCode: 9 }
    ],
    // Form events in editor context
    validateInput: { type: 'change', target: 'input[type="text"]' },
    focusTextarea: { type: 'focus', target: 'textarea' }
  },

  // Click events with context
  info: {
    target: '#info-btn',
    type: 'click',
    ctrlKey: true
  },

  // Touch events for mobile
  swipeLeft: { type: 'touchend', target: '.swipe-area' },
  
  // Event sequences (Konami code)
  konami: [
    { key: 'ArrowUp' },
    { key: 'ArrowUp' },
    { key: 'ArrowDown' },
    { key: 'ArrowDown' },
    { key: 'ArrowLeft' },
    { key: 'ArrowRight' },
    { key: 'ArrowLeft' },
    { key: 'ArrowRight' }
  ]
}, {
  eventType: 'keydown click change focus touchend'  // Listen to multiple event types
})

// Listen for contextual events
document.addEventListener('editor.save', e => {
  console.log('Save in editor context', e.detail)
})

// Wildcard listeners
document.addEventListener('*.info', e => {
  console.log('Info event from any context', e.detail)
})

// Catch all filtered events
document.addEventListener('DOMFilterEvent', e => {
  console.log('Any filtered event', e.detail)
})
```

## 📖 Configuration

### Event Masks

Event masks are standard DOM event properties used for matching.

```javascript
{
  key: 'Enter',          // KeyboardEvent.key
  keyCode: 13,           // KeyboardEvent.keyCode (legacy)
  ctrlKey: true,         // Modifier keys
  altKey: false,
  shiftKey: true,
  metaKey: false,
  type: 'keydown',       // Event type
  target: '#my-button',  // CSS selector for target element (optional)
  button: 0,             // MouseEvent.button
  // Any other DOM event property works automatically
}
```

**Note:** Target selectors are optional - events are matched by type within their context by default.

### Context Hierarchy

Contexts are defined using HTML attributes (configurable via `contextAttribute` setting, defaults to `data-context`) and support nesting. Events without any context are treated as global (`*`):

```html
<!-- Global context (no context attribute) -->
<div>
  <!-- Events here are global (*) -->
  <button>Global Action</button>
</div>

<!-- Named contexts with nesting -->
<div data-context="app">
  <!-- Nested editor context -->
  <div data-context="editor">
    <!-- Events here match both 'app' and 'editor' contexts -->
    <input type="text">
  </div>

  <!-- Nested sidebar context -->
  <div data-context="sidebar">
    <!-- Events here match both 'app' and 'sidebar' contexts -->
    <button>Menu</button>
  </div>
</div>
```

### Configuration Structure

The configuration object structure directly mirrors your HTML context hierarchy. Each level of nesting in your config corresponds to a level of nesting in your DOM contexts. This relationship is the core of how the library works - it matches events based on where they occur in the context tree.

When you define a nested configuration like `editor.toolbar.save`, the library will only trigger this event if it happens within an element that has both `data-context="editor"` and a nested `data-context="toolbar"`.

**Object-based Configuration:**
```javascript
const config = {
  // Global events (work anywhere on the page)
  globalSave: { key: 's', ctrlKey: true },
  
  // Editor context events
  editor: {
    save: { key: 's', ctrlKey: true },        // Hotkey in editor area
    focus: { type: 'focus', target: 'input' }, // Focus any input in editor
    
    // Nested toolbar context within editor
    toolbar: {
      boldBtn: { type: 'click', target: '.bold' },     // Click bold button
      italicBtn: { type: 'click', target: '.italic' }  // Click italic button  
    }
  }
}
```

**Corresponding HTML:**
```html
<div data-context="editor">
  <!-- Ctrl+S here triggers 'editor.save' -->
  <input type="text" placeholder="Type here...">
  
  <div data-context="toolbar">
    <!-- Click here triggers 'toolbar.boldBtn' -->
    <button class="bold">Bold</button>
    <button class="italic">Italic</button>
  </div>
</div>
```

The key insight is that configuration structure defines context requirements. The deeper you nest in config, the more specific the DOM context must be for events to match.

**Array-based Configuration:**
```javascript
const config = [
  {
    name: 'save',
    context: ['editor'],
    mask: { key: 's', ctrlKey: true }
  },
  {
    name: 'bold', 
    context: ['dialog', 'toolbar'],        // Requires nested context
    mask: { key: 'b', ctrlKey: true }
  }
]
```

## ⚙️ Advanced Features

### Event Sequences

Define multi-step key combinations with automatic timeout:

```javascript
const filter = new DomEventFilter({
  // Classic Konami code
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

  // Double-tab for autocomplete
  doubleTab: [
    { key: 'Tab' },
    { key: 'Tab' }
  ]
}, {
  sequenceTimeLimit: 1000  // 1 second timeout between keys
})
```

### Custom Settings

```javascript
const filter = new DomEventFilter(config, {
  contextAttribute: 'data-context',     // HTML attribute for contexts
  eventType: 'keydown click',           // Space-separated event types
  rootElement: document.body,           // Root element for event delegation
  sequenceTimeLimit: 720,               // Maximum interval between sequence keys (ms)
  resultEventType: [                    // Custom event name templates (all are fired)
    '{{eventConfig.context[0]}}.{{name}}',
    'DOMFilterEvent'
  ]
})
```

#### contextAttribute
**Type:** `string` | **Default:** `'data-context'`

HTML attribute name used to identify contexts in your DOM. You can use any custom attribute name:

```javascript
// Use custom attribute
new DomEventFilter(config, { contextAttribute: 'data-area' })
```

```html
<!-- Now use data-area instead of data-context -->
<div data-area="editor">
  <div data-area="toolbar">...</div>
</div>
```

#### eventType
**Type:** `string` | **Default:** `'keydown'`

Space-separated list of DOM event types to listen for. This is a performance optimization - only specified event types are processed by the filter. Common combinations:

```javascript
// Keyboard only
eventType: 'keydown'

// Keyboard and mouse
eventType: 'keydown click'

// Multiple event types
eventType: 'keydown click change focus blur touchend'

// All interaction events
eventType: 'keydown click change focus blur touchstart touchend mousedown mouseup'
```

#### rootElement
**Type:** `Element` | **Default:** `document`

Root DOM element for event delegation. All event listeners are attached to this element. Useful for limiting scope to specific parts of your application:

```javascript
// Listen only within a specific container
const container = document.querySelector('#app-container')
new DomEventFilter(config, { rootElement: container })
```

#### sequenceTimeLimit
**Type:** `number` | **Default:** `720`

Maximum time interval in milliseconds between keys in a sequence. If the timeout expires, the sequence resets. Set to `0` to disable timeout:

```javascript
// 1 second timeout
sequenceTimeLimit: 1000

// No timeout (sequences never expire)
sequenceTimeLimit: 0

// Very fast sequences (300ms)
sequenceTimeLimit: 300
```

#### resultEventType
**Type:** `string | Array<string>` | **Default:** `['{{eventConfig.context[0]}}.{{name}}', 'DOMFilterEvent']`

Template(s) for generated custom event names. **Important:** All templates in the array are fired simultaneously for each matched event. Use template variables to create dynamic event names:

```javascript
// Multiple event formats (all fired for each match)
resultEventType: [
  '{{fullContext}}.{{name}}',      // 'editor.toolbar.save'
  '{{context}}.{{name}}',          // 'toolbar.save'
  '*.{{name}}',                    // '*.save' (wildcard)
  '{{name}}',                      // 'save' (name only)
  'DOMFilterEvent'                 // Generic catch-all
]
```

**Template Variables:**
- `{{name}}` - Event name from configuration
- `{{context}}` - Immediate context name
- `{{fullContext}}` - Complete context path (e.g., 'editor.toolbar')
- `{{eventConfig.context[0]}}` - First context in hierarchy
- Any property from `eventConfig` object

### Custom Event Generation

The library generates custom events based on the `resultEventType` configuration. **All templates in the array are fired simultaneously** for each matched event, allowing you to listen for the same event in multiple formats:

```javascript
const filter = new DomEventFilter(config, {
  resultEventType: [
    '{{eventConfig.context[0]}}.{{name}}',  // 'editor.save'
    '{{fullContext}}.{{name}}',             // 'editor.toolbar.save'  
    '*.{{name}}',                           // '*.save' (wildcard)
    '{{name}}',                             // 'save' (name only)
    'DOMFilterEvent'                        // Generic catch-all
  ]
})

// All these listeners will trigger for the same editor save event:
document.addEventListener('editor.save', handler1)           // First template
document.addEventListener('editor.toolbar.save', handler2)   // Second template  
document.addEventListener('*.save', handler3)               // Wildcard template
document.addEventListener('save', handler4)                 // Name-only template
document.addEventListener('DOMFilterEvent', handler5)       // Generic template
```

### Event Details

All generated events include detailed information in the `event.detail` object:

```javascript
document.addEventListener('editor.save', e => {
  const {
    name,              // 'save' - Event name from config
    context,           // 'editor' - Immediate context
    fullContext,       // 'editor.toolbar' - Full context path
    composedContexts,  // ['toolbar', 'editor'] - Context hierarchy array
    originalEvent,     // Original DOM event that triggered this
    eventConfig        // Matched configuration object
  } = e.detail
})

// Listen for events from any context
document.addEventListener('*.save', e => {
  console.log(`Save triggered in: ${e.detail.fullContext}`)
})

// Generic event listener
document.addEventListener('DOMFilterEvent', e => {
  console.log(`Event: ${e.detail.name} in ${e.detail.fullContext}`)
})
```

## 🎯 Real-world Examples

### Code Editor with Context Hierarchy

**Configuration:**
```javascript
const editorFilter = new DomEventFilter({
  editor: {
    // Editor-wide actions
    save: { key: 's', ctrlKey: true },
    find: { key: 'f', ctrlKey: true },
    
    // Nested contexts within editor
    toolbar: {
      bold: { key: 'b', ctrlKey: true },
      italic: { key: 'i', ctrlKey: true },
      underline: { key: 'u', ctrlKey: true }
    },
    
    sidebar: {
      toggle: { key: 'b', ctrlKey: true, shiftKey: true },
      
      // Further nesting: file explorer within sidebar
      files: {
        newFile: { key: 'n', ctrlKey: true },
        delete: { key: 'Delete' },
        rename: { key: 'F2' }
      }
    }
  }
}, {
  resultEventType: ['{{fullContext}}.{{name}}', '*.{{name}}', 'DOMFilterEvent']
})
```

**Corresponding HTML:**
```html
<div data-context="editor">
  <div data-context="toolbar">
    <!-- Ctrl+B here triggers: 'editor.toolbar.bold' -->
    <button>Bold</button>
  </div>
  
  <div data-context="sidebar">
    <div data-context="files">
      <!-- F2 here triggers: 'editor.sidebar.files.rename' -->
      <!-- Delete here triggers: 'editor.sidebar.files.delete' -->
      <ul class="file-list">...</ul>
    </div>
  </div>
  
  <div class="main-content">
    <!-- Ctrl+S here triggers: 'editor.save' -->
    <!-- Ctrl+F here triggers: 'editor.find' -->
    <textarea></textarea>
  </div>
</div>
```

**Event Handling:**
```javascript
// Specific context events
document.addEventListener('editor.toolbar.bold', e => {
  console.log('Bold action in toolbar')
})

// Wildcard listeners for any context
document.addEventListener('*.save', e => {
  console.log(`Save in context: ${e.detail.fullContext}`)
})

// All filtered events
document.addEventListener('DOMFilterEvent', e => {
  console.log(`${e.detail.name} triggered in ${e.detail.fullContext}`)
})
```

### Modal Dialog Management

```javascript
const dialogFilter = new DomEventFilter({
  // Global escape to close any dialog
  closeDialog: { key: 'Escape' },

  // Context-specific dialog actions
  confirmDialog: {
    confirm: { key: 'Enter' },
    cancel: { key: 'Escape' }
  },

  // Form dialog
  formDialog: {
    submit: { key: 'Enter', ctrlKey: true },
    reset: { key: 'r', ctrlKey: true }
  }
})

// Handle modal events
document.addEventListener('*.confirm', e => {
  e.detail.originalEvent.target.closest('.dialog')?.querySelector('.confirm-btn')?.click()
})
```

### Gaming Controls

```javascript
const gameFilter = new DomEventFilter({
  // Movement in game area
  game: {
    moveUp: { key: 'ArrowUp' },
    moveDown: { key: 'ArrowDown' },
    moveLeft: { key: 'ArrowLeft' },
    moveRight: { key: 'ArrowRight' },
    jump: { key: ' ' },
    shoot: { key: 'x' }
  },

  // Menu controls
  menu: {
    select: { key: 'Enter' },
    back: { key: 'Escape' },
    up: { key: 'ArrowUp' },
    down: { key: 'ArrowDown' }
  },

  // Cheat codes
  godMode: [
    { key: 'i' }, { key: 'd' }, { key: 'd' }, { key: 'q' }, { key: 'd' }
  ],

  keyFullAmmo: [
    { key: 'i' }, { key: 'd' }, { key: 'k' }, { key: 'f' }, { key: 'a' }
  ]
})
```

## 🔧 API Reference

### Constructor

```javascript
new DomEventFilter(config, settings)
```

- **config**: Event configuration (Object or Array) - see Configuration section above
- **settings**: Optional settings object - see Custom Settings section above

### Methods

```javascript
filter.addListeners()  // Reinitialize event listeners with current configuration
```

Reprocesses the current configuration and rebinds all event listeners. Useful when you need to refresh the filter after changing DOM structure or settings.

### Public Properties

```javascript
filter.eventTypes  // Object containing categorized event types for sequence management
```

The `eventTypes` object categorizes DOM events for internal sequence clearing logic. It has this structure:

```javascript
{
  keyboard: ['keydown', 'keypress', 'keyup'],
  mouse: ['click', 'mousedown', 'mouseup'],
  mouse2: ['auxclick', 'contextmenu', 'dblclick', 'wheel'],
  touch: ['touchstart', 'touchend', 'touchcancel'],
  drag: ['dragstart', 'dragend'],
  nav: ['focus', 'blur']
}
```

---

**Made with ❤️ by [Petro Borshchahivskyi](https://github.com/Liksu)**
