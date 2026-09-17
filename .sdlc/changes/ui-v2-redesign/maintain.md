# Maintain: V2 待决项与已知边界

status: draft
source: ui-v2-redesign 收尾盘点
issue:
pr:
owner: codebuddy-agent
severity: low
detected_at: 2026-09-17
updated_at: 2026-09-17

## Signal and impact

本轮无线上事故。记录的是**新稿与既有已确认决策的三处冲突**：不是 bug，但没有人工裁决就无法视为稳定。

## Diagnosis

1. 行动页出口数量：CONTEXT.md 已确认三选，V2 稿只画两档。
2. 分享卡封面：DESIGN #16 定「原比例不裁切」，V2 稿是满幅海报式。
3. 痕迹分类：稿里是固定分类，而记录页没有打标入口。

## Recovery

三处均按「以新稿为准 + 不删功能 + 不新增交互」处理，并写进 plan.md 的 Open decisions 等人工裁决。

## Root cause

视觉换代必然与既往逐条决策打架；本轮**没有先把三处冲突摆到人工面前就实现**，属流程瑕疵。

## Preventive action

destination: project-knowledge

## Follow-up

- [ ] 人工裁决三处冲突，落到 CONTEXT.md / DESIGN.md
- [ ] 真机走查（满幅摄影、Web Share）