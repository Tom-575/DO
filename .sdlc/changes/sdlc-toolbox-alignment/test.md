# Test: SDLC 工具链对齐

status: accepted
candidate_revision: 主仓库 `601ca38` + 工作树；工具箱本地提交 `3a8332a` 与 add-artifact 守卫
source_intent: plan.md
source_design: design.md
source_change: sdlc-toolbox-alignment
issue:
pr:
verifier: codebuddy-agent（本机实跑工具箱脚本、hash 比对与守卫自测）
created_at: 2026-09-19
updated_at: 2026-09-19

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | sdlc-toolbox-alignment |
| 阶段负责人 | tom57 |
| 被验证版本 | 主仓库 `601ca38` + 工作树；`Tools/claude-sdlc`（本机提交） |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | codebuddy-agent |
| 当前状态 | accepted（gate 待人工确认；本文件曾被子工具清空，已按事实重建） |

## 验证方法

跑工具箱自带的两个脚本（`inspect` / `validate`），加三处铁律 hash 比对、一组目录／文件计数，以及 `add-artifact` 守卫自测。**所有断言都是可复跑的命令**。

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| `inspect` 给出正确指令 | `inspect_sdlc_state.py .` → 三个 change 全部 `Missing: none`（修复前对正确的 lifecycle 报 `Missing: learning` + `Next: repair missing artifacts`） | 通过 |
| `validate` 不再恒红 | `validate_sdlc_state.py .` → `SDLC state is valid`（本项目首次；修复前恒红于 `shared/` 路径） | 通过 |
| `validate` 真的会抓错 | 首次运行即报出历史工件的假断链 `.sdlc/changes/record-card-export-h5/design.md: broken link`（已修） | 通过（反证有效） |
| 三处门禁铁律逐字同文 | 三处 `gate-rules` 块归一 EOL 后 SHA-256 相同：`3a16b4469c0c` | 通过 |
| 同文校验命令可复跑 | `.sdlc/RUNBOOK.md` §7（含「必须归一行尾」说明；首版因 EOL 误报已修） | 通过 |
| 当前 IDE 可发现全部 skill | `.codebuddy/skills/` = **17 个目录**，与工具箱 17 个一致；15 个为本次新建 | 通过 |
| 薄封装指向正确且有回落 | 抽查 `.codebuddy/skills/tdd/SKILL.md`：含上游 `description`，正文指向 `Tools/claude-sdlc/skills/tdd/SKILL.md` 并写明回落步骤 | 通过 |
| 2 个手写封装改指本体 | navigator 的阶段跳转表 6 行与 code-review 的源文件路径全部改指 `Tools/claude-sdlc/skills/...` | 通过 |
| 工具用法有唯一落点 | `.sdlc/RUNBOOK.md` 含 §1 装工具箱 / §2 gate 词表（含 `awaiting-human-review`）/ §3 命令与已知现象 / §4 工件表 / §5 非空铁律 / §6 修复留档 / §7 同文校验 / §8 DAILY | 通过 |
| 日常日志落地（TODO #21） | `.sdlc/DAILY.md` 存在：铁律 + 2026-09-19 记录 + 模板 | 通过 |
| `INDEX.md` 不再外链已删目录 | Entry Points 改指 RUNBOOK §1；手写区固定在 `## Active Decisions` 之后，`refresh-index` 后仍幸存（实测） | 通过 |
| 过期项已修 | `AGENTS.md`：原型地址补 `/DO/`、删 MVP 时代「下一步」、「W0–W4」→「一期–五期」；`.zcode` 表述纠正 | 通过 |
| 工具箱 56 项已提交 | `git -C Tools/claude-sdlc log --oneline` → `3a8332a` / `ebcb611` | 通过 |
| **`.zcode/` 已从版本控制移除** | `git rm -r .zcode` → `git ls-files .zcode` = 0 项、目录不存在、提交 `601ca38`（53 files，−2091）；删除后 `validate` 仍绿（`shared/` 探测自动落到工具箱本体） | 通过（第四次尝试经人工授权完成） |
| **`add-artifact` 不再覆盖已有工件** | 守卫自测：对已存在的 `test.md` 重跑 → `refusing to overwrite`，文件字节数 800 → 800 不变 | 通过 |
| 文件体量 | `AGENTS.md` 52 行（原 46，成分为约定+事实）、`CODEBUDDY.md` 33（原 34）、`RULE.mdc` 24（原 28） | 通过（见 build.md 偏差 1） |

## Required checks

| Check | Source or command | Result |
|---|---|---|
| 状态检查 | `inspect_sdlc_state.py .` | 通过 |
| 状态校验 | `validate_sdlc_state.py .` | 通过 |
| 同文 hash | PowerShell/.NET SHA-256（归一行尾） | 通过 |
| 工具箱工作区 | `git -C Tools/claude-sdlc status --porcelain` | 通过（守卫已提交） |

