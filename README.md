# LogicSearch 高级搜索引擎

一个强大而灵活的 JavaScript 搜索引擎，支持复杂的逻辑查询操作。

## ✨ 特性

- 🔍 支持复杂的布尔逻辑操作（AND、OR、NOT）
- 字段特定搜索（field:value）
- 🔢 数值比较（>、<、>=、<=、=）
- � 通配符匹配（\*）
- 📝 模糊搜索（~N）
- 🎯 可配置的字段权重
- 🌐 多语言支持
- ⚡ 高性能内存搜索

## 🚀 快速开始

### 安装

```bash
npm install logic-search
# 或
yarn add logic-search
```

### 基本使用

```javascript
import { LogicSearch } from "logic-search";

// 创建搜索引擎实例
const searchEngine = new LogicSearch(data, {
  caseSensitive: false,
  fuzzyThreshold: 0.8,
  weights: {
    name: 2.0,
    description: 1.5,
    category: 1.0,
  },
});

// 执行搜索
const results = searchEngine.search(
  "(category:手机 OR category:笔记本) AND price:>5000"
);
```

## � 查询语法

### 基础搜索

- 单个词：`手机`
- 精确短语：`"无线充电"`

### 字段搜索

- 特定字段：`category:手机`
- 数值比较：`price:>5000`
- 嵌套字段：`specs.camera:5000万`

### 布尔操作

- AND：`手机 AND 5G`
- OR：`小米 OR 华为`
- NOT：`!苹果` 或 `NOT 苹果`

### 高级功能

- 通配符：`华为*` 或 `*Pro`
- 模糊搜索：`游戏~1`
- 组合查询：`((category:手机 OR category:笔记本) AND price:>5000) AND !brand:苹果`

## ⚙️ 配置选项

```javascript
{
    // 是否区分大小写
    caseSensitive: false,

    // 模糊搜索阈值 (0-1)
    fuzzyThreshold: 0.8,

    // 搜索字段
    fields: ['name', 'description', 'category', 'brand', 'tags', 'specs'],

    // 字段权重
    weights: {
        name: 2.0,
        description: 1.5,
        tags: 1.2,
        category: 1.0,
        brand: 1.0,
        specs: 1.0,
        price: 1.0
    }
}
```

## 🧪 示例

```javascript
// 基础搜索
searchEngine.search("手机");

// 字段搜索
searchEngine.search("category:手机 AND price:>5000");

// 复杂查询
searchEngine.search("(brand:小米 OR brand:华为) AND (tags:5G OR tags:快充)");

// 通配符搜索
searchEngine.search("华为*");

// 模糊搜索
searchEngine.search("游戏~1");
```

## � 依赖

- Node.js >= 14.0.0
- ES Modules
- leven (编辑距离计算)
- fuse.js (高级模糊搜索，可选)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## � 许可

MIT License
