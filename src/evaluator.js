import { TokenType } from './parser.js';
import { ExactMatcher } from './matchers/exact.js';
import { FuzzyMatcher } from './matchers/fuzzy.js';
import { WildcardMatcher } from './matchers/wildcard.js';

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
                price: 1.0,
                ...options.weights,
            },
            ...options,
        };

        // 初始化匹配器
        this.exactMatcher = new ExactMatcher(this.options);
        this.fuzzyMatcher = new FuzzyMatcher(this.options);
        this.wildcardMatcher = new WildcardMatcher(this.options);
    }

    evaluateQuery(doc, query) {
        if (!query) {
            return { match: false, score: 0 };
        }

        const result = this.evaluateNode(doc, query);

        // 处理特殊组合查询
        if (query.type === TokenType.AND) {
            // 对于评分和价格范围的组合查询，增加权重
            const isRatingQuery =
                this.isFieldQuery(query.left, 'rating') || this.isFieldQuery(query.right, 'rating');
            const isPriceQuery =
                this.isFieldQuery(query.left, 'priceRange') ||
                this.isFieldQuery(query.right, 'priceRange');

            if (isRatingQuery && isPriceQuery) {
                result.score *= 1.2; // 提高组合查询的权重
            }
        }

        return result;
    }

    evaluateNode(doc, node) {
        if (!node) return { match: false, score: 0 };

        switch (node.type) {
            case TokenType.AND: {
                const left = this.evaluateNode(doc, node.left);
                if (!left.match) return { match: false, score: 0 };
                const right = this.evaluateNode(doc, node.right);
                return {
                    match: left.match && right.match,
                    score: (left.score + right.score) / 2,
                };
            }

            case TokenType.OR: {
                const left = this.evaluateNode(doc, node.left);
                const right = this.evaluateNode(doc, node.right);
                return {
                    match: left.match || right.match,
                    score: Math.max(left.score, right.score),
                };
            }

            case TokenType.NOT: {
                const result = this.evaluateNode(doc, node.operand);
                return {
                    match: !result.match,
                    score: result.match ? 0 : 1,
                };
            }

            case TokenType.FIELD: {
                const result = this.evaluateField(doc, node.field, node.operator, node.value);
                const weight = this.options.weights[node.field] || 1;
                return {
                    match: result.match,
                    score: result.score * weight,
                };
            }

            case TokenType.TEXT: {
                return this.evaluateText(doc, node.value);
            }

            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    isFieldQuery(node, fieldName) {
        return node && node.type === TokenType.FIELD && node.field === fieldName;
    }

    evaluateField(doc, field, operator, value) {
        const fieldValue = this.getFieldValue(doc, field);

        // 处理字段不存在的情况
        if (fieldValue === undefined) {
            return { match: operator === 'NOT', score: 0 };
        }

        // 处理数组字段
        if (Array.isArray(fieldValue)) {
            // 对于数组字段，任一元素匹配即可
            for (const item of fieldValue) {
                const result = this.compareValues(item, operator, value);
                if (result.match) return result;
            }
            return { match: false, score: 0 };
        }

        return this.compareValues(fieldValue, operator, value);
    }

    getFieldValue(obj, field) {
        const parts = field.split('.');
        let value = obj;

        for (const part of parts) {
            if (value === null || value === undefined) {
                return undefined;
            }

            // 处理数组字段
            if (Array.isArray(value)) {
                // 如果是数组，搜索所有元素
                const results = value
                    .map((item) => {
                        if (typeof item === 'object' && item !== null) {
                            return this.getFieldValue(item, part);
                        }
                        return item;
                    })
                    .filter((v) => v !== undefined);

                // 如果找到任何匹配，返回第一个
                return results.length > 0 ? results[0] : undefined;
            }

            value = value[part];
        }

        return value;
    }

    compareValues(fieldValue, operator, value) {
        // 处理 null 和 undefined
        if (fieldValue === null || fieldValue === undefined) {
            return { match: operator === 'NOT', score: 0 };
        }

        // 处理数值比较
        const numericValue = this.extractNumber(value);
        const numericFieldValue = this.extractNumber(fieldValue);

        if (numericValue !== null && numericFieldValue !== null) {
            switch (operator) {
                case '>':
                    return { match: numericFieldValue > numericValue, score: 1 };
                case '>=':
                    return { match: numericFieldValue >= numericValue, score: 1 };
                case '<':
                    return { match: numericFieldValue < numericValue, score: 1 };
                case '<=':
                    return { match: numericFieldValue <= numericValue, score: 1 };
                case '=':
                    return { match: numericFieldValue === numericValue, score: 1 };
                case 'NOT':
                    return { match: numericFieldValue !== numericValue, score: 1 };
            }
        }

        // 字符串比较
        const strFieldValue = String(fieldValue);
        const strValue = String(value);

        // 处理价格等级比较
        if (fieldValue.startsWith('￥') && value.startsWith('￥')) {
            const fieldLevel = fieldValue.length;
            const valueLevel = value.length;
            return {
                match:
                    operator === '>='
                        ? fieldLevel >= valueLevel
                        : operator === '>'
                            ? fieldLevel > valueLevel
                            : operator === '<='
                                ? fieldLevel <= valueLevel
                                : operator === '<'
                                    ? fieldLevel < valueLevel
                                    : operator === '='
                                        ? fieldLevel === valueLevel
                                        : operator === 'NOT'
                                            ? fieldLevel !== valueLevel
                                            : false,
                score: 1,
            };
        }

        switch (operator) {
            case '=':
                return {
                    match: this.exactMatcher.matches(strFieldValue, strValue),
                    score: 1,
                };
            case 'NOT':
                return {
                    match: !this.exactMatcher.matches(strFieldValue, strValue),
                    score: 1,
                };
            case 'WILDCARD':
                return {
                    match: this.wildcardMatcher.matches(strFieldValue, strValue),
                    score: 0.8,
                };
            case 'FUZZY': {
                const score = this.fuzzyMatcher.similarity(strFieldValue, strValue);
                return {
                    match: score >= this.options.fuzzyThreshold,
                    score: score,
                };
            }
            default:
                return { match: false, score: 0 };
        }
    }

    extractNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return null;

        // 提取字符串中的数字部分
        const match = value.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
    }

    evaluateText(item, value) {
        // 在所有字段中搜索文本
        for (const field in item) {
            const result = this.evaluateField(item, field, '=', value);
            if (result.match) return result;
        }
        return { match: false, score: 0 };
    }

    evaluateAnd(node) {
        const leftResult = this.evaluate(node.left);
        const rightResult = this.evaluate(node.right);
        const result = leftResult.filter((doc) =>
            rightResult.some((rightDoc) => rightDoc.id === doc.id)
        );
        return result;
    }

    evaluateOr(node) {
        const leftResult = this.evaluate(node.left);
        const rightResult = this.evaluate(node.right);
        const result = [...new Set([...leftResult, ...rightResult])];
        return result;
    }

    evaluateNot(node) {
        const operandResult = this.evaluate(node.operand);
        const result = this.documents.filter(
            (doc) => !operandResult.some((opDoc) => opDoc.id === doc.id)
        );
        return result;
    }

    evaluatePhrase(node) {
        const phrase = node.value;
        const results = this.documents.filter((doc) => {
            return this.matches(doc.text, phrase);
        });
        return results;
    }

    evaluateGroup(node) {
        return this.evaluate(node.expression);
    }

    evaluateWildcard(node) {
        const pattern = node.value;
        const results = this.documents.filter((doc) => {
            return this.matches(doc.text, pattern);
        });
        return results;
    }

    evaluateFuzzy(node) {
        const term = node.value;
        const results = this.documents.filter((doc) => {
            return this.matches(doc.text, term);
        });
        return results;
    }
}
