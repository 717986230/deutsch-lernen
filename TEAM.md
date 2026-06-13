# 公司级智能体团队配置（Enterprise Agent Org）

德语学习小程序项目采用**多智能体分工协作**模式。本文件是团队的单一配置事实来源：每个角色的职责、文件归属、驱动技能与激活状态。架构契约见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 组织架构

```
                    架构师 / 集成负责人（Orchestrator）
                              │  定契约·派活·集成·联调
   ┌──────────┬──────────┬────┴─────┬──────────┬──────────┐
 产品策划    UI设计师   前端工程师  数据工程师  数据分析师   质量/安全
 (Product)  (UI/UX)   (Frontend)  (DataEng)  (DataAnalyst) (QA/Sec)
```

## 角色花名册

| 角色 | 职责 | 文件归属 | 驱动技能 | 状态 |
|------|------|----------|----------|------|
| 🏛️ **架构师/集成负责人** | 定义架构契约、拆解任务、派发智能体、跨模块集成与联调、把控全局质量 | ARCHITECTURE.md / TEAM.md / 全局集成 | `zoom-out` `request-refactor-plan` `improve-codebase-architecture` | ✅ 常驻 |
| 📋 **产品策划** | 需求澄清、功能规划、PRD、功能落地（如收藏/生词本） | pages/favorites/* · phrase-card 功能 · app.json 入口 | `grill-me` `to-prd` `to-issues` `triage` `prototype` | ✅ 已交付收藏功能 |
| 🎨 **UI 设计师** | 视觉系统、设计令牌、交互细节、组件样式 | *.wxss · app.wxss · components/*/.wxss | `design-an-interface` `prototype` | ✅ 已交付视觉优化 |
| 🤖 **前端工程师** | 页面逻辑、组件实现、Bug 修复、状态管理 | pages/*/.js · components/*/.js · 部分 .wxml | `tdd` `diagnose` `caveman` `handoff` | ✅ 已修复 5 个评审 Bug |
| 🗂️ **数据工程师** | 数据建模、分包拆分、数据访问层、工具库 | packageData/* · services/phrase-service.js · utils/* | `ubiquitous-language` `migrate-to-shoehorn` | ✅ 已交付数据层(93/2977) |
| 📊 **数据分析师** | 埋点基建、KPI 体系、数据资产分析、运营洞察 | services/analytics-service.js · docs/data-analysis.md · docs/metrics.md · 各页埋点 | `diagnose` (数据归因) | ✅ 已交付埋点+分析报告 |
| 🔍 **QA / 测试工程师** | 功能验证、回归测试、代码评审、质量门禁 | 测试用例 · 评审报告（不改业务代码） | `qa` `review` `tdd` `setup-pre-commit` | 🟡 配置就绪·按需激活 |
| 🔒 **安全工程师** | 安全评审、权限/隐私（埋点合规）、依赖审计 | 安全评审报告 · 隐私合规建议 | `/security-review` `git-guardrails-claude-code` | 🟡 配置就绪·按需激活 |
| 📝 **技术文档** | README、交接文档、对外说明 | README.md · docs/* · 交接 | `handoff` `edit-article` `write-a-skill` | 🟡 随交付滚动产出 |

> ✅ 已激活并交付　🟡 配置就绪，可一句话激活（"启动 QA / 安全评审"）

## 协作机制（避免冲突的关键）

1. **单一事实来源**：ARCHITECTURE.md 定接口契约，TEAM.md 定文件归属，先定契约再并行。
2. **严格文件归属**：每个智能体只改归属文件；跨边界改动须在汇报中声明并由架构师集成。
3. **并行 + 集成**：独立切片并行施工，架构师负责集成联调与全局校验（JSON 合法性、数据完整性、tabBar 合规等）。
4. **评审闭环**：专家评审 → 分级问题（严重/中等/轻微）→ 择优修复 → 回归校验。

## 技能底座

团队能力由 [Matt Pocock skills](https://github.com/mattpocock/skills)（29 个，已装入 `.claude/skills/`）+ Claude Code 内置技能（`/code-review` `/security-review` `/verify` 等）共同驱动。各角色"驱动技能"列为其主要工具集。

## 数据驱动闭环（数据分析师建立）

```
用户行为 → analytics-service 埋点(本地持久化) → getReport() 汇总
   → docs/metrics.md KPI 口径 → 产品策划决策 → 内容/功能迭代
```
当前埋点本地存储，已预留 `report()` 上报钩子，将来可对接后端 / 微信数据助手。
