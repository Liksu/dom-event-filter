import {DomEventFilter} from "./index.js";

const filter = new DomEventFilter({
    save: {key: 's', ctrlKey: true},
    open: {key: 'o', altKey: true},
    ping: {target: document.body, type: 'click'},
    editor: {
        save: {key: 's', ctrlKey: true},
        autocomplete: [{keyCode: 9}, {keyCode: 9}]
    },
    konami: [
        {key: 'ArrowUp'},
        {key: 'ArrowUp'},
        {key: 'ArrowDown'},
        {key: 'ArrowDown'},
        {key: 'ArrowLeft'},
        {key: 'ArrowRight'},
        {key: 'ArrowLeft'},
        {key: 'ArrowRight'},
    ],
    info: {
        target: '#info-btn',
        type: 'click',
        ctrlKey: true
    }
}, {
    eventType: 'click keydown'
});

document.addEventListener('editor.save', e => {
    console.log(e.type, e.detail);
});

document.addEventListener('*.info', e => {
    console.log(e.type, e.detail);
});

document.addEventListener('DOMFilterEvent', e => {
    console.warn(e.type, e.detail);
});

window.filter = filter;
