# Build: 手感与导航 —— 横滑切页 + 全站交互动效重做 + Tab 栏与外观页改形

status: accepted
source_intent: plan.md
source_design: .sdlc/changes/interaction-motion-h5/design.md + docs/design/DESIGN.md §5
issue:
pr:
revision: null
owner: codebuddy-agent
created_at: 2026-09-16
updated_at: 2026-09-16

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | interaction-motion-h5 |
| 阶段负责人 | tom57 |
| 来源类型 | feature（体验重做）+ refactor |
| 来源引用 | `docs/TODO.md` #23–#32 |
| 上游记录 | plan.md / design.md |
| 代码版本 | **未提交的工作树**（固定点 `7f83f75`，24 改 / 6 新增 / 1 删除） |
| PR | 无（未推送） |
| 当前状态 | as-built 补录，阶段未推进 |
| 创建时间 | 2026-09-16 |
| 更新时间 | 2026-09-16 |

## Implementation summary

- **横滑分页器**：`.tab-pager`（`scroll-snap-type: x mandatory` + `scroll-snap-stop: always`）承载今天/回忆两页，每页各自一份 `.app-scroll` 保留纵向位置；未激活页 `inert`。落点判定**越过中点立刻翻**，并用 `PROGRAMMATIC_GUARD_MS = 600` 挡「点 Tab 的程序化滚动」误判（`onPointerDown` 作废守卫）。
- **原点测量**：新增 `lib/screen-origin.ts`。点击处理器内**同步**量控件矩形与形状（存模块级变量，因 store 更新是异步批处理；take 一次即清空；量布局盒而非 `whileTap` 变换后的盒）。
- **容器变换**：新增 `lib/use-expand-transition.ts`。内联 `clip-path` + CSS transition 铺开 / 收回（`.bloom-in` .42s / `.bloom-out` .34s；圆用 `circle(22px at cx cy)` → `circle(到最远角 px at cx cy)`，矩形用 `inset(... round 控件圆角)` → `inset(0 round 0)`）；收回**定时器驱动**（`COLLAPSE_MS = 340`），不依赖退出动画机制。
- **统一参数**：新增 `lib/motion.ts`（`EASE_OUT` / `SPRING_IN` / `SPRING_BOUNCE` / `SPRING_TAP` / `PRESS_SCALE` / `riseIn` / `popIn` / `slideIn` / `stagger`）。
- **惯性甩出**：新增 `lib/use-swipe-lag.ts`，静止态恒为原位、偏移跟随滚动速度、欠阻尼弹簧归零时过冲一次、静默 90ms 收回。
- **首页常驻 + 背景退后**：`.main-page` 固定 `z-index: 0` 并自建层叠上下文，push 屏进 `.push-layer`（`z-index: 1`）；`.main-page.receded` 在 push 屏盖上来时 `blur(12px)` + `scale(1.04)`（放大是为了把全幅模糊的四边虚边推出框外），收回时用 `:has(.bloom-out)` 让背景直接感知前景在退。
- **外观页**：由 `components/AppearanceSheet.tsx`（已删除）改为 `components/AppearancePanel.tsx`（一整屏）+ `components/AppearanceButton.tsx`（头像，作为原点）。确立**草稿模型**：`theme/background/ai` 只改本地草稿，✓ 写回、✕ 丢弃；数据分组（导出 / 恢复）**在草稿之外**，组标签右侧标「立即生效」tag。
- **Tab 栏**：76→60px，去掉 `border-top`、独立底色与 `backdrop-filter`，与页面同处 `--bg` 一层；选中态 = 变色 + 图标 1.14 倍 + `layoutId` 滑动指示点（这两个按钮的按下反馈只用透明度——按钮被 `transform` 缩放会让指示点的测量位置漂）。
- **滚动条**：`.phone-app` 内一条全局规则统一隐藏（原先散在 `.app-scroll` / `.tab-pager` / `.plan-stream` / `.viewer-track` 四处，新加的 `.appearance-content` 漏了，浏览器原生滚动条因此露出来）。
- **评审后修复（同日）**：Tab 图标 1.14 被同选择器的 1.08 覆盖（死代码）；ActionPage 整页进入完全没有 `opacity`、Input/Record 的 `initial` 缺 `opacity: 0`（淡入失效）；`App.tsx` 首个 effect 的依赖数组含未使用的 `resetSwipe`；`DESIGN §5.1` 规则过宽、§5.2 `SPRING_REBOUND` 与 §5.3 `use-window-deploy` 为过期引用（均已删）。

