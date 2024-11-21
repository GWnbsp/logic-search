// Token types
export const TokenType = {
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    TERM: 'TERM',
    FIELD: 'FIELD',
    FUZZY: 'FUZZY',
    WILDCARD: 'WILDCARD',
    RANGE: 'RANGE'
};

// Token class for representing lexical tokens
class Token {
    constructor(type, value, start = 0, end = 0) {
        this.type = type;
        this.value = value;
        this.start = start;
        this.end = end;
    }
}

export class QueryParser {
    constructor() {
        this.operators = {
            'AND': TokenType.AND,
            '&&': TokenType.AND,
            'OR': TokenType.OR,
            '||': TokenType.OR,
            'NOT': TokenType.NOT,
            '!': TokenType.NOT
        };
    }

    parse(query) {
        const tokens = this.tokenize(query);
        return this.buildAST(tokens);
    }

    tokenize(query) {
        const tokens = [];
        let current = '';
        let position = 0;
        let inQuotes = false;

        while (position < query.length) {
            const char = query[position];

            // Handle quotes
            if (char === '"') {
                if (inQuotes) {
                    if (current) {
                        tokens.push(new Token(TokenType.TERM, current, position - current.length, position));
                        current = '';
                    }
                    inQuotes = false;
                } else {
                    if (current) {
                        this.addToken(tokens, current, position);
                        current = '';
                    }
                    inQuotes = true;
                }
                position++;
                continue;
            }

            // Handle parentheses
            if (!inQuotes && (char === '(' || char === ')')) {
                if (current) {
                    this.addToken(tokens, current, position);
                    current = '';
                }
                tokens.push(new Token(
                    char === '(' ? TokenType.LPAREN : TokenType.RPAREN,
                    char,
                    position,
                    position + 1
                ));
                position++;
                continue;
            }

            // Handle spaces outside quotes
            if (!inQuotes && char === ' ') {
                if (current) {
                    this.addToken(tokens, current, position);
                    current = '';
                }
                position++;
                continue;
            }

            current += char;
            position++;
        }

        // Handle any remaining token
        if (current) {
            this.addToken(tokens, current, position);
        }

        return tokens;
    }

    addToken(tokens, value, position) {
        const upperValue = value.toUpperCase();

        // 检查是否为操作符
        if (this.operators[upperValue]) {
            tokens.push(new Token(this.operators[upperValue], value, position - value.length, position));
            return;
        }

        // 检查字段搜索（包含':'）
        if (value.includes(':')) {
            const [field, ...termParts] = value.split(':');
            const term = termParts.join(':'); // 重新组合可能包含':'的term部分

            // 处理数值比较
            if (term.match(/^[<>]=?\d+/)) {
                tokens.push(new Token(TokenType.FIELD, {
                    field: field.trim(),
                    term: term.trim(),
                    isNumeric: true
                }, position - value.length, position));
                return;
            }

            // 处理范围查询
            if (term.includes('..')) {
                const [min, max] = term.split('..');
                tokens.push(new Token(TokenType.RANGE, {
                    field: field.trim(),
                    min: min.trim(),
                    max: max.trim()
                }, position - value.length, position));
                return;
            }

            tokens.push(new Token(TokenType.FIELD, {
                field: field.trim(),
                term: term.trim()
            }, position - value.length, position));
            return;
        }

        // 检查模糊搜索（包含'~'）
        if (value.includes('~')) {
            const [term, distance] = value.split('~');
            tokens.push(new Token(TokenType.FUZZY, {
                term: term.trim(),
                distance: parseInt(distance) || 1
            }, position - value.length, position));
            return;
        }

        // 检查通配符搜索
        if (value.includes('*')) {
            tokens.push(new Token(TokenType.WILDCARD, value.trim(), position - value.length, position));
            return;
        }

        // 默认为词项
        tokens.push(new Token(TokenType.TERM, value.trim(), position - value.length, position));
    }

    buildAST(tokens) {
        if (!tokens.length) return null;

        let position = 0;

        const parseExpression = () => {
            let left = parsePrimary();

            while (position < tokens.length) {
                const token = tokens[position];

                // 只处理AND/OR操作符
                if (token.type !== TokenType.AND && token.type !== TokenType.OR) {
                    break;
                }

                position++;
                const right = parsePrimary();

                // 构建新的AST节点
                left = {
                    type: token.type,
                    left,
                    right,
                    start: left.start,
                    end: right.end
                };
            }

            return left;
        };

        const parsePrimary = () => {
            if (position >= tokens.length) {
                throw new Error('Unexpected end of input');
            }

            const token = tokens[position];

            // 处理NOT操作符
            if (token.type === TokenType.NOT) {
                position++;
                const expression = parsePrimary();
                return {
                    type: TokenType.NOT,
                    expression,
                    start: token.start,
                    end: expression.end
                };
            }

            // 处理括号表达式
            if (token.type === TokenType.LPAREN) {
                position++;
                const expression = parseExpression();

                if (position >= tokens.length || tokens[position].type !== TokenType.RPAREN) {
                    throw new Error('Missing closing parenthesis');
                }

                const rparen = tokens[position];
                position++;

                return {
                    ...expression,
                    start: token.start,
                    end: rparen.end
                };
            }

            // 处理其他类型的token
            position++;
            return {
                type: token.type,
                value: token.value,
                start: token.start,
                end: token.end
            };
        };

        try {
            return parseExpression();
        } catch (error) {
            console.error('解析错误:', error.message);
            return null;
        }
    }
}