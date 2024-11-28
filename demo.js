import { LogicSearch } from './src/index.js';

// 电子产品数据集
const electronics = [
    {
        id: 1,
        name: "iPhone 14 Pro Max",
        category: "手机",
        brand: "苹果",
        price: 9999,
        status: "热销",
        specs: {
            screen: "6.7英寸",
            battery: "4323mAh",
            storage: "256GB",
            cpu: "A16",
            camera: {
                main: "48MP",
                ultra: "12MP",
                front: "12MP"
            },
            colors: ["深空黑", "银色", "金色", "暗紫色"]
        },
        features: ["5G", "卫星通信", "灵动岛"],
        tags: ["5G", "iOS", "高端", "旗舰"],
        reviews: [
            { user: "用户1", rating: 5, comment: "相机很好用" },
            { user: "用户2", rating: 4.5, comment: "电池续航不错" }
        ],
        stock: 100,
        releaseDate: "2022-09"
    },
    {
        id: 2,
        name: "MacBook Pro M2 Max",
        category: "笔记本",
        brand: "苹果",
        price: 19999,
        status: "预售",
        specs: {
            screen: "16英寸",
            battery: "100Wh",
            storage: "1TB",
            cpu: "M2 Max",
            memory: "32GB",
            gpu: "38核心",
            ports: ["Thunderbolt", "HDMI", "SD卡槽"]
        },
        features: ["超长续航", "专业显示", "静音设计"],
        tags: ["macOS", "专业级", "高性能", "创作者优选"],
        reviews: [
            { user: "用户3", rating: 5, comment: "性能强大" },
            { user: "用户4", rating: 4.8, comment: "显示效果出色" }
        ],
        stock: 50,
        releaseDate: "2023-01"
    },
    {
        id: 3,
        name: "小米 13 Pro",
        category: "手机",
        brand: "小米",
        price: 5999,
        status: "在售",
        specs: {
            screen: "6.73英寸",
            battery: "4820mAh",
            storage: "512GB",
            cpu: "骁龙8 Gen 2",
            camera: {
                main: "50MP",
                ultra: "50MP",
                tele: "50MP"
            },
            colors: ["陶瓷黑", "陶瓷白"]
        },
        features: ["徕卡相机", "120W快充", "IP68防水"],
        tags: ["5G", "Android", "性价比", "旗舰"],
        reviews: [
            { user: "用户5", rating: 4.7, comment: "相机系统很强" },
            { user: "用户6", rating: 4.6, comment: "充电很快" }
        ],
        stock: 200,
        releaseDate: "2022-12"
    },
    {
        id: 4,
        name: "华为 MateBook X Pro",
        category: "笔记本",
        brand: "华为",
        price: 12999,
        status: "热销",
        specs: {
            screen: "14.2英寸",
            battery: "60Wh",
            storage: "1TB",
            cpu: "i7-1260P",
            memory: "16GB",
            resolution: "3.1K",
            ports: ["Thunderbolt", "USB-C"]
        },
        features: ["3.1K高清屏", "触控屏", "超级终端"],
        tags: ["Windows", "轻薄", "高性能", "商务办公"],
        reviews: [
            { user: "用户7", rating: 4.8, comment: "屏幕素质很好" },
            { user: "用户8", rating: 4.7, comment: "续航给力" }
        ],
        stock: 150,
        releaseDate: "2022-07"
    },
    {
        id: 5,
        name: "ROG 魔霸新锐",
        category: "笔记本",
        brand: "华硕",
        price: 15999,
        status: "在售",
        specs: {
            screen: "16英寸",
            battery: "90Wh",
            storage: "2TB",
            cpu: "i9-13900H",
            gpu: "RTX 4080",
            memory: "32GB",
            resolution: "2.5K"
        },
        features: ["MUX独显直连", "液金散热", "机械键盘"],
        tags: ["Windows", "游戏本", "高性能", "发烧级"],
        reviews: [
            { user: "用户9", rating: 4.9, comment: "游戏性能强悍" },
            { user: "用户10", rating: 4.6, comment: "散热出色" }
        ],
        stock: 80,
        releaseDate: "2023-03"
    }
];

// 图书数据集
const books = [
    {
        id: "book1",
        title: "JavaScript高级程序设计",
        author: "Nicholas C. Zakas",
        categories: ["编程", "Web开发"],
        price: 99.0,
        rating: 4.8,
        metadata: {
            publisher: "人民邮电出版社",
            publishDate: "2021-03",
            edition: "第4版"
        },
        tags: ["JavaScript", "前端开发", "畅销书"]
    },
    {
        id: "book2",
        title: "Python数据分析",
        author: "Wes McKinney",
        categories: ["编程", "数据分析"],
        price: 89.0,
        rating: 4.6,
        metadata: {
            publisher: "机械工业出版社",
            publishDate: "2022-01",
            edition: "第3版"
        },
        tags: ["Python", "数据科学", "pandas"]
    }
];