## Changed areas

**新增（6）**

- `.codebuddy/rules/sdlc-gate/RULE.mdc`、`.codebuddy/skills/ai-sdlc-navigator/SKILL.md`、`.codebuddy/skills/code-review/SKILL.md`、`CODEBUDDY.md`（流程接线，同日补）
- `.sdlc/changes/interaction-motion-h5/*`（本工件）
- `prototypes/first-loop/src/lib/{motion,screen-origin,use-expand-transition,use-swipe-lag}.ts`
- `prototypes/first-loop/src/components/{AppearanceButton,AppearancePanel}.tsx`

**修改（24，原型）**

`App.tsx`、`components/{DOButton,ImageViewer,MemoryItem,PreviousRow,TabBar}.tsx`、`components/{card,sheet-extras}.css`、`pages/{TodayPage,MemoriesPage,InputPage,ActionPage,RecordPage}.tsx`、`pages/{today,memories,input,action,record}.css`、`store/{store.tsx,types.ts}`、`styles.css`

**删除（1）**

`components/AppearanceSheet.tsx`（被 `AppearancePanel.tsx` 取代）

**文档（3）**

`docs/design/DESIGN.md`（§2/§4/§5/§9）、`docs/TODO.md`（#23–#32）、`AGENTS.md`（流程门禁段）

## Tests changed

无自动化测试套件。验证方式为 `typecheck` + `build` + **agent-browser 自动化浏览器测试**（20 张截图 + eval 断言，存 `.sdlc/evidence/interaction-motion-h5/`）+ 两轴 code review，见 test.md。

## Material deviations

1. **补录而非先行**：本 change 的 plan/design 工件写于实现之后（计划与设计的原则在实现过程中才被逐轮校正出来：方向错 → 原点缺 → 形态错 → 静止态错，共四轮返工）。这不是流程应有的顺序，已记入 maintain.md 与 plan.md 顶部说明。
2. **原计划的 `use-window-deploy`（macOS 式窗口展开）已删除**：试过、用户否掉、文件清除，理由写入 DESIGN §5.0。
3. **单图也进查看器、封面固定首图**等三期的既定语义保持不变，未在本 change 内改动。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck` | 通过（2026-09-16） |
| 生产构建 | `npm run build` | 通过（441.03 kB / gzip 137.05 kB） |
| SDLC 状态校验 | `python Tools/claude-sdlc/scripts/validate_sdlc_state.py .` | **失败**：见 maintain.md（`shared/` 路径约定不一致，属工具侧既有问题） |
| 浏览器自动化测试 | agent-browser + dev server `http://localhost:4173/DO/`（430×932） | 通过，证据见 `.sdlc/evidence/interaction-motion-h5/` |
| 两轴 code review | 见 test.md | 已完成，4 项真问题当场修复 |

## Known limitations

- **候选版本未提交**：所有改动都在工作树里，没有回滚点；`revision` 字段只能写「未提交的工作树」。
- **真机未走查**：iOS Safari 从屏幕边缘起滑的手感、`inert` 对横滑的影响、六个容器变换在真机上的表现（含 SVG 裁切性能）均未验证。
- **参数仍在试验态**：带过冲弹簧未被批准为契约（见 design.md 的 Policy conflicts #2）。
- `prototypes/first-loop/vite-dev.log` 被开发服务器进程占用（EBUSY），停服后可删。
