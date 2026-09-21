# Build: V2 使用细化 —— 入口改「DO」且无 AI 直跳 / 关联念头提升 / 时长档位 5-15-自定义

status: candidate
source_intent: .sdlc/changes/v2-usage-refinement/plan.md
source_design: .sdlc/changes/v2-usage-refinement/design.md
issue:
pr:
revision:
owner: codebuddy-agent
created_at: 2026-09-20
updated_at: 2026-09-20

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | v2-usage-refinement |
| 阶段负责人 | tom57 |
| 来源类型 | 体验细化（3 处） |
| 来源引用 | 用户 2026-09-20 会话 |
| 上游记录 | plan.md / design.md |
| 代码版本 | 未提交工作树（HEAD = `b1704ec`） |
| 当前状态 | candidate |
| 创建时间 | 2026-09-20 |
| 更新时间 | 2026-09-20 |

## Implementation summary

1. **#46 入口**（`pages/TodayPage.tsx`）：按钮文案 `帮我找到第一步` → `DO`，补
   `aria-label="交给 DO，找到第一步"`；`goPlan` 里把屏幕去向改为
   `isAIConfigured(settings) ? 'input' : 'action'`，判据直接复用 `lib/ai.ts` 的导出版本
   （避免与设置页各写一套）。原点仍取自这颗按钮，两种去向共用。
2. **#47 关联入口**（`pages/RecordPage.tsx` + `record.css`）：关联从 `.record-chips` 移除，
   改为工具行下方的 `.record-link` 独立一行（未关联 = secondary 文案 + 箭头；已关联 = 念头原文 +
   陶土图标 + `field` 底）；**候选列表 `.record-picker` 一并从页面底部移到该行正下方**，
   原来点开还要往下找。
3. **#48 时长**（`lib/duration.ts` + `pages/ActionPage.tsx` + `action.css`）：档位
   `[10,30,60]` → `[5,15]` + 自定义；`DEFAULT_MINUTES` 10 → 5；新增
   `snapToOption`（AI 分钟数 → 最近档位，平局取大）与 `clampCustomMinutes`（1–90，四舍五入）；
   `durationLabel` 恒写「大约 N 分钟」；**删除 `durationUnit` / `durationFigure`**（两套单位退化成恒等映射，
   留着会误导后来人）。ActionPage 三处初值统一走 `snapToOption(parseMinutes(...))`，
   新增 `customOpen` / `customDraft` / `isCustom` / `applyCustom`，档位行变三列（5 / 15 / 自定义），
   自定义就地展开 `number` 输入 + 确定/取消。

## Changed areas

| 文件 | 改动 |
|---|---|
| `src/lib/duration.ts` | 重写：档位 / 默认值 / 自定义边界 / `snapToOption` / `clampCustomMinutes`；删两个单位函数 |
| `src/pages/ActionPage.tsx` | 三处初值走吸附；档位行 + 自定义按钮 + 展开输入；大字单位恒 `MIN` |
| `src/pages/action.css` | +81 行：`.duration-option-custom` 与 `.duration-custom*` |
| `src/pages/TodayPage.tsx` | import `isAIConfigured`；解构 `settings`；`goPlan` 分流；按钮文案 |
| `src/pages/RecordPage.tsx` | import `CaretRight`；关联入口独立成行；picker 移到入口下方 |
| `src/pages/record.css` | +42 行：`.record-link`（含 `.linked` 态） |
| `scripts/verify.mjs` | +11 条断言（#46 / #47 / #48）；证据目录改为 `EVIDENCE_DIR` 可指定 |
| `docs/design/DESIGN.md` | §2.1 三处、§2.2 第 1 条（AI 分流）、记录页段落 |
| `docs/CONTEXT.md` | 「已确认的原型边界」+3 条（入口分流 / 时长档位 / 关联入口层级） |
| `docs/TODO.md` | 六期 + #46 / #47 / #48 |

## Tests changed

沿用 `scripts/verify.mjs`（`npm run verify`），本轮新增 11 条断言：

- `#46`：念头写入受控 textarea 成功；入口文案 = `DO`；**没配 AI 时点它直达第一步页，
  且 `.input-page` 从未出现过**（MutationObserver 全程监听）。
- `#48`：三档 = `5分钟 / 15分钟 / 自定义`；恰有一个选中且 AI 的 10 分钟落到 **15**；
  不出现 `HR`；自定义展开输入的 `max=90`；输入 25 后大字 = `25MIN`、收起、仍只选中一档。
- `#47`：`.record-link` 独立存在且已关联时显示念头原文；工具行只剩 3 颗 chip 且不含「关联一个念头」；
  点入口后候选列表就地展开。

## Material deviations

一处**超出 design.md 已写范围**的改动，理由在此：候选列表 `.record-picker` 从页面底部
**移到关联行正下方**（design 只写了"入口独立成行"）。原因：入口上移后若候选列表留在底部，
点开还要往下滚，等于把"显眼"做成了"更难用"。位置变化不影响任何状态逻辑。

## Post-review fixes

两轴 code review（结论见 test.md 的「Code review」）后当场修掉的四处：

1. **自定义面板的动效**：原用 `popIn(reduceMotion, 0, 18, 0.94)` —— 既违反 §5.3「就地展开只做容器高度、
   不做位移动效」，参数也越出 §5.2 的 `popIn` 区间（上移 20–30px / 缩放 0.7–0.9）。
   改为 `height: 0 → auto` + 透明度，`EASE_OUT` 0.28s。
2. **`.record-link:active` 的缩放** 0.99 → **0.96**（§5.3 纯 CSS 按钮区间 0.84–0.96）。
3. **`.record-link` 的箭头**：此前只有 `transition` 没有变换（死代码），补上 §5.3 要求的
   「按下右移 2px」。
4. **`action.time` 不再被无条件改写**：新增 `timeTouched`，用户没亲手动过时长就保留 AI 给的原话——
   原先 commit 会把 AI 的「大约 10 分钟」悄悄写成吸附后的「大约 15 分钟」，
   与 design 行为契约 4「用户手动改过之后才写回」不符。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck` | 通过，无输出 |
| 生产构建 | `npm run build` | 通过；`index-Cmm2L0p8.js` (466.43 kB / gzip 143.75 kB)、`index-B8rwtE3P.css` (32.78 kB)（评审修正后重跑） |
| 桌面断言脚本 | `$env:EVIDENCE_DIR='v2-usage-refinement'; npm run verify` | **29 / 29 通过**（含前两轮的 16 条回归 + 评审后补的 2 条） |
| 静态诊断 | IDE linter（duration / ActionPage / TodayPage / RecordPage） | 0 条 |

## Known limitations

- **真机触摸仍未覆盖**：`npm run verify` 是桌面 headless Chrome + CDP 断言，滑动手感与移动端
  键盘行为（`inputMode="numeric"` 弹数字键盘）需用户真机确认。
- **AI 建议时长的处理是假设**：plan.md 的 Open decisions 记了"吸附到最近档位"，用户未直接拍板；
  想要"恒定 5 分钟"的话改 `snapToOption` 一处即可。
- 没配 AI 时第一步页的行动仍来自 `getAction` 关键词模板 —— 本轮只省掉对话那一步。
- 设置页「AI 状态显示」未做（用户未表态，见 plan 的 Out of scope）。
