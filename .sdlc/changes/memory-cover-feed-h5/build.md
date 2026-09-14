# Build: 回忆列表只展示首图+张数角标,全部图片在查看器内翻看

status: accepted
source_intent: plan.md
source_design: docs/design/DESIGN.md §2/§4
issue:
pr:
revision: 本地构建(提交见 deploy)
owner: trae-agent
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | memory-cover-feed-h5 |
| 阶段负责人 | trae-agent |
| 来源类型 | feature |
| 来源引用 | 用户对话 2026-09-14 |
| 上游记录 | plan.md / design.md |
| 代码版本 | 本地工作树 |
| PR | 无,直接 push main |
| 当前状态 | candidate |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Implementation summary

- `MemoryItem`:渲染从 `urls.map` 全量改为只渲染 `urls[0]`;失败态从数组简化为 `coverFailed` 布尔(只跟踪封面);多图时渲染右下角标 `.memory-image-count`(Phosphor `Images` 图标 + 总张数)。
- `memories.css`:`.memory-images` 加 `position: relative` 锚定角标;新增 `.memory-image-count` 半透明胶囊样式(rgba 0.45 黑底、白字 11px、圆角 999)。
- 查看器/编辑/导出零改动(`onView(urls, 0)` 仍传完整 urls 数组,查看器翻页能力不变)。

## Changed areas

- `src/components/MemoryItem.tsx`
- `src/pages/memories.css`

## Tests changed

无自动化测试;浏览器手测见 test.md。

## Material deviations

无。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck` | 通过 |
| 生产构建 | `npm run build` | 通过(431.93 kB / gzip 133.84 kB) |
| 浏览器手测 | dev server + 自动化浏览器 | 通过,见 test.md |

## Known limitations

- 封面失败但其余图正常时,列表只出占位块;用户仍可点占位进查看器翻其余图(诚实但不显图),可后续再议。
