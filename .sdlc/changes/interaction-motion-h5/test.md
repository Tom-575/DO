# Test: 手感与导航 —— 横滑切页 + 全站交互动效重做 + Tab 栏与外观页改形

status: accepted
candidate_revision: 未提交的工作树（HEAD = 7f83f75）
source_intent: plan.md
source_design: design.md
source_change: interaction-motion-h5
issue:
pr:
verifier: codebuddy-agent（agent-browser 自动化，Chromium 430×932）
created_at: 2026-09-16
updated_at: 2026-09-16

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | interaction-motion-h5 |
| 阶段负责人 | tom57 |
| 被验证版本 | dev server `http://localhost:4173/DO/`（vite，工作树代码） |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | codebuddy-agent（agent-browser 自动化） |
| 当前状态 | as-built 补录，阶段未推进 |
| 创建时间 | 2026-09-16 |
| 更新时间 | 2026-09-16 |

## 验证方法

**agent-browser（Chromium，无头）+ `set viewport 430 932`**，独立会话（`--session doh5 --pin-tab`），冷启动走**完整用户闭环**：首页 → 输入念头 → mock 产出行动 → 马上做 → 首页列表 → 记录（文字+图片+整理）→ 保存 → 回忆 → 编辑/查看器 → 外观页草稿模型。

断言方式：`eval` 直接读 DOM / computed style / React 渲染结果；动效取证用 **`MutationObserver` 探针**抓取 `clip-path` 内联样式的首帧序列（动画结束后读到的只是终点值，首帧才是"从控件长出来"的证据）。

证据：**20 张截图**，存于 `.sdlc/evidence/interaction-motion-h5/`（01–19，含 14b）。

