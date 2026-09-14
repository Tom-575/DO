# Plan: 回忆列表只展示首图+张数角标,全部图片在查看器内翻看

status: accepted
owner: trae-agent
source: 用户反馈 2026-09-14:#17 上线后多图在列表纵向堆叠过重,应类小红书 feed 只露封面
issue:
pr:
risk_level: low
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | memory-cover-feed-h5 |
| 阶段负责人 | trae-agent |
| 来源类型 | feature(体验收敛) |
| 来源引用 | 用户对话 2026-09-14 |
| 风险等级 | low |
| 当前状态 | active |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Problem

#17 保留回忆列表纵向堆叠全部图片,多图条目把回忆流拉得过长,与小红书式「feed 露封面、点开翻看」的预期不符。

## Desired outcome

- 回忆列表每条记录只渲染首图(原比例封面,延续 #16 不裁切语义)。
- 多图条目右下角标显示总张数,提示「还有更多」。
- 点封面仍进全屏查看器横滑全部;点文字仍进编辑;导出卡片不变。

## Scope

### In scope

- `src/components/MemoryItem.tsx`:只渲染首图 + 张数角标(Images 图标)。
- `src/pages/memories.css`:角标样式;`.memory-images` 加 relative 锚定。

### Out of scope

- 查看器、记录编辑页、卡片导出逻辑(均不改动)。
- 封面选择/排序(仍开放)。

## Constraints

- 零新依赖(Phosphor `Images` 图标已有);不觸 store 与数据契约。

## Success criteria

- [x] 多图记录列表只有 1 个 img + 角标总数;点封面查看器 1/N→N/N 翻看。(浏览器验证)
- [x] 点文字区仍直接进编辑。(浏览器验证)

## Open decisions

- [x] 封面是否裁切 → 不裁切,原比例(延续 #16)。
