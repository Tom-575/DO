# Build: 行动页收敛为三选:马上做/等等/不想做了

status: accepted
source_intent: plan.md
source_design: design.md
issue:
pr:
revision: working-tree(未提交,基于 df2be1b)
owner: ZCode(agent)
created_at: 2026-09-13
updated_at: 2026-09-13

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | action-page-three-choices |
| 阶段负责人 | ZCode(agent) |
| 来源类型 | feature |
| 来源引用 | 用户对话指令 |
| 上游记录 | plan.md / design.md |
| 代码版本 | working tree @ df2be1b |
| PR | 无(本地原型) |
| 当前状态 | candidate-ready |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## Implementation summary

重写 ActionPage:底部动作区收敛为 马上做/等等/不想做了,三选经共用 `commit(choice)` 落库;移除 换一个/改念头/意向三选 及其状态与生成令牌的多路调用(令牌保留兜底 StrictMode 双挂载)。

## Changed areas

- `prototypes/first-loop/src/pages/ActionPage.tsx`(重写底部动作区与落库逻辑)
- `prototypes/first-loop/src/pages/action.css`(移除 .intent-row/.action-tweaks/.idea-edit*,新增 .quiet-action)
- `prototypes/first-loop/src/store/types.ts`(addDO 注释修正,移除对已删行为的描述)
- 文档:DESIGN.md §2.1/§2.2/§8/§9、CONTEXT.md 行动意向与已确认边界、TODO.md #5

## Tests changed

无自动化测试;验证走浏览器实测(见 test.md)。

## Material deviations

无。移除「换一个 / 改念头」为用户诉求的直接推论,已记录于 DESIGN.md §9。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | npx tsc --noEmit | pass |

## Known limitations

- 对建议的一步不满意时,只能返回输入页重写(收敛代价,DESIGN.md §9 已记录)。
