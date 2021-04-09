import ConfigManager from "./config.js";

class DomEventFilter {
    contextAttribute = 'data-context';
    eventType = 'keydown';
    rootElement = document;
    resultEventType = ['{{eventConfig.context[0]}}.{{name}}', 'DOMFilterEvent'];
    sequenceTimeLimit = 720;

    eventTypes = {
        keyboard: ['keydown', 'keypress', 'keyup'],
        mouse: ['click', 'mousedown', 'mouseup'],
        mouse2: ['auxclick', 'contextmenu', 'dblclick', 'wheel'],
        touch: ['touchstart', 'touchend', 'touchcancel'],
        drag: ['dragstart', 'dragend'],
        nav: ['focus', 'blur']
    };

    events = new ConfigManager();

    #eventTypes = [];
    #inSequence = false;
    #timerId = 0;

    constructor(config = {}, settings = {}) {
        Object.assign(this, settings);
        this.events.config = config;
        if (!this.eventType) return;
        this.addListeners();
    };

    addListeners() {
        if (!this.rootElement) return;

        // allow to set eventTypes as plain array of types
        if (this.eventTypes instanceof Array) {
            this.eventTypes = {any: this.eventTypes};
        }

        // make #eventTypes iterable store of all event types divided by categories
        this.#eventTypes = [];
        this.#eventTypes.categories = this.eventTypes;
        Object.entries(this.eventTypes).forEach(([category, types]) => {
            types.forEach(type => {
                this.#eventTypes.push(type);
                this.#eventTypes[type] = category;
            });
        });

        // clear all
        this.#eventTypes.forEach(type => {
            this.rootElement.removeEventListener(type, this.filter, false);
            this.rootElement.removeEventListener(type, this.#clearSequence, false);
        });

        // add new registered events as filters
        const types = this.eventType?.split(/\s+/) ?? [];
        const excludeTypes = [];
        types.forEach(eventType => {
            this.rootElement.addEventListener(eventType, this.filter, false);

            // exclude group of event types from cleaning sequence
            excludeTypes.push(...this.#eventTypes.categories[this.#eventTypes[eventType]]);
        });

        // add all other events to clear sequence
        this.#eventTypes
            .filter(type => !excludeTypes.includes(type))
            .forEach(type => this.rootElement.addEventListener(type, this.#clearSequence, false))
    }

    #resetTimer(cb = null) {
        if (this.#timerId) {
            clearTimeout(this.#timerId);
            this.#timerId = 0;
        }

        if (this.sequenceTimeLimit) {
            this.#timerId = setTimeout(cb, this.sequenceTimeLimit);
        }
    }

    #clearSequence = (item = null) => {
        this.#resetTimer();

        if (!item || item instanceof Event) {
            this.#inSequence = false;
            this.events.config
                .filter(item => item.sequenceLastIndex)
                .forEach(this.#clearSequence);
        } else {
            item.sequenceIndex = 0;
            item.mask = item.sequence[0];
        }
    }

    #emit(originalEvent, composedContexts, eventConfig) {
        const context = composedContexts[0] ?? null;
        const {name} = eventConfig;

        const detail = {
            name,
            context,
            composedContexts,
            originalEvent,
            eventConfig
        };

        if (!(this.resultEventType instanceof Array)) {
            this.resultEventType = [this.resultEventType];
        }

        this.resultEventType.forEach(resultEventType => {
            const eventType = resultEventType.replace(/{{([\w.\[\]]+)}}/g, (_, key) => {
                const keys = key.split(/[\[\].]/).filter(s => s);
                return keys.reduce((obj, key) => obj?.[key], detail) ?? '*';
            });

            const event = new CustomEvent(eventType, {detail});
            this.rootElement.dispatchEvent(event);
        });
    }

    #matchEvent(contextsMap, eventConfig, event) {
        const isMaskEqual = Object.entries(eventConfig.mask)
            .every(([field, value]) => {
                if (['target', 'srcElement', 'toElement'].includes(field) && String(value) === value) {
                    return event[field].matches(value);
                }

                return event[field] == value;
            });

        if (!isMaskEqual) return false;

        let index = 0;
        const isContextMatches = eventConfig.context.every(context => {
            if (contextsMap[context] >= index) {
                index = contextsMap[context];
                return true;
            }

            return false;
        });

        if (!isContextMatches) return false;

        if (eventConfig.sequenceLastIndex && eventConfig.sequenceIndex < eventConfig.sequenceLastIndex) {
            eventConfig.mask = eventConfig.sequence[++eventConfig.sequenceIndex];
            this.#resetTimer(this.#clearSequence);
            event.preventDefault();
            return false;
        }

        return true;
    }

    filter = (event) => {
        const contexts = event.composedPath()
            .map(el => el.getAttribute?.(this.contextAttribute))
            .filter(value => value);

        const contextsMap = contexts.reduce((accum, key, i) => ({...accum, [key]: i}), {});

        const result = this.events.config
            .filter(eventConfig => this.#matchEvent(contextsMap, eventConfig, event))
            .sort((a, b) => b.context.length - a.context.length || contextsMap[b.context[0]] - contextsMap[b.context[0]])
            .shift();

        if (result) {
            this.#clearSequence();

            if (this.rootElement && this.resultEventType) {
                this.#emit(event, contexts, result);
            }

            event.preventDefault();
            return false;
        }
    }
}

export default DomEventFilter;