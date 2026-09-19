# Maintain: V2 上线后的信号、裁决与学习

status: active
source: ui-v2-redesign 上线（2026-09-17）后的收尾盘点
issue:
pr:
owner: codebuddy-agent
severity: medium
detected_at: 2026-09-17
updated_at: 2026-09-19

## Signal and impact

| 信号 | 结论 | 证据 / 去向 |
|---|---|---|
| 三处「新稿 vs 旧决策」冲突（行动页出口、分享卡封面、痕迹分类） | **已由人工裁决**：保留三选且不复刻「换一个建议」；封面不裁切；去掉筛选 | [plan.md](plan.md) 的 Open decisions（四条全 `[x]`） |
| 线上冒烟（产物哈希与本地构建一致） | 发布成功，无回归 | [deploy.md](deploy.md) 的 Deployment result |
| **真机反馈：第一步页返回卡死（阻断）**；今天↔痕迹横滑手势失效；念头卡示例 chip 需调整 | 真机上确有阻断级问题——**V2 上线时没做真机走查**，是我的验证缺口 | 由并行 change 处理：[../v2-device-feedback/plan.md](../v2-device-feedback/plan.md)（含 [test.md](test.md) 的复现证据） |
| `validate_sdlc_state.py` 在本项目恒红、`inspect` 给出错误指令 | 工具缺陷，已在本机修复（`inspect` / `validate` / `add-artifact` 守卫） | [../sdlc-toolbox-alignment/build.md](../sdlc-toolbox-alignment/build.md) |

## Diagnosis

1. **三处冲突**：视觉换代必然与既往逐条决策打架。当时的根因不是"没想清楚"，而是**顺序错了**。
2. **真机阻断**：桌面 Chromium 430×932 的闭环全绿，但真机上手立刻撞到返回卡死——说明"桌面走查通过"不能替代真机走查，尤其在**容器变换 / 手势**这类平台相关路径上。

## Recovery

- 三处冲突按「以新稿为准 + 不删功能 + 不新增交互」处理，并**等人工裁决后回写** `docs/design/DESIGN.md` §2/§3/§4 与 `docs/TODO.md`。
- 真机阻断由 [../v2-device-feedback/plan.md](../v2-device-feedback/plan.md) 接住（该 change 已建四件套）。

## Root cause

**流程瑕疵（已记入学习）**：冲突清单是"实现完才摆到人工面前"，而正确做法是**先列冲突、等裁决、再动手**——否则人工面对的是既成事实，只能"追认"。

## Preventive action

destination: project-knowledge

1. 视觉/交互换代类变更，**先出「与既有决策冲突清单」再实现**（已落 `.sdlc/INDEX.md` 的 Recent Learnings）。
2. **发布前真机走查列为 gate 条件**：桌面走查通过不等于可发布；本次的阻断 bug 恰好落在容器变换/手势路径上，必须真机验。

## Follow-up

- [x] 三处冲突人工裁决并回写（2026-09-17）
- [x] 部署放行与线上冒烟（2026-09-17）
- [ ] 真机走查结果回填本文件：等 [../v2-device-feedback/plan.md](../v2-device-feedback/plan.md) 收工后补一行「真机闭环通过 / 仍有问题」
- [ ] 「发布前真机走查」写进 `.sdlc/RUNBOOK.md` 的门禁条件（当前只在本文档与 INDEX 学习里）
