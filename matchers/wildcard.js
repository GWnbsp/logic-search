export class WildcardMatcher {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            segmentation: true,    // 是否使用分词
            partialMatch: true,    // 允许部分匹配
            ...options
        };

        // 通配符特殊字符映射
        this.specialChars = {
            '*': '.*',
            '?': '.',
            '+': '\\+',
            '|': '\\|',
            '{': '\\{',
            '}': '\\}',
            '[': '\\[',
            ']': '\\]',
            '(': '\\(',
            ')': '\\)',
            '^': '\\^',
            '$': '\\$',
            '.': '\\.'
        };
    }

    match(text, pattern) {
        if (!text || !pattern) return { match: false, score: 0 };

        text = String(text);
        pattern = String(pattern);

        if (!this.options.caseSensitive) {
            text = text.toLowerCase();
            pattern = pattern.toLowerCase();
        }

        // 处理中文分词
        if (this.options.segmentation) {
            return this.matchWithSegmentation(text, pattern);
        }

        // 转换通配符模式为正则表达式
        const regexPattern = this.wildcardToRegex(pattern);
        const regex = new RegExp(regexPattern);

        // 对整个文本进行匹配
        const fullMatch = regex.test(text);

        // 计算匹配分数
        let score = 0;
        if (fullMatch) {
            // 根据匹配的精确度计算分数
            score = this.calculateMatchScore(text, pattern);
        }

        return {
            match: fullMatch,
            score: score
        };
    }

    matchWithSegmentation(text, pattern) {
        // 分词处理
        const textTokens = this.tokenize(text);
        const patternRegex = new RegExp(this.wildcardToRegex(pattern));

        let maxScore = 0;
        let matched = false;

        // 对每个词进行匹配
        for (const token of textTokens) {
            if (patternRegex.test(token)) {
                matched = true;
                const score = this.calculateMatchScore(token, pattern);
                maxScore = Math.max(maxScore, score);
            }
        }

        return {
            match: matched,
            score: maxScore
        };
    }

    wildcardToRegex(pattern) {
        // 转义特殊字符
        let regexPattern = pattern.split('').map(char =>
            this.specialChars[char] || char
        ).join('');

        // 添加边界标记（如果不是部分匹配模式）
        if (!this.options.partialMatch) {
            regexPattern = '^' + regexPattern + '$';
        }

        return regexPattern;
    }

    calculateMatchScore(text, pattern) {
        // 计算非通配符字符的匹配程度
        const nonWildcardChars = pattern.replace(/[*?]/g, '');
        const matchedChars = nonWildcardChars.split('').filter(char =>
            text.includes(char)
        ).length;

        return nonWildcardChars.length > 0 ?
            matchedChars / nonWildcardChars.length :
            0.5; // 如果模式全是通配符，给予中等分数
    }

    tokenize(text) {
        // 处理中英文混合文本
        return text.split(/[\s,，。；;]+/)
            .filter(token => token.length > 0)
            .map(token => {
                if (/^[\u4e00-\u9fa5]+$/.test(token)) {
                    // 中文字符，单字分词
                    return Array.from(token);
                }
                return [token];
            })
            .flat();
    }

    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
    }
}