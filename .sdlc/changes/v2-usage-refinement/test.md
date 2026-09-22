# Test: V2 使用细化 —— 入口改「DO」且无 AI 直跳 / 关联念头提升 / 时长档位 5-15-自定义

status: accepted
candidate_revision: 未提交工作树（评审固定点 HEAD = 9803f28）
source_intent: .sdlc/changes/v2-usage-refinement/plan.md
source_design: .sdlc/changes/v2-usage-refinement/design.md
source_change: .sdlc/changes/v2-usage-refinement/build.md
issue:
pr:
verifier: codebuddy-agent
created_at: 2026-09-20
updated_at: 2026-09-20

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | v2-usage-refinement |
| 阶段负责人 | tom57 |
| 被验证版本 | 未提交工作树（评审固定点 HEAD = `9803f28`；`vite build` 产物见 build.md） |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | codebuddy-agent（实现后自验 + 两轴 code review，见下） |
| 当前状态 | passed |
| 创建时间 | 2026-09-20 |
| 更新时间 | 2026-09-20 |

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| 无 AI 配置时点 DO 直达第一步页，全程不渲染对话页 | C3 | 通过 |
| 配了 AI（三项齐全）时仍走对话页 | C13（写假 AI 配置后对话页出现） | 通过 |
| 记录页工具行只剩 3 颗，关联入口独立成行 | C10–C11 + [07-record-link.png](../../evidence/v2-usage-refinement/07-record-link.png) | 通过 |
| 档位为 5 / 15 / 自定义，AI 值吸附后恰有一档选中 | C4–C5 + [06-duration-custom.png](../../evidence/v2-usage-refinement/06-duration-custom.png) | 通过 |
| 自定义输入生效、**越界被夹到 1–90**、收起 | C7–C9 | 通过 |
| 不出现 `1.25 HR` 这类半格单位 | C6 | 通过 |
| `typecheck` / `build` / `verify` 全绿 | build.md「Local checks」 | 通过 |
| 前两轮修复（#42 / #43 / #44）无回归 | R1–R16 全绿 | 通过 |

## Required checks

| Check | Source or command | Result | Link |
|---|---|---|---|
| 类型检查 | `npm run typecheck` | 通过（无输出） | — |
| 生产构建 | `npm run build` | 通过 | — |
| 桌面断言脚本 | `$env:EVIDENCE_DIR='v2-usage-refinement'; npm run verify` | **29 / 29 通过** | [scripts/verify.mjs](../../../prototypes/first-loop/scripts/verify.mjs) |
| 静态诊断 | IDE linter（5 个改动文件） | 0 条 | — |
| 首页入口 + 直达第一步页 | 430×932 dpr2 截图 | 通过 | [05-do-direct-step.png](../../evidence/v2-usage-refinement/05-do-direct-step.png) |
| 时长自定义态 | 同上 | 通过 | [06-duration-custom.png](../../evidence/v2-usage-refinement/06-duration-custom.png) |
| 记录页关联行 | 同上 | 通过 | [07-record-link.png](../../evidence/v2-usage-refinement/07-record-link.png) |

## Change-specific checks

重跑方式：

```bash
cd prototypes/first-loop
$env:EVIDENCE_DIR='v2-usage-refinement'; npm run verify    # PowerShell；bash 用 EVIDENCE_DIR=... npm run verify
```

一次运行覆盖**两轮 change 的全部断言**：本轮 13 条（C 段）+ 前两轮 16 条回归（R 段）。
**实测：29 / 29 通过。**

| # | 断言 | 期望 | 实测 | 结果 |
|---|---|---|---|---|
| C1 | 念头写进首页黑卡（受控 textarea 走原生 setter + `input` 事件） | `跑步 10 分钟` | 同左 | 通过 |
| C2 | 入口文案 | `DO` | `DO` | 通过 |
| C3 | 没配 AI 时点 DO 直达第一步页，且**对话页从未出现** | `hasAction && inputSeen===0` | `{hasAction:true, inputSeen:0, figure:'15MIN'}` | 通过 |
| C4 | 档位三档 | `5分钟 / 15分钟 / 自定义` | 同左 | 通过 |
| C5 | 恰有一个档位选中，AI 的 10 分钟吸附到 15 | `selected===1 && figure==='15MIN'` | 同左 | 通过 |
| C6 | 不出现 HR 半格单位 | 无 `HR` | `figure=15MIN` | 通过 |
| C7 | 点自定义就地展开输入，上限 90 | `hasInput && max==='90'` | 同左 | 通过 |
| C8 | 输入 25 → 生效、收起、仍只选中一档 | `25MIN` + `customSelected` + `inputGone` | 同左 | 通过 |
| C9 | **越界输入 200 被夹到 90** | `90MIN` | `90MIN` | 通过 |
| C10 | 关联入口独立成行（已关联显示念头原文） | `.record-link.linked` = `跑步 10 分钟` | 同左 | 通过 |
| C11 | 工具行不再含关联，只剩 3 颗 | `[加一张照片, 记录时间, 帮我整理]` | 同左 | 通过 |
| C12 | 点入口后候选列表就地展开 | `.record-picker` 存在 | 存在 | 通过 |
| C13 | **配了 AI（假配置）时仍进对话页** | `inputPageSeen ≥ 1` | `inputPageSeen=1` | 通过 |

