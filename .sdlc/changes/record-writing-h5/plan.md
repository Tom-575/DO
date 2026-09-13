# Plan: 记录撰写:草稿/二次编辑/图片健壮性+对比度修复

status: accepted
owner: ZCode(agent,窗口 A)
source: 二期立项用户决策(记录撰写)
risk_level: low
created_at: 2026-09-13
updated_at: 2026-09-13

## Problem

DESIGN §7.6 记录边界未设计:保存后记录不可修改(updateRecord 零调用)、写一半切走草稿丢失、图片无压缩(大图直存 IndexedDB)、无加载失败态;§7.5 记录页浅色对比度不足。

## Desired outcome

- 草稿:记录页未保存内容自动暂存,重进自动恢复,保存/清空后移除
- 二次编辑:回忆页点记录 → 编辑(文字/图片/关联),关联变更正确联动 DO 状态,保存后再整理可用
- 图片:选图即压缩(长边 1600px),回忆页加载失败显示占位
- 记录页浅色对比度达到可读(§7.5)

## Scope

RecordPage.tsx、MemoriesPage.tsx、store.tsx/types.ts(编辑联动 + 草稿)、lib/storage.ts(草稿 key)、record.css(对比度);不动 InputPage/ActionPage/lib/ai。

## Out of scope

卡片导出(#14)、AI 对话(#15)、图片裁剪排序封面(另立)。
