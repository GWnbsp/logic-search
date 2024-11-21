import { TokenType } from './parser.js';
import { ExactMatcher } from '../matchers/exact.js';
import { FuzzyMatcher } from '../matchers/fuzzy.js';
import { WildcardMatcher } from '../matchers/wildcard.js';

export class QueryEvaluator {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            fuzzyThreshold: 0.8,
            weights: {
                name: 2.0,
                description: 1.5,
                tags: 1.2,
                category: 1.0,
                brand: 1.0,
                specs: 1.0,
                price: 1.0
            },
            ...options
        };

        // 初始化匹配器
        this.exactMatcher = new ExactMatcher(this.options);
        this.fuzzyMatcher = new FuzzyMatcher(this.options);
        this.wildcardMatcher = new WildcardMatcher(this.options);
    }

    evaluate(ast, item) {
        if (!ast) return { match: false, score: 0 };

        switch (ast.type) {
            case TokenType.AND:
                const leftAnd = this.evaluate(ast.left, item);
                // 如果左边不匹配，直接返回，避免不必要的计算
                if (!leftAnd.match) {
                    return { match: false, score: 0 };
                }
                const rightAnd = this.evaluate(ast.right, item);
                return {
                    match: leftAnd.match && rightAnd.match,
                    score: rightAnd.match ? (leftAnd.score + rightAnd.score) / 2 : 0
                };

            case TokenType.OR:
                const leftOr = this.evaluate(ast.left, item);
                // 如果左边匹配，直接返回，避免不必要的计算
                if (leftOr.match) {
                    return { match: true, score: leftOr.score };
                }
                const rightOr = this.evaluate(ast.right, item);
                return {
                    match: leftOr.match || rightOr.match,
                    score: Math.max(leftOr.score, rightOr.score)
                };

            case TokenType.NOT:
                if (ast.expression.type === TokenType.FIELD) {
                    const field = ast.expression.value.field;
                    const term = ast.expression.value.term;
                    const fieldValue = this.getFieldValue(item, field);

                    // 如果字段不存在，NOT 条件为真
                    if (fieldValue === undefined) {
                        return { match: true, score: 1 };
                    }

                    // 使用精确匹配器检查字段值
                    const result = this.exactMatcher.match(String(fieldValue), term);

                    // 反转匹配结果
                    return {
                        match: !result.match,
                        score: result.match ? 0 : 1
                    };
                }

                // 处理其他类型的 NOT 操作
                const notResult = this.evaluate(ast.expression, item);
                return {
                    match: !notResult.match,
                    score: notResult.match ? 0 : 1
                };

            case TokenType.FIELD:
                return this.evaluateField(item, ast.value.field, ast.value.term);

            case TokenType.TERM:
                return this.evaluateTerm(item, ast.value);

            case TokenType.FUZZY:
                return this.evaluateFuzzy(item, ast.value.term, ast.value.distance);

            case TokenType.WILDCARD:
                return this.evaluateWildcard(item, ast.value);

            case TokenType.RANGE:
                return this.evaluateRange(item, ast.value.field, ast.value);

            default:
                throw new Error(`Unknown AST node type: ${ast.type}`);
        }
    }

    evaluateTerm(item, term) {
        let maxScore = 0;
        let matched = false;

        // 遍历所有字段
        for (const [field, weight] of Object.entries(this.options.weights)) {
            const fieldValue = this.getFieldValue(item, field);
            if (fieldValue !== undefined) {
                const matchResult = this.exactMatcher.match(String(fieldValue), term);
                if (matchResult.match) {
                    matched = true;
                    maxScore = Math.max(maxScore, matchResult.score * weight);
                }
            }
        }

        return { match: matched, score: maxScore };
    }

    evaluateField(item, field, term) {
        const fieldValue = this.getFieldValue(item, field);

        // 如果字段不存在
        if (fieldValue === undefined) {
            return { match: false, score: 0 };
        }

        // 处理数值比较
        if (typeof fieldValue === 'number') {
            // 处理大于等于
            if (term.startsWith('>=')) {
                const compareValue = parseFloat(term.slice(2));
                return {
                    match: fieldValue >= compareValue,
                    score: fieldValue >= compareValue ? Math.min(1, (fieldValue - compareValue) / compareValue) : 0
                };
            }
            // 处理小于等于
            if (term.startsWith('<=')) {
                const compareValue = parseFloat(term.slice(2));
                return {
                    match: fieldValue <= compareValue,
                    score: fieldValue <= compareValue ? Math.min(1, (compareValue - fieldValue) / compareValue) : 0
                };
            }
            // 处理大于
            if (term.startsWith('>')) {
                const compareValue = parseFloat(term.slice(1));
                return {
                    match: fieldValue > compareValue,
                    score: fieldValue > compareValue ? Math.min(1, (fieldValue - compareValue) / compareValue) : 0
                };
            }
            // 处理小于
            if (term.startsWith('<')) {
                const compareValue = parseFloat(term.slice(1));
                return {
                    match: fieldValue < compareValue,
                    score: fieldValue < compareValue ? Math.min(1, (compareValue - fieldValue) / compareValue) : 0
                };
            }
            // 处理等于
            if (term.startsWith('=')) {
                const compareValue = parseFloat(term.slice(1));
                return {
                    match: fieldValue === compareValue,
                    score: fieldValue === compareValue ? 1 : 0
                };
            }
            // 如果是纯数字，默认为等于比较
            if (!isNaN(term)) {
                const compareValue = parseFloat(term);
                return {
                    match: fieldValue === compareValue,
                    score: fieldValue === compareValue ? 1 : 0
                };
            }
        }

        // 处理数组字段（如tags）
        if (Array.isArray(fieldValue)) {
            let maxScore = 0;
            let matched = false;
            for (const value of fieldValue) {
                const result = this.exactMatcher.match(String(value), term);
                if (result.match) {
                    matched = true;
                    maxScore = Math.max(maxScore, result.score);
                }
            }
            return {
                match: matched,
                score: maxScore * (this.options.weights[field] || 1)
            };
        }

        // 处理对象字段（如specs）
        if (typeof fieldValue === 'object' && fieldValue !== null) {
            let maxScore = 0;
            let matched = false;
            for (const value of Object.values(fieldValue)) {
                const result = this.exactMatcher.match(String(value), term);
                if (result.match) {
                    matched = true;
                    maxScore = Math.max(maxScore, result.score);
                }
            }
            return {
                match: matched,
                score: maxScore * (this.options.weights[field] || 1)
            };
        }

        // 普通字段匹配
        const result = this.exactMatcher.match(String(fieldValue), term);
        return {
            match: result.match,
            score: result.match ? result.score * (this.options.weights[field] || 1) : 0
        };
    }

    evaluateFuzzy(item, term, maxDistance) {
        let maxScore = 0;
        let matched = false;

        // 遍历所有字段
        for (const [field, weight] of Object.entries(this.options.weights)) {
            const fieldValue = this.getFieldValue(item, field);
            if (fieldValue === undefined) continue;

            if (Array.isArray(fieldValue)) {
                // 处理数组字段
                for (const value of fieldValue) {
                    const result = this.fuzzyMatcher.match(String(value), term, maxDistance);
                    if (result.match) {
                        matched = true;
                        maxScore = Math.max(maxScore, result.score * weight);
                    }
                }
            } else if (typeof fieldValue === 'object' && fieldValue !== null) {
                // 处理对象字段
                for (const value of Object.values(fieldValue)) {
                    const result = this.fuzzyMatcher.match(String(value), term, maxDistance);
                    if (result.match) {
                        matched = true;
                        maxScore = Math.max(maxScore, result.score * weight);
                    }
                }
            } else {
                // 处理普通字段
                const result = this.fuzzyMatcher.match(String(fieldValue), term, maxDistance);
                if (result.match) {
                    matched = true;
                    maxScore = Math.max(maxScore, result.score * weight);
                }
            }
        }

        return { match: matched, score: maxScore };
    }

    evaluateWildcard(item, pattern) {
        let maxScore = 0;
        let matched = false;

        // 遍历所有字段
        for (const [field, weight] of Object.entries(this.options.weights)) {
            const fieldValue = this.getFieldValue(item, field);
            if (fieldValue === undefined) continue;

            // 处理数组字段
            if (Array.isArray(fieldValue)) {
                for (const value of fieldValue) {
                    const result = this.wildcardMatcher.match(String(value).toLowerCase(), pattern.toLowerCase());
                    if (result.match) {
                        matched = true;
                        maxScore = Math.max(maxScore, result.score * weight);
                    }
                }
                continue;
            }

            // 处理对象字段
            if (typeof fieldValue === 'object' && fieldValue !== null) {
                for (const value of Object.values(fieldValue)) {
                    const result = this.wildcardMatcher.match(String(value).toLowerCase(), pattern.toLowerCase());
                    if (result.match) {
                        matched = true;
                        maxScore = Math.max(maxScore, result.score * weight);
                    }
                }
                continue;
            }

            // 处理普通字段
            const result = this.wildcardMatcher.match(String(fieldValue).toLowerCase(), pattern.toLowerCase());
            if (result.match) {
                matched = true;
                maxScore = Math.max(maxScore, result.score * weight);
            }
        }

        return { match: matched, score: maxScore };
    }

    evaluateRange(item, field, term) {
        const fieldValue = this.getFieldValue(item, field);
        if (fieldValue === undefined || typeof fieldValue !== 'number') {
            return { match: false, score: 0 };
        }

        // 解析范围表达式
        const [min, max] = term.split(',').map(v => parseFloat(v.trim()));
        const match = (isNaN(min) || fieldValue >= min) && (isNaN(max) || fieldValue <= max);

        // 计算分数：值越接近范围中心，分数越高
        let score = 0;
        if (match) {
            if (!isNaN(min) && !isNaN(max)) {
                const center = (min + max) / 2;
                const range = max - min;
                score = 1 - Math.abs(fieldValue - center) / range;
            } else if (!isNaN(min)) {
                score = Math.min(1, (fieldValue - min) / min);
            } else if (!isNaN(max)) {
                score = Math.min(1, (max - fieldValue) / max);
            }
        }

        return {
            match,
            score: score * (this.options.weights[field] || 1)
        };
    }

    getFieldValue(item, field) {
        // 处理嵌套字段，如 specs.camera
        const parts = field.toLowerCase().split('.');
        let value = item;

        for (const part of parts) {
            if (value === undefined || value === null) return undefined;

            // 特殊处理：如果当前值是数组，尝试在每个元素中查找
            if (Array.isArray(value)) {
                const arrayResults = value.map(v => this.getFieldValue(v, part)).filter(v => v !== undefined);
                return arrayResults.length > 0 ? arrayResults : undefined;
            }

            // 对象字段查找：不区分大小写
            if (typeof value === 'object') {
                const key = Object.keys(value).find(k => k.toLowerCase() === part);
                value = key ? value[key] : undefined;
            } else {
                value = undefined;
            }
        }

        return value;
    }

    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
    }
}