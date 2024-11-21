export class WildcardMatcher {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            ...options
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

        // 将通配符模式转换为正则表达式
        const regexPattern = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
            .replace(/\*/g, '.*')                  // 将 * 转换为 .*
            .replace(/\?/g, '.');                  // 将 ? 转换为 .

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(text);
    }
}