**对照说明（断言的区分度）**：C3 在修改前必然失败（旧代码无条件进 `input`）；
C4 / C5 在修改前必然失败（旧档位 `10 / 30 / 60`，且 AI 的 10 分钟直接显示为 10）；
C11 在修改前必然失败（关联是 `.record-chips` 里的第 4 颗 chip）。

### 回归（#42 / #43 / #44）

R1–R16 全绿：手势驱动 tab 变化不调用 `scrollTo`（0 次）而点 Tab 仍调用（1 次）；
第一步页返回落到今天页且从未渲染对话页；首页无 `.idea-chips`。
证据见 [01-today-no-chips.png](../../evidence/v2-device-feedback/01-today-no-chips.png) 与同目录其余截图。

## Code review（两轴，2026-09-20）

按 `code-review` 技能跑：固定点 = HEAD `9803f28`，被评审对象 = **未提交工作区**
（`git diff HEAD -- prototypes/first-loop` 导出后交子代理，另附未跟踪的 `scripts/verify.mjs`）。
Spec 来源 = 两个 change 的 plan / design + `TODO.md` 六期 + `DESIGN.md` §2；
Standards 来源 = `AGENTS.md` + `DESIGN.md` §5（动效契约）+ Fowler 坏味道基线。
两轴由两个并行子代理分别跑，**不合并**；下列结论都经过我逐条到代码复核。

### Standards

| 发现 | 判定 | 处理 |
|---|---|---|
| 自定义面板用 `popIn(reduceMotion, 0, 18, 0.94)` | **硬违规**：§5.3「就地展开只做容器高度 / 收起，不做位移动效」；且越出 §5.2 的 `popIn` 区间（上移 20–30px、缩放 0.7–0.9） | 已修：改为 `height: 0 → auto` + 透明度（`EASE_OUT` 0.28s） |
| `.record-link:active { transform: scale(0.99) }` | **硬违规**：§5.3 纯 CSS 按钮按下缩放区间 0.84–0.96 | 已修：0.96 |
| `.record-link svg:last-child` 只有 `transition` 没有变换 | **硬违规**：§5.3「列表行按下箭头右移 2px」未实现，且那行 `transition` 是死代码 | 已修：补 `:active` 位移 2px |
| `verify.mjs` 头注释只声明覆盖 `v2-device-feedback` | judgement（工件归户漂移） | 已修：注释改为覆盖两个 change |
| 坏味道 7 类（见下） | 全部 judgement | **部分未动**，逐条理由见下 |

**未动的 judgement 项及理由**：

- `snapToOption(parseMinutes(...))` 在 ActionPage 出现 3 次 → 抽 `initialMinutes(action)` 只多一层间接，
  三个调用点语义不同（初值 / 生成成功 / 兜底），收益不抵可读性损失。
- `isCustom` 反向依赖 `DURATION_OPTIONS`（还用 `as readonly number[]` 绕类型）→ 移进 `duration.ts` 更干净，
  但会多一个导出；**记为待办**，不在本轮夹带。
- `minutes` / `customOpen` / `customDraft` 三个原语撑起"选中的档位"一个概念 → 收敛成联合类型是更深的改动，超范围。
- ActionPage 因三个原因被改（Divergent Change）→ 确实是信号（返回跳转 / 时长吸附 / 自定义输入挤在一个文件），
  但它已 200 行，拆分应单独开一轮。
- `applyCustom` 与 `clampCustomMinutes` 的双重守卫 → **已加注释**说明二者语义不同
  （前者「不替用户做决定」，后者「给初值兜底」），不合并。
- `snapToOption` 命名 → 保留：它只有一个档位列表可吸附，"custom" 的命名问题源自档位本身含自定义，
  改名不会让这件事更清楚。

### Spec

