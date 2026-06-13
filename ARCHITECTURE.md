# 德语学习小程序 · 生产架构契约（Single Source of Truth）

> 所有智能体必须严格遵循本文件定义的目录、接口、数据形状与命名。不得擅自改动他人负责的文件。

## 1. 总体架构

微信原生小程序，企业级分层：

```
deutsch-lernen/
├── app.js / app.json / app.wxss        # 基座（含分包声明、mobx 绑定、设计令牌）
├── project.config.json / sitemap.json
├── package.json                         # mobx-miniprogram 依赖（需在开发者工具「构建 npm」）
├── constants/                           # 常量与元数据
│   ├── levels.js                        # 级别元数据 LEVEL_META
│   └── theme.js                         # 颜色令牌（JS 侧引用）
├── stores/
│   └── learning-store.js                # mobx-miniprogram store（跨页状态）
├── services/
│   └── phrase-service.js                # 数据访问层：异步加载分包数据、检索、筛选
├── utils/
│   ├── numbers.js                       # 数字数据（小，主包内联）：nums0 / numsBig / quizPool
│   └── shuffle.js                       # 通用工具：shuffle / pickWrong
├── components/                          # 可复用自定义组件
│   ├── sec-title/                       # 区块标题
│   ├── tip-card/                        # 提示卡
│   ├── phrase-card/                     # 词句翻转卡（点击显示谐音）
│   └── quiz-box/                        # 通用测验框（数据驱动，纯展示+事件）
├── pages/                               # 主包页面（tabBar，体积小）
│   ├── index/  pronunciation/  numbers/  grammar/  phrases/  quiz/
└── packageData/                         # 【分包】只放重数据，按需异步加载
    └── data/
        ├── level-0.js  level-a1.js  level-a2.js  level-b1.js  level-b2.js
        └── index.js                     # 聚合导出 getCategories()
```

### 关键决策
- **tabBar 页面必须在主包**：6 个页面均在主包，但保持轻量（仅排版与逻辑）。
- **重数据（~3000 词句）放分包 `packageData`**，通过**分包异步化** `require(path, cb)` 按需加载，主包体积可控。
- **跨页状态用 mobx-miniprogram store**，替代 globalData。
- **数据访问统一走 `services/phrase-service.js`**，页面不直接 require 分包。

## 2. 数据形状（契约，不可更改字段名）

```js
// 级别: '0' | 'a1' | 'a2' | 'b1' | 'b2'
category = { name: string, level: string, icon: string, phrases: Phrase[] }
phrase   = { de: string, zh: string, py: string }   // py=汉语谐音
num      = { n: number|string, de: string, py: string }
```

## 3. 接口契约

### services/phrase-service.js（主包，负责异步拉取分包数据）
```js
// 异步加载全部分类（分包异步化）。返回 Promise<Category[]>
function loadCategories(): Promise<Category[]>
// 按级别取分类（'all' 返回全部）
function getCategoriesByLevel(level): Promise<Category[]>
// 全文检索（de/zh/py 任一命中），跨全部级别
function search(keyword): Promise<Array<Phrase & {cat, icon}>>
// 拍平所有词句（测验用）
function getAllPhrases(): Promise<Array<Phrase & {id}>>
module.exports = { loadCategories, getCategoriesByLevel, search, getAllPhrases }
```
> 内部用 `require('../packageData/data/index.js', mod => ...)` 异步化；首次加载后缓存到模块级变量。

### packageData/data/index.js（分包）
```js
// 聚合 5 个级别文件，导出有序 categories 数组
module.exports = { getCategories }   // getCategories(): Category[]
```
各 `level-*.js`：`module.exports = [ {name, level, icon, phrases:[...]}, ... ]`

### stores/learning-store.js（mobx-miniprogram）
```js
state: { activeLevel:'all', activeCat:'all', keyword:'', favorites:{} }
actions: setLevel(l), setCat(c), setKeyword(k), toggleFavorite(id)
getters: 仅状态，数据检索由 service 完成
```

### constants/levels.js
```js
LEVEL_META = {
  all:{label,desc,color}, '0':{...}, a1:{...}, a2:{...}, b1:{...}, b2:{...}
}
LEVEL_ORDER = ['0','a1','a2','b1','b2']
LB_CLASS = {'0':'lb-0', a1:'lb-a1', ...}   // 徽章 class
module.exports = { LEVEL_META, LEVEL_ORDER, LB_CLASS }
```

## 4. 组件 API 契约（pages 依赖，必须精确实现）

### components/sec-title
properties: `icon:String, text:String, count:String(可选)`
渲染：`<icon> <text> ……(右) count`

### components/tip-card
properties: `title:String, accent:String(默认#c8a84b)`
slot：默认插槽放正文（支持富文本由父级传 nodes 或直接文本）。同时支持 `body:String`（含 `\n` 换行）作为简单用法。

### components/phrase-card
properties: `de:String, zh:String, py:String, flipped:Boolean`
行为：点击 `bindtap` 切换内部 `_flipped`，并 `triggerEvent('flip')`；展开时显示谐音条。

### components/quiz-box
properties:
```
score:Number, total:Number, question:String, hint:String,
opts:Array<{label,state}>   // state: '' | 'correct' | 'wrong'
showProgress:Boolean        // true 显示百分比进度条
```
事件：`bindselect`（detail:{index}）、`bindrestart`、`bindexit`
纯展示组件，所有判分逻辑在页面。

## 5. 设计令牌（app.wxss 与 constants/theme.js 保持一致）
```
gold #c8a84b | bg #08080f | bg2 #0d1120 | text #f0e8d0 | text-dim #a09070
red #e05050 | green #50c878 | blue #5088d0
级别色: 0=#50c878 a1=#5088d0 a2=#c8a84b b1=#e08050 b2=#e05050
```

## 6. 文件归属（避免冲突）
- **数据工程师**：`packageData/**`、`utils/numbers.js`、`utils/shuffle.js`、`services/phrase-service.js`
- **组件工程师**：`components/**`
- **基座工程师**：`app.js`、`app.json`、`package.json`、`stores/**`、`constants/**`
- **集成负责人（架构师本人）**：`pages/**`、最终联调
> 原 `utils/data.js` 由数据工程师拆分后删除。
