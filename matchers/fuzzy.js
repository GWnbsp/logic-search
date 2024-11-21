import leven from 'leven';

export class FuzzyMatcher {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            fuzzyThreshold: 0.8,
            ...options
        };
    }

    matches(text, pattern) {
        return this.similarity(text, pattern) >= this.options.fuzzyThreshold;
    }

    similarity(text, pattern) {
        if (text === null || text === undefined || pattern === null || pattern === undefined) {
            return 0;
        }

        text = String(text);
        pattern = String(pattern);

        if (!this.options.caseSensitive) {
            text = text.toLowerCase();
            pattern = pattern.toLowerCase();
        }

        if (text === pattern) return 1;
        if (text.length === 0 || pattern.length === 0) return 0;

        // 使用 Levenshtein 距离计算相似度
        const distance = this.levenshteinDistance(text, pattern);
        const maxLength = Math.max(text.length, pattern.length);
        return 1 - distance / maxLength;
    }

    levenshteinDistance(text, pattern) {
        const m = text.length;
        const n = pattern.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (text[i - 1] === pattern[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j - 1] + 1,  // 替换
                        dp[i][j - 1] + 1,      // 插入
                        dp[i - 1][j] + 1       // 删除
                    );
                }
            }
        }

        return dp[m][n];
    }
}