// 餐厅数据集
const restaurants = [
    {
        id: "rest1",
        name: "北京烤鸭店",
        cuisine: "中餐",
        location: {
            city: "北京",
            district: "朝阳区",
            address: "三里屯路123号"
        },
        rating: 4.7,
        priceRange: "￥￥￥",
        features: ["特色菜", "商务宴请", "家庭聚会"],
        dishes: [
            { name: "烤鸭", price: 288, rating: 4.9 },
            { name: "烤鸭套餐", price: 388, rating: 4.8 }
        ]
    },
    {
        id: "rest2",
        name: "寿司之家",
        cuisine: "日料",
        location: {
            city: "上海",
            district: "静安区",
            address: "南京西路456号"
        },
        rating: 4.5,
        priceRange: "￥￥￥￥",
        features: ["无烟区", "深夜营业", "包厢"],
        dishes: [
            { name: "特上寿司拼盘", price: 398, rating: 4.7 },
            { name: "刺身套餐", price: 298, rating: 4.6 }
        ]
    }
];

// 初始化搜索引擎
const electronicsSearch = new LogicSearch(electronics, {
    caseSensitive: false, // 设置为不区分大小写
    fuzzyThreshold: 0.8, // 设置模糊匹配阈值
    weights: { // 设置权重
        name: 2.0,  // 产品名称权重
        category: 1.5, // 产品类别权重
        brand: 1.5, // 品牌权重
        tags: 1.2 // 标签权重
    }
});

const booksSearch = new LogicSearch(books, {
    caseSensitive: false,
    fuzzyThreshold: 0.8,
    weights: {
        title: 2.0,
        author: 1.5,
        categories: 1.2,
        tags: 1.2
    }
});

const restaurantsSearch = new LogicSearch(restaurants, {
    caseSensitive: false,
    fuzzyThreshold: 0.8,
    weights: {
        name: 2.0,
        cuisine: 1.5,
        'location.city': 1.5,
        dishes: 1.2,
        features: 1.2
    }
});

// === 电子产品搜索演示 ===
console.log('\n=== 电子产品搜索演示 ===\n');

// 1. 复杂品牌和价格条件搜索
console.log('1. 查找苹果或华为品牌且价格在1万以上的产品：');
console.log(electronicsSearch.search('(brand:苹果 OR brand:华为) AND price:>=10000'));

// 2. 多重规格条件搜索
console.log('\n2. 查找屏幕尺寸大于6.5英寸且存储容量至少512GB的手机：');
console.log(electronicsSearch.search('category:手机 AND specs.screen:>6.5 AND specs.storage:>=512GB'));

// 3. 嵌套属性和标签组合搜索
console.log('\n3. 查找具有高性能标签且内存至少32GB的笔记本：');
console.log(electronicsSearch.search('category:笔记本 AND tags:高性能 AND specs.memory:32GB'));

// 4. 发布日期和状态搜索
console.log('\n4. 查找2023年发布的产品：');
console.log(electronicsSearch.search('releaseDate:2023*'));

// 5. 评分和评论关键词搜索
console.log('\n5. 查找评分大于4.7且评论中提到"屏幕"的产品：');
console.log(electronicsSearch.search('reviews.rating:>4.7 AND reviews.comment:*屏幕*'));

// 6. 复杂特性和库存组合搜索
console.log('\n6. 查找具有防水或快充特性，且库存大于100的产品：');
console.log(electronicsSearch.search('(features:IP68防水 OR features:120W快充) AND stock:>100'));

// 7. 相机规格和品牌组合搜索
console.log('\n7. 查找主摄像头大于等于48MP的手机：');
console.log(electronicsSearch.search('category:手机 AND specs.camera.main:>=48MP'));

// 8. 高级多条件组合搜索
console.log('\n8. 查找满足以下条件的产品：\n- 笔记本电脑\n- 价格在1.5万以上\n- 内存32GB\n- 支持雷电接口\n- 评分4.7以上');
console.log(electronicsSearch.search('category:笔记本 AND price:>=15000 AND specs.memory:32GB AND specs.ports:Thunderbolt AND reviews.rating:>=4.7'));

// === 图书搜索演示 ===
console.log('\n=== 图书搜索演示 ===');

// 1. 主题搜索
console.log('\n1. 查找JavaScript相关的书籍：');
console.log(booksSearch.search('title:JavaScript OR tags:JavaScript'));

// 2. 评分搜索
console.log('\n2. 查找评分4.7以上的书籍：');
console.log(booksSearch.search('rating:>4.7'));

// 3. 出版日期搜索
console.log('\n3. 查找2022年出版的书籍：');
console.log(booksSearch.search('metadata.publishDate:2022'));

// === 餐厅搜索演示 ===
console.log('\n=== 餐厅搜索演示 ===');

// 1. 地理位置搜索
console.log('\n1. 查找北京的餐厅：');
console.log(restaurantsSearch.search('location.city:北京'));

// 2. 特色搜索
console.log('\n2. 查找有包厢的日料餐厅：');
console.log(restaurantsSearch.search('cuisine:日料 AND features:包厢'));

// 3. 菜品搜索
console.log('\n3. 查找有烤鸭的餐厅：');
console.log(restaurantsSearch.search('dishes.name:烤鸭'));

// 4. 价格和评分组合搜索
console.log('\n4. 查找评分4.5以上的高档餐厅：');
console.log(restaurantsSearch.search('rating:>=4.5 AND priceRange:￥￥￥￥'));