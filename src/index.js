import { QueryParser } from './parser.js';
import { QueryEvaluator } from './evaluator.js';

export class LogicSearch {
    constructor(data = [], options = {}) {
        this.data = data;
        this.options = {
            caseSensitive: false,
            fuzzyThreshold: 0.8,
            fields: null,
            weights: null,
            ...options
        };

        this.parser = new QueryParser();
        this.evaluator = new QueryEvaluator(this.options);
    }

    search(query) {
        if (!query) return [];

        try {
            // 解析查询为AST
            const ast = this.parser.parse(query);

            // 评估每个文档
            const results = this.data
                .map(item => ({
                    item,
                    evaluation: this.evaluator.evaluate(ast, item)
                }))
                .filter(result => result.evaluation.match)
                .sort((a, b) => b.evaluation.score - a.evaluation.score)
                .map(result => ({
                    ...result.item,
                    _score: result.evaluation.score  // 可选：添加分数信息
                }));

            return results;
        } catch (error) {
            console.error('搜索错误:', error);
            return [];
        }
    }

    addDocument(doc) {
        this.data.push(doc);
    }

    removeDocument(id) {
        const index = this.data.findIndex(doc =>
            doc.id === id || doc._id === id || doc.uid === id
        );

        if (index !== -1) {
            this.data.splice(index, 1);
            return true;
        }
        return false;
    }

    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
        this.evaluator.setOptions(this.options);
    }
}

// Export individual components for advanced usage
export { QueryParser } from './parser.js';
export { QueryEvaluator } from './evaluator.js';
export { ExactMatcher } from '../matchers/exact.js';
export { FuzzyMatcher } from '../matchers/fuzzy.js';
export { WildcardMatcher } from '../matchers/wildcard.js';

