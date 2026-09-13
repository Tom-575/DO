# Plan: AI 对话规划 DO:输入页对话式澄清后出最小行动

status: accepted
owner: ZCode(agent,子代理并行构建,主会话集成验证)
source: 二期立项用户决策(AI 对话规划 do)
risk_level: medium
created_at: 2026-09-13
updated_at: 2026-09-13

## Problem

PRD §5.2 的「理解与澄清」未实现:输入 → 一次性出行动,唯一纠偏是返回重打。一期行动页收敛后修正回路更薄。AI 对话用自然语言补回修正,替代已删除的按钮。

## Desired outcome

输入页对话式:AI 仅当「不同解释会明显改变行动」时问一个简短问题(附建议选项,可自由回复),最多 2 轮;产出仍是单一最小行动 → 行动页三选(不变);DO.thought 仍存用户原话。

## Scope

InputPage.tsx(对话 UI)、lib/ai.ts(多轮 messages 接口 planAction)、lib/mock.ts(对话兜底)、src/types.ts(PlanTurn/PlanReply);DO-PROMPT.md 增补对话契约。**不改**:ActionPage、store 既有 action(仅消费主会话预置的 plannedAction)、RecordPage/MemoriesPage。

## Out of scope

行动页交互变更、完整计划生成、语音输入、流式输出。

# Design: 见 design.md
