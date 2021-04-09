export default class ConfigManager {
    #config = [];

    constructor(config) {
        this.config = config;
    }

    /**
     * Checks for a plain object, or array of objects
     *
     * @param value {Object | Array<Object>}
     * @param withSequence {boolean}
     * @returns {boolean}
     */
    static #isAllowedValue(value, withSequence = true) {
        if (!value) return false;

        const check = value => value && value.constructor === Object;
        const isObject = check(value);

        if (withSequence) {
            const allowedArray = value instanceof Array && value.every(check);
            return allowedArray || isObject;
        }

        return isObject;
    }

    /**
     * Checks object that its values are not plain objects or array of plain objects
     *
     * @param item {Object | Array<Object>}
     * @returns {boolean}
     */
    static #isDeepValue(item) {
        if (!item) return false;
        const check = value => ConfigManager.#isAllowedValue(value, false);

        if (item instanceof Array) return !item.every(check);

        return Object.values(item).some(check);
    }

    /**
     * Fix mask object if needed
     * The first fix is for uppercase of mask.key when shift should be pressed
     * (in this case event.key always contains uppercase string)
     *
     * @param mask
     */
    static #fixMask(mask) {
        if (mask.shiftKey && mask.key && mask.key === mask.key.toLowerCase()) {
            mask.key = mask.key.toUpperCase();
        }
    }

    /**
     * Process passed config to config items and store the result as local config
     *
     * @param config {Array<Object>}
     */
    #storeConfig(config) {
        if (!(config instanceof Array)) return;

        this.#config = config.map(item => {
            let {name, mask, context, sequence} = item;
            mask ??= sequence?.[0] || {};
            context ??= [];
            sequence ??= [mask];
            name ??= '';

            if (mask instanceof Array) {
                sequence = mask;
                mask = sequence[0];
            }

            ConfigManager.#fixMask(mask);

            return {
                ...item,
                name,
                mask,
                context,
                sequence,
                sequenceIndex: item.sequenceIndex ?? 0, // no idea why it can be passed, but let it be
                sequenceLastIndex: sequence.length - 1
            };
        });
    }

    /**
     * If deep object config passed, translate it to flat array
     *
     * @param config {Object}
     * @param [parent] {Array<string>}
     * @returns {Array<Object>}
     */
    #processDeepConfig(config, parent = []) {
        const result = [];

        Object.entries(config)
            .filter(([key, value]) => ConfigManager.#isAllowedValue(value))
            .forEach(([key, value]) => {
                if (ConfigManager.#isDeepValue(value)) {
                    const deepResult = this.#processDeepConfig(value, [key, ...parent]);
                    result.push(...deepResult);
                } else {
                    result.push({
                        context: parent,
                        name: key,
                        mask: value
                    });
                }
            });

        return result;
    }

    /**
     * Get stored config
     *
     * @returns {Array<Object>}
     */
    get config() {
        return this.#config;
    }

    /**
     * Set new config
     *
     * @param config {Object | Array<Object>}
     */
    set config(config) {
        this.#config.splice(0);
        if (!config) return;

        if (!(config instanceof Array)) {
            config = this.#processDeepConfig(config);
        }

        this.#storeConfig(config);
    }
}