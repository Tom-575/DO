# Maintain: interaction-motion-h5 期间的流程与工具缺陷

status: draft
source: 2026-09-16 会话审计 + 两轴 code review
issue:
pr:
owner: codebuddy-agent
severity: medium
detected_at: 2026-09-16
updated_at: 2026-09-16

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号或事件编号 | interaction-motion-h5 / 流程事件 |
| 阶段负责人 | tom57 |
| 来源类型 | feedback（用户审计提问）+ maintenance |
| 来源引用 | 用户 2026-09-16：「当前这些改动是否有按照 SDLC 的流程来走？有没有做 code-review」「为啥不会自动触发 SDLC」「补充一下 sdlc 的流程」 |
| 严重程度 | medium（不影响线上功能，但流程门禁长期空转） |
| 当前状态 | as-built 补录 |
| 创建时间 | 2026-09-16 |
| 更新时间 | 2026-09-16 |

## Signal and impact

用户提问触发的审计发现：**今天整轮（`docs/TODO.md` #23–#32）零 SDLC 工件**，且 `code-review` 从未运行。这不是孤立事件——三期的 #16–#18 已经发生过同样的事，并已作为事故记入 TODO #20。

后果：流程在「记录」与「验证」两环空转，导致 **as-built 文档夹带了没落地的声明**（见 Diagnosis #4），而没有任何机制能发现它。

## Diagnosis

### D1. SDLC 入口对当前运行时不可见（主因，机械性）

- 本项目的 SDLC 技能装在 `.zcode/skills/`（claude-sdlc / zcode 的约定，53 个文件已在版本控制内）；
- CodeBuddy 只发现 `.codebuddy/skills/`（官方文档明写项目级技能目录），而本仓库**没有 `.codebuddy/`**；
- 所以 `use_skill` 的可用列表里没有任何 `ai-sdlc-*`：**不是"忘了用"，是入口不在扫描路径里**。
- 同理，`AGENTS.md` 虽满足「存在且无 `CODEBUDDY.md` ⇒ 自动注入」的条件，但本会话实测**未注入**（证据：`docs/TODO.md` 首句即要求先读 `AGENTS.md`，而本次开工读了 TODO.md 却从未打开 AGENTS.md）。

### D2. `AGENTS.md` 自身不足以形成门禁

1. SDLC 要求埋在 13 条 bullet 的第 7 条，混在产品定位/技术形态/文档地图之间，全文没有「变更开始前必须先 X」的门禁措辞；
2. 唯一入口指向另一个运行时的目录，**没有 fallback 句**（「若扫不到就手动读 SKILL.md 照做」）；
3. 没有利用「总是生效」的规则类型，文件级注入没有优先级语义。

### D3. `Tools/` 被 gitignore，流程脚本不可移植

`.gitignore:3` 忽略 `Tools/`，而六阶段唯一的机器化入口是 `Tools/claude-sdlc/scripts/update_sdlc_state.py`。**换一台机器这些指令全部失效**，文档却按"脚本一定在"写。

### D4. as-built 记录会夹带未落地的声明（系统性风险）

两轴评审的 Spec 轴核对出 3 处：DESIGN/TODO 里写「Tab 图标 1.14 倍」「push 页进入 = x 30% + 透明度」「`SPRING_REBOUND` 用于大标题回摆」，**代码里都不成立**（分别被覆盖、淡入失效、参数根本不存在）。

根因不是笔误，而是**同一个人既写记录又判验收**——记录写的是"我打算/我记得做了"，而没有任何独立核对。这正是 `#19`（三个空 `test.md` 被放行）的同一个病根。

### D5. `validate_sdlc_state.py` 在本项目恒红，门禁空转

```
$ python Tools/claude-sdlc/scripts/validate_sdlc_state.py .
missing: shared\lifecycle.md
missing: shared\risk-model.md
missing: shared\artifact-contracts.md
missing: shared\evidence-policy.md
```

脚本第 17–20 行硬要求 `<项目根>/shared/*.md`；而本项目的 `shared/` 装在 `.zcode/shared/`。对插件本体（`Tools/claude-sdlc/`，其 `shared/` 就在根上）跑**通过**，对项目跑**失败**——即**布局约定不一致**，且无人处理。

旁证：`.sdlc/INDEX.md` 的 Entry Points 被手工改过一半——**标签**仍写 `[../shared/...]`、**URL** 已改 `[../.zcode/shared/...]`。装的时候就发现对不上。

### D6. gate 的 approver 语义与配置不一致

`sdlc.config.yaml` 声明 `human_gates.require_approver: true`，但已归档的 change 里 `gate_approved_by: trae-agent(Actions run 15 success)`——**记录由 agent 自己填**。与 `shared/lifecycle.md`「对话中的口头确认不算状态变更」存在张力。

### D7. 两个脚本的工件字段名不是一套（工具缺陷，本次已复现）