> **环境备注**：共享 daemon 曾被另一个标签页（Photoroom）占据活动页，导致首轮 `console` 输出被污染；已切换独立会话重测，本文件所有结论均来自独立会话。该标签页的 `FedCM` / `adjust-sdk` 报错与本原型无关（页面脚本清单核对过：只有 vite client 与 `main.tsx`）。

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| 冷启动渲染正常，无页面错误、无第三方脚本 | `errors` 空；`document.scripts` 仅 vite client + `main.tsx`；console 仅 vite/React 提示 | 通过 |
| 手机视口下框架/分页器/两页结构正确 | `eval`：`prototype-frame theme-system`、`.tab-pager`、2 × `.tab-slide`（01-home-cold.png） | 通过 |
| 横滑吸附生效 | computed `scroll-snap-type: x mandatory`、`scroll-snap-stop: always` | 通过 |
| 位移驱动 tab 状态（双向） | `scrollLeft=430` → `inert:[true,false]`、`aria-current` 落在「回忆」；`scrollLeft=0` → 翻回（02/03 png） | 通过 |
| 未激活页 `inert` | 同上，两方向 `inert` 数组随位移翻转 | 通过 |
| 指示点跟随当前页 | `.tab-indicator` 的 `closest('button')` 从「今天」变「回忆」再变回 | 通过 |
| **容器变换 ①：DO 按钮 → 输入页** | 探针首帧 `inset(236px 22px 601px round 16px)` → `inset(0px)`；`.input-page` 带 `bloom-in`（04 png） | 通过 |
| **容器变换 ②：列表行 → 行动页** | 首帧 `inset(411px 16px 465px)`（平底行）→ `inset(0px)`；`bloom-in`（08 png） | 通过 |
| **容器变换 ③：`+` 号 → 记录页（圆形）** | 首帧 `circle(22px at 215px 902px)` → `circle(928px at 215px 902px)`，全程是圆（09 png） | 通过 |
| **容器变换 ④：回忆条目 → 编辑页** | 首帧 `inset(127px 16px 429px)`；进入编辑态、原文字与整理版保留（13 png） | 通过 |
| **容器变换 ⑤：缩略图 → 查看器** | 首帧 `inset(166px 16px 467px round 15px)`（封面 15px 圆角）→ `inset(0px)`；页码 `1 / 1`（14b png） | 通过 |
| **容器变换 ⑥：头像 → 外观页（圆形）** | 首帧 `circle(20px at 386px 80px)` → `circle(936px …)`（15 png） | 通过 |
| 背景退后（高斯模糊） | push 屏打开时 `.main-page` computed `filter: blur(12px)`；返回后 `none` | 通过 |
| 首页常驻且被盖住时 `inert` | `.push-layer` 存在时 `.main-page` 有 `inert`；关闭后解除 | 通过 |
| 无来源控件的页面走整页进入（不是容器变换） | `.action-page` class **无** `bloom`（06 png） | 通过 |
| 完整闭环可用（离线 mock） | 输入念头 → 发送键由 `disabled` 变可用 → 产出行动 → 马上做 → 首页出现该 DO（07 png） | 通过 |
| 记录页：文字 + 图片上传 + 帮我整理 | 上传真实 PNG（`naturalWidth 640`）出缩略图；`.record-refined` 出现整理文本（10/11 png） | 通过 |
| 保存后切回忆页且记录可见 | `aria-current` 落在「回忆」；1 条记录、封面图在、无张数角标（单图，符合 #18）（12 png） | 通过 |
| Tab 栏与页面一体 | computed `border-top-width: 0px`、`background-color: rgba(0,0,0,0)` | 通过 |
| 滚动条统一隐藏 | `.app-scroll` computed `scrollbar-width: none` | 通过 |
| 外观页数据分组边界标注 | `.group-tag` 文本 = 「立即生效」，挂在「数据」组标签右侧（15 png） | 通过 |
| **草稿模型：改动只进草稿** | 选「黑夜」后 `.prototype-frame` 仍 `theme-system`，按钮变 `.active`（16a png） | 通过 |
| **草稿模型：✕ 丢弃** | ✕ 回首页主题未变；重开页面「黑夜」按钮 class 为空——草稿确被清空（16b png） | 通过 |
| **草稿模型：✓ 写回并持久化** | ✓ 回首页后 `.prototype-frame` = `theme-dark`；重开页面「黑夜」仍 `.active`（17/18 png） | 通过 |
| `prefers-reduced-motion` 下容器变换跳过且功能可用 | `set media light reduced-motion` 后点 `+`：`.record-page` **无** `bloom`、内联 `clip-path` 为空、导航正常（19 png） | 通过 |
| 真机（iOS Safari / 安卓 Chrome） | —— | **未测**（见 Untested scope） |
| 提交 / 推送 / Actions 构建 | —— | **未执行** |

## Required checks

| Check | Source or command | Result | Link |
|---|---|---|---|
| 类型检查 | `npm run typecheck` | 通过 | build.md「Local checks」 |
| 生产构建 | `npm run build` | 通过 | build.md「Local checks」 |
| 页面错误 | agent-browser `errors`（独立会话，全程多次检查） | 空 | 本次运行 |
| reduce-motion 覆盖 | `* { transition: none !important }` + 各 `@media` 块 + 实测跳过容器变换 | 通过 | design.md「Behavior contract」 |
| 六阶段前提：`AnimatePresence` 禁用 | 全仓检索 | 通过（零命中） | DESIGN §5.1 |

## Change-specific checks

**两轴 code review（Standards / Spec 并行子代理，固定点 `7f83f75`，作者逐条复核并剔除误报）**

