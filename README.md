# LogicSearch

一个功能强大的 JavaScript 搜索引擎，支持复杂的布尔逻辑查询、字段搜索、数值比较、通配符和模糊匹配。

## 特性

- 🔍 支持复杂的布尔逻辑查询（AND、OR、NOT）
- 📊 字段特定搜索（field:value）
- 📈 数值比较（>、>=、<、<=、=）
- 🌟 通配符匹配（\*）
- 🎯 模糊搜索（~N）
- ⚖️ 可配置的字段权重
- 🎨 灵活的评分系统

## 安装

```bash
npm install logic-search
```

## 快速开始

```javascript
import { LogicSearch } from "logic-search";

// 准备数据
const products = [
  {
    id: 1,
    name: "华为 Mate 60 Pro",
    category: "手机",
    brand: "华为",
    price: 6999,
  },
  {
    id: 2,
    name: "华硕 ROG 游戏本",
    category: "笔记本",
    brand: "华硕",
    price: 25999,
  },
];

// 创建搜索引擎实例
const searchEngine = new LogicSearch(products, {
  caseSensitive: false,
  fuzzyThreshold: 0.8,
  weights: {
    name: 2.0,
    category: 1.0,
    brand: 1.0,
    price: 1.0,
  },
});

// 执行搜索
const results = searchEngine.search(
  "(category:手机 OR category:笔记本) AND price:>5000"
);
console.log(results);
```

## 查询语法

### 布尔操作符

- `AND`（或 `&&`）：与操作
- `OR`（或 `||`）：或操作
- `NOT`（或 `!`）：非操作

### 字段搜索

- 基本语法：`field:value`
- 数值比较：`price:>5000`, `price:<=1000`
- 否定：`!brand:苹果`

### 示例查询

```javascript
// 基础查询
searchEngine.search("category:手机");

// 价格范围
searchEngine.search("price:>5000");

// 复杂逻辑
searchEngine.search(
  "((category:手机 OR category:笔记本) AND price:>5000) AND !brand:苹果"
);
```

## 配置选项

```javascript
const options = {
  caseSensitive: false, // 是否区分大小写
  fuzzyThreshold: 0.8, // 模糊匹配阈值
  weights: {
    // 字段权重
    name: 2.0,
    category: 1.0,
    brand: 1.0,
    price: 1.0,
  },
};
```

## API 参考

### LogicSearch 类

#### 构造函数

```javascript
new LogicSearch((data = []), (options = {}));
```

#### 方法

- `search(query)`: 执行搜索查询
- `addDocument(doc)`: 添加文档到搜索引擎
- `removeDocument(id)`: 移除指定 ID 的文档
- `setOptions(options)`: 更新搜索引擎配置

## 高级用法

### 自定义评分

搜索结果会包含 `_score` 字段，表示匹配程度：

```javascript
const results = searchEngine.search("category:手机");
// 结果示例：
// {
//     id: 1,
//     name: "华为 Mate 60 Pro",
//     category: "手机",
//     _score: 1.0
// }
```

### 字段权重配置

可以通过配置不同字段的权重来调整搜索结果的排序：

```javascript
const searchEngine = new LogicSearch(data, {
  weights: {
    name: 2.0, // 名称字段权重加倍
    category: 1.0,
    brand: 1.0,
  },
});
```

## 许可证

MIT
