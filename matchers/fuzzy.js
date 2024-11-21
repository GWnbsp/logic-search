import leven from 'leven';

export class FuzzyMatcher {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            fuzzyThreshold: 0.8,
            useNgram: true,        // 使用N-gram匹配
            ngramSize: 2,          // N-gram大小
            weightByLength: true,   // 根据长度加权
            ...options
        };
    }

    match(text, term, maxDistance = 2) {
        if (!text || !term) return { match: false, score: 0 };

        text = String(text);
        term = String(term);

        if (!this.options.caseSensitive) {
            text = text.toLowerCase();
            term = term.toLowerCase();
        }

        // 分词处理
        const textTokens = this.tokenize(text);
        const termTokens = this.tokenize(term);

        let maxScore = 0;
        let matched = false;

        // 对每个词进行模糊匹配
        for (const textToken of textTokens) {
            for (const termToken of termTokens) {
                // 跳过长度差异过大的词
                if (Math.abs(textToken.length - termToken.length) > maxDistance) {
                    continue;
                }

                // 计算编辑距离
                const distance = leven(textToken, termToken);
                let similarity = 1 - (distance / Math.max(textToken.length, termToken.length));

                // 根据词长度调整分数
                if (this.options.weightByLength) {
                    similarity *= Math.min(textToken.length, termToken.length) /
                        Math.max(textToken.length, termToken.length);
                }

                // N-gram 相似度
                if (this.options.useNgram) {
                    const ngramSimilarity = this.calculateNgramSimilarity(
                        textToken,
                        termToken,
                        this.options.ngramSize
                    );
                    similarity = (similarity + ngramSimilarity) / 2;
                }

                if (similarity > maxScore) {
                    maxScore = similarity;
                }

                if (similarity >= this.options.fuzzyThreshold || distance <= maxDistance) {
                    matched = true;
                }
            }
        }

        return {
            match: matched,
            score: maxScore
        };
    }

    tokenize(text) {
        // 处理中英文混合分词
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

    calculateNgramSimilarity(str1, str2, n) {
        const getNgrams = (str, n) => {
            const ngrams = new Set();
            for (let i = 0; i <= str.length - n; i++) {
                ngrams.add(str.slice(i, i + n));
            }
            return ngrams;
        };

        const ngrams1 = getNgrams(str1, n);
        const ngrams2 = getNgrams(str2, n);

        // 计算Jaccard相似度
        const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
        const union = new Set([...ngrams1, ...ngrams2]);

        return intersection.size / union.size;
    }

    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
    }
}