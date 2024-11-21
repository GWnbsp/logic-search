export class ExactMatcher {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            segmentation: true, // 是否使用中文分词
            stopWords: new Set(['的', '了', '和', '与', '或', '及', '等', '中', '在']), // 停用词
            ...options
        };
    }

    match(text, term) {
        if (!text || !term) return { match: false, score: 0 };

        text = this.preprocessText(text);
        term = this.preprocessText(term);

        // 处理精确短语匹配
        if (term.startsWith('"') && term.endsWith('"')) {
            term = term.slice(1, -1);
            const exactMatch = text.includes(term);
            return {
                match: exactMatch,
                score: exactMatch ? 1 : 0
            };
        }

        // 分词处理
        const textTokens = this.tokenize(text);
        const termTokens = this.tokenize(term);

        // 计算匹配分数
        let matchCount = 0;
        for (const termToken of termTokens) {
            if (textTokens.includes(termToken)) {
                matchCount++;
            }
        }

        const score = termTokens.length > 0 ? matchCount / termTokens.length : 0;
        return {
            match: score > 0,
            score: score
        };
    }

    preprocessText(text) {
        text = String(text);

        if (!this.options.caseSensitive) {
            text = text.toLowerCase();
        }

        // 移除标点符号
        text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

        return text;
    }

    tokenize(text) {
        if (!this.options.segmentation) {
            return text.split(/\s+/).filter(token => token.length > 0);
        }

        // 简单的中文分词实现
        const tokens = [];
        let current = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // 处理英文和数字
            if (/[a-zA-Z0-9]/.test(char)) {
                current += char;
                continue;
            }

            // 处理中文
            if (current) {
                tokens.push(current);
                current = '';
            }

            if (/[\u4e00-\u9fa5]/.test(char)) {
                tokens.push(char);
            }
        }

        if (current) {
            tokens.push(current);
        }

        // 过滤停用词
        return tokens.filter(token =>
            token.length > 0 && !this.options.stopWords.has(token)
        );
    }

    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
    }
}