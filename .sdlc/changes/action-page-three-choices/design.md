# Design: 行动页收敛为三选:马上做/等等/不想做了

status: accepted
owner: ZCode(agent)
source_intent: plan.md
issue:
pr:
supersedes:
created_at: 2026-09-13
updated_at: 2026-09-13

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | action-page-three-choices |
| 阶段负责人 | ZCode(agent) |
| 来源类型 | feature |
| 来源引用 | 用户对话指令 |
| 上游记录 | plan.md |
| 当前状态 | design-accepted |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## Chosen approach

三选直接映射既有 DO 生命周期与意向字段,不新增状态:

| 按钮 | status | intent | parkedAt |
|---|---|---|---|
| 马上做 | 待记录 | 愿意去做 | 不设 |
| 等等 | 待定 | 暂不决定 | 刷新为 now(24h 回收重新计起) |
| 不想做了 | 待定 | 不想做了 | 回拨 now − PENDING_RECYCLE_MS − 60s(借回收规则自然沉入历史展开区) |

意向由所选动作直接推导,页面不再单独收集;`DOIntent` 数据模型三值保持不变(backup.ts 序列化兼容)。按钮层级:马上做=primary、等等=secondary、不想做了=新增静默档 `.quiet-action`。返回箭头保留(导航,不算选项)。

## Alternatives considered

- 保留「换一个 / 改念头」:与用户收敛诉求相悖,放弃。
- 为「放弃」新增独立状态:违背 CONTEXT.md 三态模型,借 parkedAt 回拨复用回收规则即可。

## Validation strategy

应用内浏览器实测三条数据路径 + 文档走查;`tsc --noEmit` 静态检查。