## 证据索引

上面每条断言的可复核落点（全在仓库内，裸克隆也能打开；**刻意不链 `Tools/`**——它被 gitignore，裸克隆下会变成断链）：

| 断言组 | 落点 |
|---|---|
| 工具箱三处修复的清单与复现命令 | [RUNBOOK.md §6](../../RUNBOOK.md) |
| `inspect` / `validate` / 非空校验的复跑结果（2026-09-20） | [CLAUDE_SDLC_TODO.md §E](../../../CLAUDE_SDLC_TODO.md) |
| 铁律三处同文的 hash 校验命令 | [RUNBOOK.md §7](../../RUNBOOK.md) |
| 本轮过程记录（含并行会话与两处错误知识修正） | [DAILY.md](../../DAILY.md) |
| 门禁铁律正文（三处同文的源） | [AGENTS.md](../../../AGENTS.md) |

## Code review（两轴）：不适用（窄豁免）

**豁免理由**：本 change 的全部改动都在**流程与工具层**，`prototypes/first-loop/` 下**没有任何产品代码改动**。
核实命令（输出为空即成立）：

```bash
git log --name-only --pretty=format: 192c8a4..HEAD | Sort-Object -Unique | Where-Object { $_ -like 'prototypes*' }
```

两轴评审的 Standards 轴针对产品代码的明文契约（`DESIGN §5` 动效规范等）、Spec 轴针对产品行为规格，
对本 change 都不成立。

**改动清单**（本轮实改，逐项对应上面的验收表）：

- `.codebuddy/skills/`：17 个薄封装（15 个新建 + `navigator` / `code-review` 改指工具箱本体）。
- `.sdlc/RUNBOOK.md`（新建）、`.sdlc/DAILY.md`（新建）、`.sdlc/templates/daily.md`、`.sdlc/INDEX.md` 手写区。
- `.sdlc/learnings/README.md`、`.sdlc/decisions/README.md`（新建：空目录在 Git 里不存在）。
- `.zcode/` 整目录移除（53 文件，−2091 行）。
- `AGENTS.md` / `CODEBUDDY.md` / `.codebuddy/rules/sdlc-gate/RULE.mdc`：门禁铁律段拆分与三处同文。
- `Tools/claude-sdlc/`（**被 gitignore，不进主仓库**）：`inspect` 字段名对齐、`validate` 的 `shared/` 候选探测、
  `add-artifact` 存在性守卫、`refresh-index` 标记内重写、`advance` 的 gate 语义、6 个阶段 SKILL 补 gate 值。

**替代验证**：本 change 靠**实跑工具箱脚本 + 三处 hash 比对 + 守卫自测**（见「Required checks」与验收表），
这比代码评审更贴近它真正的失效模式（命令不生效、路径探测错、文档三处漂移）。
**若日后本 change 引入产品代码，本节失效**，必须按 `RUNBOOK.md` §9 补两轴评审。

## Untested scope

- **裸克隆下的薄封装回落**：`Tools/` 被 gitignore，裸克隆后 `.codebuddy/skills/*` 的指向失效——回落说明与 RUNBOOK §1 是纸面路径，未在缺工具箱的机器上实测。
- **工具箱行为项**（`refresh-index` 局部重写、`advance` 不沿用旧 gate、gate 词表写进 SKILL、工件非空校验脚本等）本轮只记录不改语义 → `docs/TODO.md` #41。
- **其它运行时**（claude-sdlc 原生 / zcode）对薄封装与 RUNBOOK 的读取未验（本机只有 CodeBuddy）。
- **并行会话的在建改动**（change `v2-device-feedback`：4 个源码文件 + `DESIGN.md` + `ui-v2-redesign/{build,maintain}.md` + `INDEX.md`/`lifecycle.yaml`/`DAILY.md` 的共享写入）**不在本文件验证范围内**，其提交由该会话或最后收尾者完成。

## Residual risk

| 风险 | 说明 | 处置 |
|---|---|---|
| 工具箱修复只在本机 | 该克隆无 remote，无法 push 上游 | RUNBOOK §6 已留档；换机器按 §1 重装 + §6 重做 |
| 双会话写同一批文件 | `lifecycle.yaml` / `INDEX.md` / `DAILY.md` 被两方先后写入 | 已按内容边界隔离提交；**建议串行化窗口** |
| 同文靠纪律 | hash 校验是命令，不是提交钩子 | 列入 #41（可选做成 pre-commit） |
| 工件曾被工具清空 | `add-artifact` 无守卫（现已修） | 三份工件按事实重建；#41 记录该缺陷 |

## Verdict

`pass`（范围：工具箱三处脚本修复、文档三分与同文校验、skill 发现入口补全、RUNBOOK/DAILY 落地、`.zcode` 移除、四处顺带修复；除外的项见 Untested scope）
