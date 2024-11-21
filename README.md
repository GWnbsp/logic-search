# LogicSearch

一个功能强大的 JavaScript 搜索引擎，支持复杂的布尔逻辑查询、字段搜索、数值比较、通配符和模糊匹配。适用于各种类型的数据集。

## 特性

- 🔍 支持复杂的布尔逻辑查询（AND、OR、NOT）
- 📊 字段特定搜索（field:value）
- 📈 数值比较（>、>=、<、<=、=）
- 🌟 通配符匹配（\*）
- 🎯 模糊搜索（~N）
- ⚖️ 可配置的字段权重
- 🎨 灵活的评分系统
- 📦 支持嵌套字段搜索
- 🔄 支持数组字段搜索

## 安装

```bash
npm install logic-search
```

## 快速开始

### 基础示例

```javascript
import { LogicSearch } from "logic-search";

// 准备数据
const data = [
  {
    id: 1,
    title: "示例文档",
    content: "这是一个示例文档",
    tags: ["示例", "文档"],
    metadata: {
      author: "张三",
      date: "2024-01-01",
    },
  },
];

// 创建搜索引擎实例
const searchEngine = new LogicSearch(data, {
  weights: {
    title: 2.0, // 标题字段权重加倍
    content: 1.0, // 内容字段标准权重
    tags: 1.2, // 标签字段权重稍高
    "metadata.*": 0.8, // 元数据字段权重较低
  },
});

// 执行搜索
const results = searchEngine.search("title:示例 AND tags:文档");
console.log(results);
```

### 不同数据类型示例

#### 电子产品数据

```javascript
const electronics = [
  {
    id: 1,
    name: "智能手机",
    category: "手机",
    price: 6999,
    specs: {
      screen: "6.8英寸",
      battery: "5000mAh",
    },
  },
];

const electronicsSearch = new LogicSearch(electronics, {
  weights: {
    name: 2.0,
    category: 1.0,
    "specs.*": 0.8, // 支持嵌套字段
  },
});

// 搜索示例
electronicsSearch.search("category:手机 AND price:>5000");
electronicsSearch.search("specs.screen:*英寸");
```

#### 图书数据

```javascript
const books = [
  {
    id: "book1",
    title: "示例图书",
    author: "作者名",
    tags: ["编程", "教程"],
    rating: 4.5,
  },
];

const booksSearch = new LogicSearch(books, {
  weights: {
    title: 2.0,
    author: 1.5,
    tags: 1.2,
  },
});

// 搜索示例
booksSearch.search("tags:编程 AND rating:>4.0");
```

## 高级用法

### 嵌套字段搜索

支持使用点号访问嵌套字段：

```javascript
// 搜索嵌套字段
searchEngine.search("metadata.author:张三");
searchEngine.search("specs.screen:*英寸");
```

### 数组字段搜索

可以搜索数组中的任意元素：

```javascript
// 搜索数组字段
searchEngine.search("tags:编程"); // 匹配 tags 数组中包含 "编程" 的文档
```

### 字段权重配置

可以为不同类型的字段配置不同的权重：

```javascript
const searchEngine = new LogicSearch(data, {
  weights: {
    // 基础字段
    title: 2.0,
    content: 1.0,

    // 数组字段
    tags: 1.2,

    // 嵌套字段
    "metadata.*": 0.8,
    "specs.*": 0.8,
  },
});
```

## 查询语法

### 字段搜索

- 基本字段：`field:value`
- 嵌套字段：`parent.child:value`
- 数值比较：`price:>5000`, `rating:>=4.5`
- 否定：`!category:游戏`

### 布尔操作符

- `AND`（或 `&&`）：与操作
- `OR`（或 `||`）：或操作
- `NOT`（或 `!`）：非操作

### 高级查询示例

```javascript
// 复杂条件组合
searchEngine.search(
  "(category:图书 OR category:电子书) AND rating:>4.0 AND !tags:过期"
);

// 嵌套字段查询
searchEngine.search("metadata.author:张三 AND metadata.date:>2023");

// 数组字段查询
searchEngine.search("tags:编程 AND tags:JavaScript");
```

## API 参考

### LogicSearch 类

#### 构造函数

```javascript
new LogicSearch((data = []), (options = {}));
```

#### 选项配置

```javascript
const options = {
  caseSensitive: false, // 是否区分大小写
  fuzzyThreshold: 0.8, // 模糊匹配阈值
  weights: {
    // 字段权重配置
    field1: 2.0,
    field2: 1.0,
    "nested.*": 0.8,
  },
};
```

## 许可证

MIT