| # | 轴 | 发现 | 判定 | 处置 |
|---|---|---|---|---|
| 1 | Standards | Tab 选中图标 `scale(1.14)` 被同选择器的 `scale(1.08)` 覆盖，1.14 是死代码；§4 写 1.08、§5.3 写 1.14 | 真·代码 bug | 已修：删重复规则，统一 1.14 |
| 2 | Standards | ActionPage 整页进入完全没有 `opacity`；Input/Record 的 `initial` 无 `opacity: 0` → 淡入失效 | 真·与 §5.2 不符 | 已修：三处 `initial` 补 `opacity: 0` |
| 3 | Standards | §5.1「按下缩放只能用 `whileTap`」过宽，与 §5.3 及 11 处纯 CSS 按钮实现矛盾 | 真·文档缺陷 | 已修：改为有适用范围的规则 |
| 4 | Standards/Spec | §5.2 的 `SPRING_REBOUND`、§5.3 的 `use-window-deploy` 为过期引用 | 真·文档过期 | 已修：删除 |
| 5 | Standards | `App.tsx` 首个 effect 依赖数组含未使用的 `resetSwipe` | 真·小 | 已修 |
| 6 | Standards | 五处逐字复制 `useExpandTransition` 接线块 | judgement | 未修（可抽包装组件） |
| 7 | Standards | `COLLAPSE_MS = 340` 与 `.bloom-out .34s` 同值两处；`LAG_*` 不在 `motion.ts` | judgement | 未修（调档入口待收口） |
| 8 | Spec | 声明与实现不符：即 #1/#2/#4——as-built 记录夹带未落地的声明 | 真·系统性 | 已修；根因记入 maintain.md |

**作者复核后剔除的误报（3 条）**：① 「五个页面透明度全丢」——只有 ActionPage 真丢，另两个只是 `initial` 缺 `opacity: 0`；② 「reduce-motion 覆盖不全」——存在 `* { transition: none !important }` 兜底，且本次实测已证；③ 「`AppearancePanel` 注释未改」——已限定到三个草稿分组。

**浏览器实测补充发现（1 条）**

| # | 发现 | 判定 | 处置 |
|---|---|---|---|
| 9 | mock 路径下「输入页对话气泡」是瞬态：发送后立即产出行动并切页，气泡阶段 < 1.5s，截图只捕到行动页 | 行为符合红线「能不问就不问」，非缺陷 | 记录在案；无独立截图（05 与 06 同画面，已删除 05） |

## Untested scope

- **真机浏览器**（iOS Safari / 安卓 Chrome）：屏幕边缘起滑的手感、`inert` 对横滑的影响、移动 GPU 上六个 `clip-path` 动画的帧率与裁切边缘质量；
- **真实 AI 路径**（配置 key 的远程 adapter）：本次全部走离线 mock；
- **多图记录**：张数角标、查看器多页横滑（本次只传了 1 张图）；
- **触摸手势本身**：无头 Chromium + `set viewport` 只能驱动滚动与指针事件，真触摸串（`pointerdown → move → up` 的 scroll-snap 拖拽）未覆盖；
- **深色系统偏好下的视觉走查**、**键盘可达性**（Tab 焦点顺序）。

## Residual risk

| 风险 | 说明 | 处置 |
|---|---|---|
| 真机差异 | 上述 Untested scope 的前四项在移动端可能表现不同 | 真机走查后再关掉此项；有问题的开新 change |
| 参数未定稿 | 带过冲弹簧与「禁止弹跳」旧条款冲突 | 待人工决定（design.md Policy conflicts #2） |
| 未提交 | 候选版本在工作树里，无回滚点 | 提交后作废 |
| 重复的接线块 | 五个 push 屏逐字复制同一段容器变换接线（judgement #6） | 抽 `BloomPage` 包装 |
| 调档入口不完整 | 部分参数不在 `motion.ts`（judgement #7） | 收口到单一入口 |

## Verdict

`pass`

**放行范围**：桌面 Chromium 模拟 H5 视口（430×932）下的全部可验证行为——结构与可访问性、双向横滑与落点、六个容器变换（含首帧证据）、背景退后、完整用户闭环、记录与整理、查看器、外观页草稿模型、reduce-motion。**每一项都有可重跑的断言或截图证据**，不再有"手测过"这类不可复核的说法。

**附带的两个未决项**（不阻塞本 verdict，但阻塞"稳定"）：① 真机浏览器未测（移动端是产品的主场景，建议 Deploy 后真机走查，问题开新 change）；② 候选版本未提交。
