# 指标体系与埋点 Schema

> 版本：v1.0 | 2026-06-07
> 适用阶段：本地持久化阶段（wx.setStorageSync），为将来上报预留接口。

---

## 一、北极星指标

**北极星指标：每周有效学习词句数（Weekly Active Learning Phrases, WALP）**

定义：用户在一周内通过测验答对（QUIZ_ANSWER correct=true）或主动收藏（FAVORITE_TOGGLE on=true）的独立词句数量。
计算：`WALP = COUNT(DISTINCT favId WHERE event IN [quiz_answer_correct, favorite_toggle_on] AND ts IN [本周])`

选择理由：同时覆盖「主动学习（答题）」与「被动收藏（标记）」两种学习行为，综合反映用户的实际学习深度，而非单纯的浏览量。

---

## 二、一级指标

| 指标名 | 英文缩写 | 定义 | 计算口径 |
|--------|---------|------|---------|
| 日活跃用户 | DAU | 当日有任意事件记录的用户数 | COUNT(DISTINCT uid WHERE date = 今日) |
| 次日留存率 | D1 Retention | 首次使用次日再次打开的用户比例 | D1留存用户数 / 首日新用户数 |
| 7日留存率 | D7 Retention | 首次使用后第7日再次打开的比例 | 同上，窗口扩展至7天 |
| 学习时长 | Session Duration | 单次会话从首次事件到最后事件的时间跨度 | MAX(ts) - MIN(ts) per session |
| 测验正确率 | Quiz Accuracy | 累计答题中答对比例 | quizCorrect / quizTotal |
| 词句掌握率 | Phrase Mastery Rate | 连续答对 ≥2 次的词句占全库比例 | 需服务端记录；本地暂无 |
| 收藏率 | Favorite Rate | 浏览词句中触发收藏的比例 | favOn / totalPhraseViews |

---

## 三、事件埋点表

### 3.1 事件列表

| 事件名（EVENTS 常量） | 事件值（字符串） | 触发时机 | 负责文件 |
|----------------------|----------------|---------|---------|
| PAGE_VIEW | `page_view` | 收藏页 onShow | pages/favorites/favorites.js |
| QUIZ_ANSWER | `quiz_answer` | 测验页用户选择答案后 | pages/quiz/quiz.js |
| FAVORITE_TOGGLE | `favorite_toggle` | 词句卡片收藏按钮点击后 | components/phrase-card/phrase-card.js |
| SEARCH | `search` | 词句页搜索框输入非空关键词后 | pages/phrases/phrases.js |
| LEVEL_SWITCH | `level_switch` | 词句页级别 Tab 切换后 | pages/phrases/phrases.js |

### 3.2 各事件属性 Schema

#### PAGE_VIEW

```json
{
  "event": "page_view",
  "ts": 1717776000000,
  "date": "2026-06-07",
  "props": {
    "page": "favorites"
  }
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| page | string | 页面标识，当前固定为 "favorites" |

#### QUIZ_ANSWER

```json
{
  "event": "quiz_answer",
  "ts": 1717776000000,
  "date": "2026-06-07",
  "props": {
    "mode": "phrase",
    "correct": true
  }
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| mode | string | 测验模式："phrase"（看中文选德语）或 "reverse"（反向） |
| correct | boolean | 本题是否答对 |

#### FAVORITE_TOGGLE

```json
{
  "event": "favorite_toggle",
  "ts": 1717776000000,
  "date": "2026-06-07",
  "props": {
    "favId": "Guten Morgen!|早上好！",
    "on": true
  }
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| favId | string | 词句唯一标识（`de|zh` 拼接） |
| on | boolean | true=收藏，false=取消收藏 |

#### SEARCH

```json
{
  "event": "search",
  "ts": 1717776000000,
  "date": "2026-06-07",
  "props": {
    "keyword": "essen"
  }
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| keyword | string | 用户输入的搜索关键词（已 trim） |

#### LEVEL_SWITCH

```json
{
  "event": "level_switch",
  "ts": 1717776000000,
  "date": "2026-06-07",
  "props": {
    "level": "a2"
  }
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| level | string | 切换到的目标级别："all" / "0" / "a1" / "a2" / "b1" / "b2" |

---

## 四、数据流与上报方案

### 4.1 当前阶段（本地持久化）

```
用户行为
  ↓
analytics.track(event, props)     ← 埋点调用（try/catch 容错）
  ↓
wx.setStorageSync('analytics_events', [...])
  ↓
analytics.getReport()             ← 本地汇总，可在「学习统计」页展示
```

- 存储上限：最近 1000 条事件（环形缓冲，超出自动丢弃最旧）
- 覆盖：单设备单用户，无跨设备聚合

### 4.2 未来阶段 A：自建后端上报

```
analytics.flush()
  ↓
_doReport(events)                 ← 实现 wx.request 上传 events 数组
  ↓
POST https://your-api/track
  ↓
服务端 → 数据库（ClickHouse / MySQL）→ 数据看板（Metabase / Grafana）
```

迁移成本：仅需在 `services/analytics-service.js` 的 `_doReport()` 函数中补充 `wx.request` 逻辑，埋点调用方无需改动。

### 4.3 未来阶段 B：微信数据助手（零后端）

```
_doReport(events)
  ↓
events.forEach(e => wx.reportEvent(e.event, e.props))
  ↓
微信小程序后台「数据分析 → 自定义分析」
```

适合小团队、无后端资源时快速上线数据看板。

### 4.4 建议触发 flush 的时机

| 时机 | 说明 |
|------|------|
| App.onHide | 用户切换到后台时批量上报 |
| 事件数超过 200 条 | 在 track() 内检查，满足条件自动 flush |
| 用户主动「同步数据」 | 未来学习统计页的手动按钮 |

---

## 五、本地 getReport() 返回字段说明

```js
analytics.getReport()
// 返回：
{
  totalEvents:     number,   // 缓冲区内累计事件数
  quizTotal:       number,   // 测验总答题数
  quizCorrect:     number,   // 答对数
  quizAccuracy:    number,   // 正确率 0~1，-1 表示暂无数据
  favoriteCount:   number,   // 净收藏数（收藏次数 - 取消次数）
  lastActiveDate:  string,   // 最近活跃日 YYYY-MM-DD，null 表示无记录
  topSearchTerms:  [{term, count}],  // 热门搜索词 Top5
  topCategories:   [{cat, count}],   // 测验热门分类 Top5
}
```
