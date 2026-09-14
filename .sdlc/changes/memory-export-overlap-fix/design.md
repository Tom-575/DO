# Design: 修复回忆条目导出按钮与时间文字重叠

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
| 变更编号 | memory-export-overlap-fix |
| 阶段负责人 | trae-agent |
| 来源类型 | bug |
| 来源引用 | 用户截图 2026-09-14 |
| 上游记录 | plan.md |
| 当前状态 | accepted |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Chosen approach

`.memory-time` 右内边距从 5px 增至 42px(按钮 30px + 12px 间距),时间行整体让位;导出按钮位置与交互不动。备选「按钮下移/悬浮到封面角上」弃:改动更大且改变 #14 既定位置。

## Affected boundaries

- `styles.css` `.memory-time` 一处;`MemoryItem.tsx` 仅注释修正;DESIGN.md/TODO.md 表述纠偏(列表缩略为 4:3 裁切,#7 既有规则)。

## Behavior contract

- 时间行钟点完整可见,与导出按钮水平间距 ≥12px;其余行为不变。

## Data and interface changes

无。

## Validation strategy

浏览器几何校验(rect 对比)+ 截图。

## Rollout implications

纯 CSS,push 即发布,revert 单提交可回滚。

## Policy conflicts and exceptions

无。

## Material alternatives

- 按钮改悬浮在封面右上角内侧:视觉更「小红书」,但属设计变更,不在本 bugfix 范围;如需要另开 change。
