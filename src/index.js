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

// 测试代码
if (import.meta.url === new URL(import.meta.url).href) {
    // 示例数据集
    const products = [
        {
            id: 1,
            name: "小米13 Pro",
            description: "徕卡专业光学镜头，第二代骁龙8处理器",
            category: "手机",
            brand: "小米",
            price: 4999,
            tags: ["5G", "徕卡相机", "快充", "无线充电"],
            specs: {
                screen: "6.73英寸 2K OLED屏幕",
                battery: "4820mAh",
                camera: "5000万像素徕卡专业光学镜头"
            }
        },
        {
            id: 2,
            name: "华为 Mate 60 Pro",
            description: "麒麟9000S芯片，超长续航",
            category: "手机",
            brand: "华为",
            price: 6999,
            tags: ["5G", "卫星通信", "快充", "无线充电"],
            specs: {
                screen: "6.82英寸 OLED曲面屏",
                battery: "5000mAh",
                camera: "5000万像素主摄"
            }
        },
        {
            id: 3,
            name: "索尼 WH-1000XM5",
            description: "新一代降噪耳机，30小时续航",
            category: "耳机",
            brand: "索尼",
            price: 2999,
            tags: ["降噪", "蓝牙", "无线"],
            specs: {
                battery: "30小时续航",
                bluetooth: "蓝牙5.2",
                features: "自适应降噪"
            }
        },
        {
            id: 4,
            name: "华硕 ROG 游戏本",
            description: "RTX4090独显，i9处理器",
            category: "笔记本",
            brand: "华硕",
            price: 25999,
            tags: ["游戏本", "高性能", "独显"],
            specs: {
                cpu: "i9-13900H",
                gpu: "RTX4090",
                memory: "32GB",
                storage: "2TB SSD"
            }
        },
        {
            id: 5,
            name: "大疆 Mini 4 Pro",
            description: "超轻量级航拍无人机",
            category: "无人机",
            brand: "大疆",
            price: 4499,
            tags: ["航拍", "便携", "4K"],
            specs: {
                weight: "249g",
                camera: "4K/60fps",
                flightTime: "34分钟"
            }
        },
        {
            id: 6,
            name: "苹果 AirPods Pro",
            description: "无线耳机，降噪模式",
            category: "耳机",
            brand: "苹果",
            price: 2499,
            tags: ["降噪", "无线", "蓝牙"],
            specs: {
                battery: "30小时续航",
                bluetooth: "蓝牙5.2",
                features: "自适应降噪"
            }
        },
        {
            id: 7,
            name: "华为 Mate 40 Pro",
            description: "麒麟9000S芯片，超长续航",
            category: "手机",
            brand: "华为",
            price: 5999,
            tags: ["5G", "卫星通信", "快充", "无线充电"],
            specs: {
                screen: "6.82英寸 OLED曲面屏",
                battery: "5000mAh",
                camera: "5000万像素主摄"
            }
        },
        {
            id: 8,
            name: "索尼 WH-1000XM5",
            description: "新一代降噪耳机，30小时续航",
            category: "耳机",
            brand: "索尼",
            price: 2999,
            tags: ["降噪", "蓝牙", "无线"],
            specs: {
                battery: "30小时续航",
                bluetooth: "蓝牙5.2",
                features: "自适应降噪"
            }
        }
    ];

    // 创建搜索引擎实例
    const searchEngine = new LogicSearch(products, {
        caseSensitive: false,
        fuzzyThreshold: 0.8,
        fields: ['name', 'description', 'category', 'brand', 'tags', 'specs'],
        weights: {
            name: 2.0,
            description: 1.5,
            tags: 1.2,
            category: 1.0,
            brand: 1.0,
            specs: 1.0,
            price: 1.0
        }
    });

    // 测试复杂查询
    const queries = [
        // 基础布尔操作
        '手机 AND (小米 OR 华为)',
        '游戏本 AND !华为',
        '(小米 OR 华为) AND 快充',

        // 精确短语匹配
        '"徕卡专业光学镜头"',
        '"RTX4090独显"',

        // 模糊搜索
        '游戏~1',
        '快充~2',

        // 通配符搜索
        '华*',
        '*Pro',

        // 价格范围搜索
        'price:>5000',
        'price:<3000',

        // 字段特定搜索
        'brand:华为 AND category:手机',
        'tags:快充 AND !brand:小米',

        // 规格搜索
        'specs.camera:*5000万*',
        'specs.memory:32GB',

        // 复杂组合查询
        '(brand:小米 OR brand:华为) AND (tags:5G OR tags:快充)',
        'category:手机 AND !(brand:小米 OR brand:华为)',
        '(price:>4000 AND price:<7000) AND tags:5G',

        // 多字段组合
        'specs.cpu:i9* AND (price:>20000 OR category:游戏本)',
        '(tags:降噪 AND category:耳机) OR (tags:航拍 AND price:<5000)',

        // 嵌套布尔表达式
        '(brand:华为 AND 5G) OR (brand:小米 AND 徕卡)',
        '((category:手机 OR category:笔记本) AND price:>5000) AND !brand:苹果'
    ];

    // 运行测试
    console.log('运行复杂搜索测试:\n');
    queries.forEach((query, index) => {
        console.log(`\n测试 ${index + 1}: "${query}"`);
        const results = searchEngine.search(query);
        console.log('结果:', results.map(item => ({
            name: item.name,
            price: item.price,
            category: item.category
        })));
        console.log('-'.repeat(50));
    });
}