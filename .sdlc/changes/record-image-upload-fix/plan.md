# Plan: 修复记录页图片上传静默失败

status: accepted
owner: ZCode(agent)
source: user-conversation
issue:
pr:
risk_level: low
created_at: 2026-09-13
updated_at: 2026-09-13

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | record-image-upload-fix |
| 阶段负责人 | ZCode(agent) |
| 来源类型 | bug |
| 来源引用 | 用户原话:「为什么记录上传不了图片」→ 诊断;「还是上传不了图片」→ 修复 |
| 风险等级 | low |
| 当前状态 | intent-accepted(修复即用户诉求) |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## Problem

记录页选择图片后无任何反应(无预览、无报错)。根因:`RecordPage.addImages` 把 `Array.from(files)` 延迟到 `setImages` 更新器内执行,而 onChange 处理器随后执行 `event.target.value = ''` 清空了实时 FileList——更新器运行时拿到空数组,图片静默消失。浏览器环境无关(应用内浏览器与普通浏览器同样触发)。

## Desired outcome

选图后预览立即出现,计数正确;保存后图片 Blob 经 IndexedDB 持久化,刷新后完整还原。

## Scope

- `prototypes/first-loop/src/pages/RecordPage.tsx` 的 `addImages`:处理器内同步快照 FileList
- 回归验证:注入 → 预览 → 保存 → 刷新 → 渲染全链路

## Out of scope

- 图片压缩、裁剪、加载失败态(DESIGN.md §7 第 6 条另立 change)
