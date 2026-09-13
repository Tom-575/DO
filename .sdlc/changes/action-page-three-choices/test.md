# Test: 行动页收敛为三选:马上做/等等/不想做了

status: accepted
candidate_revision: working tree @ df2be1b
source_intent: plan.md
source_design: design.md
source_change: build.md
issue:
pr:
verifier: ZCode(agent),浏览器实测
created_at: 2026-09-13
updated_at: 2026-09-13

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | action-page-three-choices |
| 阶段负责人 | ZCode(agent) |
| 被验证版本 | working tree @ df2be1b(HMR 生效) |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | ZCode(agent,应用内浏览器) |
| 当前状态 | evidence-passed |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| 行动页只有 马上做/等等/不想做了 三个动作 | DOM 快照:仅三按钮,无 换一个/改念头/意向三选 | pass |
| 等等 → DO 待定且列表可见 | 回今天页,测试 DO 出现在「最近的 DO」列表 | pass |
| 不想做了 → DO 沉入回收区 | DO 从可见行消失,展开区「放了超过一天」分组出现该行 | pass |
| 马上做 → DO 待记录回到列表顶部 | 从回收行重进再选马上做,DO 回到可见列表首位 | pass |
| 既有数据与文档一致 | DESIGN/CONTEXT/TODO 同步;tsc 通过 | pass |

## Required checks

| Check | Source or command | Result | Link |
|---|---|---|---|
| 类型检查 | npx tsc --noEmit | pass | build.md |

## Change-specific checks

测试用临时 DO 走完三路径后已从 IndexedDB 清理(4→3 条),用户真实数据(去洗个澡吧)未受影响。

## Untested scope

真实 AI 生成路径(无 key 走 mock 兜底,与本次改动无关)。

## Residual risk

低。落库映射复用既有机制,仅 UI 收敛。

## Verdict

`pass`
