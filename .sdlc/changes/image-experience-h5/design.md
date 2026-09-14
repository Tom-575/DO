# Design: 三期图片体验:卡片封面原比例显示 + 回忆页全屏看图(小红书式滑动)

status: accepted
owner: trae-agent
source_intent: plan.md
issue:
pr:
supersedes:
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | image-experience-h5 |
| 阶段负责人 | trae-agent |
| 来源类型 | feature |
| 来源引用 | 用户对话 2026-09-14(分区响应 + 不裁切由用户拍板) |
| 上游记录 | plan.md |
| 当前状态 | accepted |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Chosen approach

- **卡片不裁切(#16)**:沿用 canvas「先量后画」框架,把封面加载提前到布局计算之前,`coverH = 卡片内容宽 × 原图高宽比`,绘制时整图 `drawImage` 进圆角 clip。零新依赖,不碰模板其余部分。
- **全屏查看器(#17)**:采用**应用内 absolute 遮罩**(z-index 40,与 card-overlay 同模式)而非 body portal——桌面端有手机框视口,portal 会溢出框;采用 **CSS scroll-snap 横向轨道**而非 JS 手势库——触屏原生顺滑、零依赖,键盘/滚轮补齐电脑可用。分区响应靠图片 `stopPropagation`,编辑流完全复用 #13 既有 `openEdit`。

## Affected boundaries

- `lib/card-render.ts`(布局段重写,导出接口 CardData/renderRecordCard 不变)
- 新增 `components/ImageViewer.tsx` + memories.css 查看器段
- `components/MemoryItem.tsx` 增加 `onView` 回调;`pages/MemoriesPage.tsx` 持有查看器状态
- 不触及 store/types/数据契约/其他页面

## Behavior contract

- 点回忆条目图片 → 打开查看器,定位到被点那张;点文字/其余区域 → 进入编辑态(原 #13 行为不变);点导出按钮 → 卡片预览(原 #14 行为不变)。
- 查看器内:X 关闭;铅笔关闭并进编辑;横滑一图一页;页码 n/N 实时;Esc/←/→ 可用;黑色空白点击关闭;背后回忆流不滚动(touch-action 分层)。
- 卡片导出:封面恒为原图比例完整显示;封面加载失败 → 1:1 占位块,卡片其余部分照常。
- 无图记录三条路径(编辑/导出/查看)均不受影响。

## Data and interface changes

无 schema 变更;MemoryItem props 增 `onView(urls, index)`(组件内部接口)。

## Validation strategy

typecheck + build + 自动化浏览器全流程手测(注入双比例图记录),见 test.md;真机滑动手感留用户走查。

## Rollout implications

纯前端渲染层,push main 即发布;git revert 单提交可回滚。

## Policy conflicts and exceptions

无。与 DESIGN.md §5 动效规范(fade-in 0.2s、reduce-motion 全局响应)一致。

## Material alternatives

- 查看器动效用 motion 弹层 → 弃:§5 记录嵌入式 webview 退出动画会挂起,能用 CSS 的地方不用 JS 动画。
- 封面失败占位跟随比例 → 弃:未知比例会引入假裁切感,固定 1:1 更诚实。
- 双指缩放 → 弃(超范围,一步原则);留待后续 change。
