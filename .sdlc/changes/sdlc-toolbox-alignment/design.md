# Design: SDLC 工具链对齐

status: accepted
owner: codebuddy-agent
source_intent: .sdlc/changes/sdlc-toolbox-alignment/plan.md
issue:
pr:
supersedes: 取代「门禁全文三处复制」的做法；取代 `.zcode/skills` 作为 skill 来源
created_at: 2026-09-19
updated_at: 2026-09-19

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | sdlc-toolbox-alignment |
| 阶段负责人 | tom57 |
| 来源类型 | maintenance |
| 来源引用 | `CLAUDE_SDLC_TODO.md` |
| 上游记录 | plan.md |
| 当前状态 | accepted（2026-09-19 重建：本文件曾被 `add-artifact` 用空模板覆盖，见 build.md） |

## Chosen approach

**按「规则 / 用法 / 事实」三分，各归一处**：

| 内容类型 | 落点 | 理由 |
|---|---|---|
| 强制规则（六阶段、工件非空、提交带 change 名、豁免） | `AGENTS.md` + `CODEBUDDY.md` + `.codebuddy/rules/sdlc-gate/RULE.mdc` 的**铁律 4 条**（逐字同文） | 必须每个运行时都看得见；门禁初衷就是「换运行时也不漏」 |
| 工具用法（gate 词表、命令、每阶段工件、装工具箱、脚本修复留档） | **`.sdlc/RUNBOOK.md`** 唯一落点 | 本项目里工具箱的落点；`Tools/` 被 gitignore，放项目里才不随工具重装丢失 |
| 项目事实（产品 / 技术 / 文档地图 / 仓库边界） | `AGENTS.md` | 与工具无关，稳定 |

skill 发现入口：`.codebuddy/skills/<name>/SKILL.md` 一 skill 一个薄封装，**指向工具箱本体**，并写死「路径不存在 → 按 RUNBOOK 装工具箱」的回落，使指针失效时仍可执行。

同文可校验：铁律段用 `<!-- gate-rules:start -->` / `<!-- gate-rules:end -->` 标注 + 一条 hash 比对命令（**必须归一行尾**）。

## Affected boundaries

- **运行时发现**：不再依赖 `.zcode/`（已删）；CodeBuddy 走 `.codebuddy/skills/`，其它运行时手读工具箱 SKILL.md。
- **版本控制边界**：`.zcode/`（53 文件）出库；工具箱与其修复**不在版本控制内**，靠 RUNBOOK §6 留档。
- **状态口径**：`INDEX.md` 不再外链 gitignored 目录；手写区固定在 `## Active Decisions` 之后（`refresh-index` 的重写范围实测为 `## Current State` → `## Active Decisions`）。
- **不碰**：`.sdlc/archive/` 历史、既有工件正文（只回退一处 status 漂移）、产品代码。

## Behavior contract

1. **开工**：读 `AGENTS.md` 铁律 → `.sdlc/INDEX.md` + `lifecycle.yaml` → `docs/TODO.md` 认领编号；用法查 RUNBOOK。
2. **gate 记录**：`set-gate` 必须传当前阶段的词（RUNBOOK §2）且带 `--approver`，只能在人工确认之后写；「等人工」用 `awaiting-human-review`。
3. **收工**：工件非空 + 提交信息带 change 名 + 三处同文 hash 一致。
4. **裸克隆**：`Tools/` 不存在 → 按 RUNBOOK §1 装工具箱；期间**不得凭记忆复述 skill 内容**；脚本缺失时手工维护状态文件并在报告里注明。
5. **`.zcode` 不再存在**：文档若提到，按「已删除，正文在工具箱本体」处理。

## Data and interface changes

- 新增：`.sdlc/RUNBOOK.md`、`.sdlc/DAILY.md`、`.codebuddy/skills/<15 个新 skill>/SKILL.md`。
- 改写：`AGENTS.md`、`CODEBUDDY.md`、`RULE.mdc`（铁律同文）、`.codebuddy/skills/{ai-sdlc-navigator,code-review}/SKILL.md`（改指向）、`.sdlc/INDEX.md`。
- 删除：`.zcode/`（53 文件，提交 `601ca38`）。
- 工具箱（**不进本项目版本控制**）：`inspect` 的 `FIELDS`、`validate` 的 `shared/` 探测、`add-artifact` 的存在性守卫。

## Validation strategy

机器断言（可复跑）：`inspect` → `Missing: none`；`validate` → `SDLC state is valid`；三处铁律 hash 相同；17 个薄封装目标存在；`git ls-files .zcode` 为空；`add-artifact` 对已存在工件拒绝覆盖。
人工检查：`AGENTS.md` 是否只讲规则与事实；RUNBOOK 是否够一个新 agent 独立按它推进状态。

## Rollout implications

无发布动作（不改产品代码）。生效＝提交进主仓库；工具箱修复靠 `Tools/claude-sdlc` 的本机提交，换机器按 RUNBOOK §1 重装 + §6 重做。

## Policy conflicts and exceptions

- **与「门禁段三处同文」**：保留同文，但只对**铁律 4 条**同文 → 冲突消解（同文仍是硬要求，范围收窄）。
- **与「`.zcode/` 是 claude-sdlc 约定目录」**：该说法不成立（工具箱源码 0 处提 `.zcode`，自带 `.codex-plugin/`）→ 已在 `AGENTS.md` 修正。
- **例外**：工具箱行为项（`refresh-index` 局部重写、`advance` 沿用旧 gate、gate 词表进 SKILL、工件非空校验脚本等）本轮只记录不改语义 → #41。

## Material alternatives

1. **保留三处全文同文**：保险但臃肿，且「用法无处可查」没解 → 弃。
2. **用法写进 `.zcode/shared/`**：将随快照删除且被 gitignore，等于没落点 → 弃。
3. **保留 `.zcode/` 作 VCS 快照（方案 A）**：裸克隆可直接读 skill，但要维护两份一致 → 用户选 B，代价由「薄封装回落 + RUNBOOK 装工具箱三步」兜住。
