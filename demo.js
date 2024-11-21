import { LogicSearch } from './src/index.js';

// 使用示例数据
const products = [
    {
        id: 1,
        name: "华为 Mate 60 Pro",
        category: "手机",
        brand: "华为",
        price: 6999
    },
    {
        id: 2,
        name: "华硕 ROG 游戏本",
        category: "笔记本",
        brand: "华硕",
        price: 25999
    }
];

// 创建搜索引擎实例
const searchEngine = new LogicSearch(products, {
    caseSensitive: false,
    fuzzyThreshold: 0.8,
    weights: {
        name: 2.0,
        category: 1.0,
        brand: 1.0,
        price: 1.0
    }
});

console.log('\n测试完整查询:');
// 1. 先测试类别和价格条件
const query1 = "(category:手机 OR category:笔记本) AND price:>5000";
console.log('1. 类别和价格条件:', query1);
console.log('结果:', searchEngine.search(query1));

// 2. 再单独测试品牌条件
const query2 = "!brand:苹果";
console.log('2. 品牌条件:', query2);
console.log('结果:', searchEngine.search(query2));

// 3. 最后测试完整查询
const query3 = "((category:手机 OR category:笔记本) AND price:>5000) AND !brand:苹果";
console.log('3. 完整查询:', query3);
console.log('结果:', searchEngine.search(query3));