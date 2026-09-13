# Plan: 行动页收敛为三选:马上做/等等/不想做了

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
| 变更编号 | action-page-three-choices |
| 阶段负责人 | ZCode(agent) |
| 来源类型 | feature |
| 来源引用 | 用户原话:「选项太多了，留3个就够了，马上做，等等，不想做了。」 |
| 风险等级 | low |
| 当前状态 | intent-accepted(用户对话中直接下达) |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## Problem

行动页有 7 个动作(换一个 / 改念头 / 现在开始 / 先放着 / 意向三选),用户反馈选项过多,与「开始优先、低压力」原则冲突。CONTEXT.md「行动意向」原为暂定方案,其最终文案本就是未决项,本次由用户直接收敛。

## Desired outcome

行动页只剩三个动作:马上做 / 等等 / 不想做了;DO 三态生命周期(待定/待记录/已记录)与 24h 回收机制保持不变。

## Scope

- 重写 `prototypes/first-loop/src/pages/ActionPage.tsx` 底部动作区
- 清理 `action.css` 死规则
- 同步文档:DESIGN.md(§2.1/§2.2/§8/§9)、CONTEXT.md(行动意向)、TODO.md(#5)
- 不动:store 数据模型、回收规则、备份序列化

## Out of scope

- 回忆页/记录页的任何行为
- 「换一个 / 改念头」的替代交互(收敛的既定代价,试用后再评估)
