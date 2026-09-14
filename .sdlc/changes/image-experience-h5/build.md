# Build: 三期图片体验:卡片封面原比例显示 + 回忆页全屏看图(小红书式滑动)

status: accepted
source_intent: plan.md
source_design: docs/design/DESIGN.md(§2 交互地图、§3 视觉语言)
issue:
pr:
revision: build(本地,未提交前)
owner: trae-agent
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | image-experience-h5 |
| 阶段负责人 | trae-agent |
| 来源类型 | feature |
| 来源引用 | 用户对话 2026-09-14;CONTEXT.md 未决语义 |
| 上游记录 | plan.md / design.md |
| 代码版本 | 本地工作树(提交见 deploy) |
| PR | 无,直接 push main |
| 当前状态 | candidate |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Implementation summary

- **#16 卡片封面原比例**:`src/lib/card-render.ts` 封面由 1:1 居中裁切改为原比例完整绘制——封面先加载再量高(`imageSize()` 支持 ImageBitmap 与 HTMLImageElement),`coverH = BODY_WIDTH × h/w`,卡片总高随之动态;封面加载失败占位块保持 1:1(占位不是真实内容,不引入假的「裁切感」)。
- **#17 全屏图片查看器**:新增 `src/components/ImageViewer.tsx`——黑底遮罩(z-index 40,应用内 absolute,同 card-overlay 模式)、scroll-snap 横向轨道(`scroll-snap-stop: always` 一滑一图)、页码 n/N、X 关闭、铅笔进编辑、键盘 ←/→/Esc、鼠标滚轮纵向分量转横向、`touch-action` 分层(遮罩 none / 轨道 pan-x)防触摸穿透、reduce-motion 时跳过平滑滚动、加载失败占位。
- **分区响应**:`MemoryItem` 图片 `onClick` stopPropagation 后上报 `onView(urls, index)`;文字/其余区域保持整条点击进编辑。查看器状态上提至 `MemoriesPage`(记录 + urls + 起始页),编辑入口关闭查看器后走既有 `openEdit`。
- 样式入 `memories.css`(查看器段 + `cursor: zoom-in`);复用全局 `fade-in`。

## Changed areas

- `src/lib/card-render.ts`(#16)
- `src/components/ImageViewer.tsx`(新增,#17)
- `src/components/MemoryItem.tsx`、`src/pages/MemoriesPage.tsx`、`src/pages/memories.css`(#17)

## Tests changed

无自动化测试(原型阶段);测试证据见 test.md(浏览器手测)。

## Material deviations

- 计划内的取舍两点:封面加载失败占位保持 1:1(而非跟随未知比例);查看器不做缩放/排序/封面选择(plan.md Out of scope)。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck` | 通过 |
| 生产构建 | `npm run build` | 通过(428.55 kB / gzip 133.11 kB) |
| 浏览器手测 | dev server + 自动化浏览器 | 通过,见 test.md |

## Known limitations

- 桌面端鼠标无拖拽换页(键盘/滚轮/触控板可换);触屏滑动为主路径。
- 封面不设高度上限:超长竖图会使卡片很长,按 plan 决策先观察真实使用。