`inspect_sdlc_state.py:7-14` 的 `FIELDS` 期望 `intent / design / change / evidence / release / learning`；而 `update_sdlc_state.py` 全程写入与校验的是 `plan / design / build / test / deploy / maintain`（它自带的测试 `tests/test_lifecycle_tools.py:47` 写的是 `plan:`，`advance` 的缺失校验也按 `plan` 判）。

**后果：任何活跃 change 都会被判 `Missing: intent` → `Next: repair missing artifacts`。** 而 `inspect_sdlc_state.py` 正是 navigator 第 1 步钦定的工具——每个 change 一开工就会被指向一个根本不存在的工件。

复现（本 change，`stage: plan`，`plan.md` 存在且非空）：

```
$ python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .
Change: interaction-motion-h5
Stage: plan
Gate: awaiting-human-review
Missing: intent
Next: repair missing artifacts
```

插件自测没有覆盖这一行（`test_multiple_active_changes` 只断言 `Change: one/two` 出现在输出里），所以偏差一直没被发现。

## Recovery

本轮已完成：

1. 补建本 change 的六个工件（plan / design / build / test / deploy / maintain），并把评审结论落进 test.md；
2. 修掉评审确认的 4 项真问题（Tab 图标覆盖、push 屏淡入失效、§5.1 规则过宽、两处过期引用）+ 1 项小问题（`App.tsx` 依赖数组）；
3. 补齐运行时接线：`CODEBUDDY.md`、`.codebuddy/rules/sdlc-gate/RULE.mdc`（`alwaysApply`）、`.codebuddy/skills/{ai-sdlc-navigator,code-review}/SKILL.md`；`AGENTS.md` 增加门禁段与按运行时分流的入口表；`.sdlc/INDEX.md` 的 Entry Points 挂上运行时入口。

## Root cause

**流程依赖"记得走"，而没有任何机制在运行时会自动把门禁推到上下文里。** 具体是三处断链叠加：

1. 入口装在一个运行时看得见、另一个看不见的目录（D1）；
2. 权威文档 `AGENTS.md` 没有门禁措辞、没有 fallback（D2）；
3. 即使门禁被读到，也没有独立验证去发现"记录与实现不符"（D4）——三处断链都在，且 `validate_sdlc_state.py` 这条唯一的机械校验长期恒红（D5），所以没人被提醒。

## Preventive action

destination: skill / hard-control / project-knowledge / new-intent

| # | 防复发 | 去向 | 状态 |
|---|---|---|---|
| P1 | 门禁进上下文的机制（`alwaysApply` 规则 + 运行时会话语义入口 + 按运行时分流的入口表） | **hard-control**（已落地：`.codebuddy/`、`CODEBUDDY.md`、`AGENTS.md`） | 本次完成 |
| P2 | 任何运行时的 fallback 句：「扫不到 `.zcode/skills/` 就手动读 SKILL.md 照做」 | **project-knowledge**（已写入三处门禁文本） | 本次完成 |
| P3 | `Tools/` 被 gitignore ⇒ 流程脚本不可移植 | **skill / 工具侧**：脚本路径应由配置解析，缺脚本时手工维护并注明 | 待办（并入 TODO #20） |
| P4 | as-built 记录不得由作者单独认证：Spec 轴必须核对「声明 ↔ 实现」 | **skill**（已写入 `.codebuddy/skills/code-review/SKILL.md`：把记录当待验证声明） | 本次完成 |
| P5 | `validate_sdlc_state.py` 的 `shared/` 路径约定 | **工具侧二选一**：① 项目根放 `shared/`（拷贝/junction）；② `sdlc.config.yaml` 增 `artifact_storage.shared_dir` 并让 init/validate/INDEX 链接都从配置生成（推荐） | **待决策** |
| P6 | gate 的 approver 语义（谁能记 gate） | **new-intent / ADR**：明确「agent 可否代记 gate」，或改为必须人工确认后由 agent 写入 | **待决策** |
| P7 | 真机走查的证据采集（截图/自动化）作为 test 的常规证据 | **skill**：把走查清单与取证方式写进 test 阶段做法 | 待办（并入 TODO #19/#21） |
| P8 | 两个脚本的工件字段名统一（或 `inspect` 直接读 `lifecycle.yaml` 里该阶段的路径字段），并给它补一条断言 `Missing: none` 的测试 | **skill / 工具侧** | **待决策**（这是 navigator 第一步，错了会误导每一次开工） |

## Follow-up

- [ ] P5 定工具侧修法（关掉恒红的校验，否则门禁永远只是纸面）
- [ ] P8 修 `inspect_sdlc_state.py` 的字段名（不修则每次开工都收到错误的「repair missing artifacts」指令）
- [ ] P6 定 approver 语义，并回填已归档 change 的说明
- [ ] P3 / P7 并入 `docs/TODO.md` #20 与 #19/#21
- [ ] 真机走查后回来更新 test.md 的 Untested scope 与 Verdict
