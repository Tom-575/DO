# Design: AI 对话规划 DO

status: accepted
owner: ZCode(agent,子代理构建)
source_intent: plan.md
created_at: 2026-09-13
updated_at: 2026-09-13

## Chosen approach

1. **契约**:新增 `planAction(history: PlanTurn[], settings): Promise<PlanReply>`;`PlanTurn = {role:'user'|'assistant'; text:string}`;`PlanReply = {kind:'question'; text; options?: string[]} | {kind:'action'; action: DOAction}`。OpenAI 兼容接口多轮 messages:system 取 DO-PROMPT 对话契约(要求 JSON 输出,question 仅当歧义改变行动;≤2 轮后必须 action),解析失败或超时回落 mock。
2. **硬约束(红线)**:assistant 提问总数 ≤2(第 3 次调用 system 里强制「直接给行动」);一次只给一个最小行动;不生成计划;回复短。
3. **UI**:InputPage 变对话流——用户首条即原话;assistant 气泡(question 时附建议选项 chips,点选即作为回复发送,也可输入框自由回复);kind=action 时 dispatch setPlannedAction(action) + setIdea(原话) 并切到 action 页。生成中气泡「想一下…」。返回箭头 = 放弃对话清空状态。
4. **store**:主会话预置 `plannedAction: DOAction | null` + `setPlannedAction`;ActionPage 挂载时有 plannedAction 直接采用并清除,无则走既有 generateAction 兜底。DO.thought 一律用户原话。
5. **mock**:关键词规则——首句含「学/拍/做/运动」等但对象模糊 → question(2 个 options);或长度 <6 字 → question;否则直接 action;第 2 轮必返回 action。

## Alternatives considered

- 对话放行动页:与三选冲突,输入页即对话更自然,选定。
- 流式输出:原型不需要,后置。

## Validation strategy

mock 路径实测:模糊输入出 question → 点选项 → 出 action → 行动页三选;清晰输入直出 action;超过 2 轮强制 action;详见 test.md。
