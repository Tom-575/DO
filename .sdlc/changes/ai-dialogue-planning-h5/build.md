# Build: AI 对话规划 DO:输入页对话式澄清后出最小行动

status: accepted
source_intent: plan.md
source_design: design.md
revision: working tree
owner: ZCode(agent,子代理 B 并行构建,主会话集成)
created_at: 2026-09-13
updated_at: 2026-09-13

## Implementation summary

- `lib/ai.ts`:`planAction(history, settings)` 多轮 messages 接口;system 契约(JSON 输出、仅歧义改变行动才提问、≤2 轮后强制行动);解析失败/无 key/网络失败回落 mock
- `lib/mock.ts`:`planActionMock`(模糊判定 → 按域提问;已有提问历史必出行动)
- `pages/InputPage.tsx`:对话流 UI(气泡/选项 chips/思考态/自动滚动;返回=放弃并作废在途请求);行动落定 → setPlannedAction + setIdea(原话) → 行动页
- `store`:plannedAction 消费(主会话预置);ActionPage 未改动,三选不变
- `pages/input.css`(新):仅用既有 token
- 子代理与主会话按文件所有权并行,无编辑冲突;主会话集成后统一 tsc + 实测

## Changed areas

`lib/ai.ts`、`lib/mock.ts`、`pages/InputPage.tsx`、`pages/input.css`(新)、`types.ts`(PlanTurn/PlanReply)

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | npx tsc --noEmit | pass(子代理与主会话各验 + 合并复验) |

## Known limitations

真实 AI 的提问质量取决于模型;红线在 adapter 层强制,不依赖模型自觉。
