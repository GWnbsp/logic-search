export class ExactMatcher {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            ...options,
        };
    }

    matches(text, pattern) {
        if (text === null || text === undefined || pattern === null || pattern === undefined) {
            return false;
        }

        text = String(text);
        pattern = String(pattern);

        if (!this.options.caseSensitive) {
            text = text.toLowerCase();
            pattern = pattern.toLowerCase();
        }

        return text === pattern;
    }
}
