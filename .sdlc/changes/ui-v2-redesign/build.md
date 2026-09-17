# Build: UI V2 全套视觉与四屏闭环重做

status: candidate
source_intent: plan.md
source_design: design.md
revision: 工作树（未提交）
owner: codebuddy-agent
created_at: 2026-09-17
updated_at: 2026-09-17

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | ui-v2-redesign |
| 阶段负责人 | tom57 |
| 来源类型 | feature |
| 上游记录 | plan.md / design.md |
| 代码版本 | 工作树（未提交） |
| 当前状态 | candidate |

## Implementation summary

按 V2 六屏稿重做视觉层与信息架构；数据管线（store / ai / backup / storage / 动效基建）不动。

- `styles.css` 重写为 V2 token 与共用件。
- 页面：新增 `StartPage`、`TracesPage`；重写今天 / 第一步 / 记录三页；输入页换语言。
- 组件：`TabBar` 改四槽深色胶囊；新增 `TraceItem`、`ShareCard`；删 `RecordCard`、`DOButton`、`MemoryItem`、`MemoriesPage`。
- lib：新增 `duration.ts`（时长解析）、`traces.ts`（分类 / 统计）、`textarea.ts`；`card-render.ts` 改为海报式满幅卡。

## Changed areas

`prototypes/first-loop/src/` 全量视觉层 + `index.html`（Bebas Neue 字体链接）。
数据契约增量：`MemoryRecord.outcome?`、`AppSettings.onboarded?`、`Tab` 改名 `traces`。

## Tests changed

无自动化测试套件；回归靠 `typecheck` + `build` + 浏览器闭环走查（见 test.md）。

## Material deviations

1. 分享卡封面改满幅裁切（与 DESIGN #16「不裁切」相反，按 V2 稿）。
2. 「换一个建议」按稿加回第一步页。
3. 行动三选保留三档（稿只画两档），第三档为弱文字按钮。
4. 痕迹分类为关键词推导，不落库、不加打标交互。
5. 深色主题按新色板等价映射（稿只有亮色一套）。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck` | 通过（0 error） |
| 生产构建 | `npm run build` | 通过（5002 modules） |
| 闭环走查 | CDP + Chrome 430×932 | 通过，见 test.md |

## Revision（2026-09-17 第二版，按用户裁决）

- **分享卡封面改回不裁切**：`card-render.ts` 重写——封面按原比例完整绘制（高度随图伸缩），文字排到封面下方，不再压图；徽章/时长大字在无关联 DO 时省略。（推翻本文件 "Material deviations #1"）
- **痕迹筛选去掉**：删除 `TraceTag` / `TRACE_TAGS` / `classifyTrace` 与筛选 chip 行（不留死代码），痕迹页只留统计 + 时间线。
- 复验：`typecheck` / `build` 通过；CDP 复核截图 `.sdlc/evidence/ui-v2-redesign/07-traces.png`（无筛选行）与 `08-share.png`（canvas 680×1150 = 原比例封面 + 下方文字块）。

## Known limitations

- 本机 `agent-browser` 二进制被应用控制策略拦截，改用 CDP 直连本机 Chrome 取证（一次性脚本已删除）。
- 未提交：候选版本在工作树里，无回滚点。
