// Token types
export const TokenType = {
    FIELD: 'FIELD',
    TEXT: 'TEXT',
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT',
    PARENTHESIS: 'PARENTHESIS',
};

class Parser {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            ...options,
        };
    }

    tokenize(query) {
        const tokens = [];
        let current = '';
        let inQuotes = false;
        let isEscaped = false;

        for (let i = 0; i < query.length; i++) {
            const char = query[i];

            if (isEscaped) {
                current += char;
                isEscaped = false;
                continue;
            }

            if (char === '\\') {
                isEscaped = true;
                continue;
            }

            if (char === '"' && !isEscaped) {
                inQuotes = !inQuotes;
                continue;
            }

            if (!inQuotes && /\s/.test(char)) {
                if (current) {
                    tokens.push(this.parseToken(current));
                    current = '';
                }
                continue;
            }

            current += char;
        }

        if (current) {
            tokens.push(this.parseToken(current));
        }

        return this.processTokens(tokens);
    }

    parseToken(token) {
        // 处理字段查询
        if (token.includes(':')) {
            const [field, ...rest] = token.split(':');
            const value = rest.join(':'); // 处理值中可能包含的冒号

            // 处理否定
            if (field.startsWith('!')) {
                return {
                    type: TokenType.FIELD,
                    field: field.slice(1),
                    operator: 'NOT',
                    value: this.parseValue(value),
                };
            }

            // 处理比较运算符
            const operators = ['>=', '<=', '>', '<', '='];
            for (const op of operators) {
                if (value.startsWith(op)) {
                    return {
                        type: TokenType.FIELD,
                        field,
                        operator: op,
                        value: this.parseValue(value.slice(op.length)),
                    };
                }
            }

            // 处理通配符
            if (value.includes('*')) {
                return {
                    type: TokenType.FIELD,
                    field,
                    operator: 'WILDCARD',
                    value,
                };
            }

            // 处理模糊匹配
            if (value.includes('~')) {
                const [val, threshold] = value.split('~');
                return {
                    type: TokenType.FIELD,
                    field,
                    operator: 'FUZZY',
                    value: val,
                    threshold: Number(threshold) || undefined,
                };
            }

            return {
                type: TokenType.FIELD,
                field,
                operator: '=',
                value: this.parseValue(value),
            };
        }

        // 处理布尔运算符
        if (['AND', '&&'].includes(token.toUpperCase())) {
            return { type: TokenType.AND };
        }
        if (['OR', '||'].includes(token.toUpperCase())) {
            return { type: TokenType.OR };
        }
        if (['NOT', '!'].includes(token.toUpperCase())) {
            return { type: TokenType.NOT };
        }

        // 处理括号
        if (token === '(' || token === ')') {
            return { type: TokenType.PARENTHESIS, value: token };
        }

        // 处理普通文本
        return { type: TokenType.TEXT, value: token };
    }

    parseValue(value) {
        // 尝试转换为数字
        if (!isNaN(value)) {
            return Number(value);
        }

        // 处理布尔值
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // 处理 null
        if (value.toLowerCase() === 'null') return null;

        // 保持原始字符串
        return value;
    }

    processTokens(tokens) {
        // 处理隐式 AND 操作符
        const result = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = tokens[i + 1];

            result.push(token);

            if (
                nextToken &&
                token.type !== TokenType.AND &&
                token.type !== TokenType.OR &&
                token.type !== TokenType.NOT &&
                token.type !== TokenType.PARENTHESIS &&
                nextToken.type !== TokenType.AND &&
                nextToken.type !== TokenType.OR &&
                nextToken.type !== TokenType.NOT &&
                nextToken.type !== TokenType.PARENTHESIS &&
                nextToken.value !== ')'
            ) {
                result.push({ type: TokenType.AND });
            }
        }

        return result;
    }

    buildAST(tokens) {
        const output = [];
        const operators = [];

        const precedence = {
            [TokenType.NOT]: 3,
            [TokenType.AND]: 2,
            [TokenType.OR]: 1,
        };

        for (const token of tokens) {
            if (token.type === TokenType.FIELD || token.type === TokenType.TEXT) {
                output.push(token);
            } else if (
                token.type === TokenType.NOT ||
                token.type === TokenType.AND ||
                token.type === TokenType.OR
            ) {
                while (
                    operators.length > 0 &&
                    operators[operators.length - 1].type !== TokenType.PARENTHESIS &&
                    precedence[operators[operators.length - 1].type] >= precedence[token.type]
                ) {
                    output.push(operators.pop());
                }
                operators.push(token);
            } else if (token.type === TokenType.PARENTHESIS && token.value === '(') {
                operators.push(token);
            } else if (token.type === TokenType.PARENTHESIS && token.value === ')') {
                while (
                    operators.length > 0 &&
                    operators[operators.length - 1].type !== TokenType.PARENTHESIS
                ) {
                    output.push(operators.pop());
                }
                if (
                    operators.length > 0 &&
                    operators[operators.length - 1].type === TokenType.PARENTHESIS
                ) {
                    operators.pop(); // 移除左括号
                    // 处理括号后的 NOT 操作符
                    if (
                        operators.length > 0 &&
                        operators[operators.length - 1].type === TokenType.NOT
                    ) {
                        output.push(operators.pop());
                    }
                }
            }
        }

        while (operators.length > 0) {
            const op = operators.pop();
            if (op.type !== TokenType.PARENTHESIS) {
                output.push(op);
            }
        }

        return this.buildTree(output);
    }

    buildTree(tokens) {
        const stack = [];

        for (const token of tokens) {
            if (token.type === TokenType.NOT) {
                if (stack.length < 1) throw new Error('Invalid NOT operation');
                const operand = stack.pop();
                stack.push({
                    type: TokenType.NOT,
                    operand,
                });
            } else if (token.type === TokenType.AND || token.type === TokenType.OR) {
                if (stack.length < 2) throw new Error(`Invalid ${token.type} operation`);
                const right = stack.pop();
                const left = stack.pop();
                stack.push({
                    type: token.type,
                    left,
                    right,
                });
            } else {
                stack.push(token);
            }
        }

        if (stack.length !== 1) throw new Error('Invalid expression');
        return stack[0];
    }
}

export class QueryParser {
    constructor(options = {}) {
        this.options = {
            caseSensitive: false,
            ...options,
        };
        this.parser = new Parser();
    }

    parse(query) {
        const tokens = this.parser.tokenize(query);
        return this.parser.buildAST(tokens);
    }
}
