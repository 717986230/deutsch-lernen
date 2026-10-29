# 德语学习手册 · 微信小程序

由原单文件 `deutsch-lernen.html` 重构为**企业级分层架构**的微信原生小程序。

## 扩充词汇 & 离线包同步（重要）

**唯一数据源 = 网站仓库 [deutsch-lernen-site](https://github.com/717986230/deutsch-lernen-site) 的 `data/categories.json`。**
加词、改词都去网站仓库改，小程序这边只同步：

```bash
npm run sync:site        # 从网站 main 分支拉词库，重写 packageData/data/level-*.js
npm run build:offline    # 再生成离线包
```

`sync:site` 也可以指定本地文件：`npm run sync:site -- ../deutsch-lernen-site/data/categories.json`。
> ⚠️ `packageData/data/level-*.js`、`packageOffline/offline-html.js` 和桌面明亮版 HTML 都是生成的，不要手改。
> HTML 外壳（样式/发音/语法等版块）改 `tools/offline-template.html`。

## 架构总览

```
主包
├── app.js / app.json / app.wxss      基座：分包声明、设计令牌、数据预热
├── constants/   levels.js · theme.js  级别元数据与颜色令牌
├── stores/      learning-store.js     mobx 跨页状态（级别/分类/搜索/收藏）
├── services/    phrase-service.js     数据访问层：分包异步化加载 + 检索/筛选
├── utils/       numbers.js · shuffle.js
├── components/  sec-title · tip-card · phrase-card · quiz-box   可复用组件
└── pages/
    ├── tabBar 4 页：index（首页/hub）· phrases（词句）· quiz（测验）· favorites（收藏）
    └── 内容页 3（首页卡片 navigateTo 进入）：pronunciation · numbers · grammar

分包 packageData（按需异步加载 ~3000 词句）
└── data/  level-0 · a1 · a2 · b1 · b2 · index
```

> 注：微信 tabBar 最多 5 项，故核心 4 页用 tabBar，发音/数字/语法作为内容页从首页进入。

### 设计要点
- **分包异步化**：3482 条词句数据放入 `packageData` 分包，由 `phrase-service` 通过 `require(path, cb)` 按需加载，主包体积可控、首屏更快。
- **组件化**：卡片、测验框、标题、提示卡抽成自定义组件，页面只负责数据编排。
- **状态管理**：`mobx-miniprogram` 统一管理跨页状态，替代 globalData。
- **数据分层**：页面 → service → 分包数据，单向依赖。

## 运行步骤

1. 用**微信开发者工具**「导入项目」，选择本目录 `deutsch-lernen/`。
   - AppID 可选「测试号」（project.config.json 中为 `touristappid`）。
2. **构建 npm**：菜单「工具 → 构建 npm」（首次需先 `npm install`，因依赖 mobx-miniprogram）。
   ```bash
   npm install
   ```
   然后在开发者工具中点击「构建 npm」。
3. 编译预览即可。

## 数据完整性
- 分类数：86，词句数：3482（由 `build:offline` 校验输出）。
