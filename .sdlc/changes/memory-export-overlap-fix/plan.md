# Plan: 修复回忆条目导出按钮与时间文字重叠

status: accepted
owner: trae-agent
source: 用户截图反馈 2026-09-14
issue:
pr:
risk_level: low
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | memory-export-overlap-fix |
| 阶段负责人 | trae-agent |
| 来源类型 | bug |
| 来源引用 | 用户截图:导出按钮压住时间行右侧钟点文字 |
| 风险等级 | low |
| 当前状态 | active |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Problem

`.memory-export` 绝对定位 `top:0 right:0`(30×30),`.memory-time` 是 space-between 弹性行,右侧钟点 span 恰好落在按钮正下方,文字被遮挡(截图中「20:4」残缺)。

## Desired outcome

- 时间行整体右缩,钟点完整可见,与导出按钮不再重叠。

## Scope

### In scope

- `styles.css` `.memory-time` 右内边距让出按钮宽度。
- 顺带修正 #18 相关文档/注释中「列表封面原比例」的不准确表述(列表 img 自 #7 起即 4:3 缩略裁切,原比例只在查看器)。

### Out of scope

- 导出按钮位置/交互(保持右上角不变)。

## Constraints

- 纯 CSS 一行 + 文案修正;不动结构与 JS。

## Success criteria

- [x] 截图确认时间完整显示、无重叠。(浏览器验证)

## Open decisions

- [x] 方案 → 时间行让位(按钮位置不动,改动最小)。
