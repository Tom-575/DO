# Plan: 记录卡片导出:单张图文卡片存为 PNG

status: accepted
owner: ZCode(agent,窗口 A)
source: 二期立项用户决策(分享只做卡片导出图片 + 高质量卡片)
risk_level: low
created_at: 2026-09-13
updated_at: 2026-09-13

## Problem

一期后置的分享能力:记录只能回看,不能被表达。用户决策:只做「记录 → 单张图文卡片 → 导出图片」,不做多平台与社交分发。

## Desired outcome

回忆页每条记录可一键预览卡片并保存为 PNG;卡片质量达到「无需重新组织即可分享」(PRD §5.5);文案保留原话语气,不做二次 AI 润色。

## Scope

新增 lib/card.ts(导出)、components/RecordCard.tsx(卡片)、card.css;MemoriesPage 增入口;package.json 增 html-to-image 依赖;DESIGN/DO-PROMPT 文档同步。

## Out of scope

多模板(先 1 套)、深色卡片、AI 卡片文案、封面裁剪编辑、直接分享到平台。

# Design: 见 design.md