| 发现 | 判定 | 处理 |
|---|---|---|
| plan 判据写了「超出被夹到边界」，但脚本里**没有任何越界断言** | 真问题（声称的判据没被验证） | 已补 C9（200 → 90） |
| 断言名仍写「帮我找到第一步」（#46 已改名 `DO`） | 真问题（误导后来人） | 已改 |
| design 行为契约 4「用户**手动改过之后**才写回 `action.time`」，而 `commit` 无条件改写 | 真问题（实现与 spec 不符，会把 AI 的「大约 10 分钟」悄悄写成「大约 15 分钟」） | 已修：新增 `timeTouched`，没动过就保留 AI 原话 |
| design 写候选列表「一字不动」，实现却把它移到入口下方 | 真问题（文档与实现矛盾） | 已修文档：design 改为「随入口上移」并写明理由（build.md 早已声明该偏差） |
| plan 成功判据「配了 AI 仍进对话页」无证据 | 真问题 | 已补 C13（写假 AI 配置，断言对话页出现） |
| `candidate_revision` 写的 HEAD 与实际固定点不符 | 真问题（被验证版本不可追溯） | 已更新为 `9803f28` |
| 「手势分支不设 `guardedUntil`」无断言 | judgement | **未动**：`guardedUntil` 是组件内部 ref，DOM 不可观测；「手势不调用 `scrollTo`」已覆盖该契约的可观测后果 |
| `TODO.md` #42–#48 仍全部未勾选 | 非缺陷 | 故意：勾选发生在 gate 放行之后（与 #33–#40 的惯例一致） |

### 复核说明

Standards 轴报的 4 条硬违规里有 1 条需要判断——「§5.3 禁止位移动效」那句写在**圆形 disclosure** 那一行，
是否适用于自定义面板：复核后确认适用（同为「就地展开」这一形态），其余 3 条直接成立，**全部已修**。
Spec 轴报的 6 条真问题逐条到代码核对后成立，**无剔除**（本轮子代理没有误报）。

## Untested scope

- **真实触摸手势**（跨 change 的公共缺口）：headless Chrome 下试过四种注入方式，
  **全部驱动不了 `.tab-pager` 的横向滚动**（`scrollLeft` 全程 0）——`mouseWheel`、
  `synthesizeScrollGesture`（mouse / touch 两种源）、`setEmitTouchEventsForMouse` + 逐帧鼠标拖拽
  （最后一种还会让 CDP 调用超时不返回）。而**同一次探针里程序化 `scrollLeft = 430` 是生效的**
  （容器可滚、snap 正常），所以这是 headless 输入管线的缺口，不是页面问题。
  → 结论：「手指滑动」「跟手」「吸附落页」这一类**只能在手机浏览器或真机远程调试上判**。
  探针保留在 `scripts/probe-swipe.mjs`（换环境后可复跑，判断是否仍受同一限制）。
- **真实 AI 请求**：C13 只验证了「入口分流」（写假 `baseURL` 后对话页出现），**没有**验证真实
  model 返回的措辞与时长（本轮所有断言都在无 AI 的 mock 路径上）。
- **真机触摸与移动键盘**：`inputMode="numeric"` 是否弹数字键盘、自定义输入框在 iOS 上的 `autoFocus`
  与光标行为，需真机确认。
- **记录页视觉密度**：关联行独立成行后，小屏上整页是否过长。
- 深色主题下的 `.record-link` / `.duration-custom`、键盘可达性。

## Residual risk

1. **AI 建议时长的处理是假设**：`snapToOption` 把 10 分钟吸附为 15（plan.md 的 Open decisions 已记）。
   若用户想要「恒定 5 分钟、完全不看 AI」，改一处即可。**注意残留的不一致**：用户不动时长时，
   大字显示 15 而落库的 `action.time` 仍是 AI 的「大约 10 分钟」（这是刻意的——尊重 AI 原话，
   但两者确实不同，尚未消除）。
2. **验证者 = 实现者**（同一会话），独立性弱；两轴子代理是同一轮里的外部视角，
   但结论仍由同一人复核给出。
3. **`#46` 的行为取决于设置**：真机上若已配 AI，入口会走对话页。

## Verdict

`pass`

**放行范围**：桌面 Chromium 模拟 H5 视口（430×932）下 #46 / #47 / #48 的全部可验证行为，
加上前两轮 16 条断言的回归、两轴 code review 的修正，以及 `typecheck` / `build`。

**放行后的必做项（阻塞「稳定」）**：用户在真机上确认
① 入口「DO」的文案与跳转、② 自定义时长输入（数字键盘 / 光标 / 展开高度）、
③ 记录页关联行的可点区域与整页长度。不通过则按 Residual risk 回炉。
