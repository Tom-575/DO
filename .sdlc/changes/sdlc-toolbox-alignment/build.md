# Build: SDLC 工具链对齐

status: accepted
source_intent: plan.md
source_design: design.md
issue:
pr:
revision: 9803f28
owner: codebuddy-agent
created_at: 2026-09-19
updated_at: 2026-09-19

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | sdlc-toolbox-alignment |
| 阶段负责人 | tom57 |
| 来源类型 | maintenance |
| 来源引用 | `CLAUDE_SDLC_TODO.md` |
| 上游记录 | plan.md / design.md |
| 代码版本 | 主仓库 `9803f28`（本 change 的文档/工具链收口）；工具箱本地提交 `ebcb611` → `3a8332a` → `0df0aac` → `dbd495d` → `6a7a512` → `24b02bd`（该克隆无 remote，不进主仓库） |
| 当前状态 | candidate（2026-09-19 重建：本文件曾被 `add-artifact` 用空模板覆盖） |

## Implementation summary

**A. 工具箱（`Tools/claude-sdlc/`，独立 git，被 gitignore）**

- `ebcb611`：提交 **56 项**未提交改动——阶段工件改名收尾（`intent→plan` / `change→build` / `evidence→test` / `release→deploy` / `learning→maintain`）＋ 入库 10 个工程 primitive skill 与 `ENGINEERING-PRIMITIVES.md`；同步 `shared/`、`scripts/`、`templates/`、`examples/`、CI。71 files，+2304/−192。
- `3a8332a`：修 `inspect_sdlc_state.py` 的 `FIELDS`（旧名 → `plan/design/build/test/deploy/maintain`）；修 `validate_sdlc_state.py` 不再硬编码 `<root>/shared/*.md`，改为候选探测（项目根 → `.zcode/shared` → 工具箱本体），并加 `display_path()`。
- **新增守卫**：`add-artifact` 加存在性检查——绝不用模板覆盖已存在的工件。**本轮就是踩了这个坑**：`add-artifact` 把我已写好的 design/build/test 清成了空模板（三文件同时回到 `status: draft`），故三份工件已按事实重建。

**B. 本项目**

- `.codebuddy/skills/`：新建 **15 个**薄封装（6 个阶段技能 + `codebase-design`/`diagnosing-bugs`/`domain-modeling`/`implement`/`improve-codebase-architecture`/`prototype`/`research`/`tdd`/`triage`），共 17 个（与工具箱 skill 数一致）；2 个手写封装改指工具箱本体并补回落说明。
- `.sdlc/RUNBOOK.md`（新增）：装工具箱三步 / gate 词表（含「等人工」用 `awaiting-human-review`）/ 命令与两个已知现象（`refresh-index` 的重写范围、`advance` 沿用旧 gate）/ 每阶段工件与字段名历史 / 工件非空铁律 / 本机修复留档 / 同文校验 / DAILY 指引。
- `.sdlc/DAILY.md`（新增）：铁律 + 2026-09-19 两轮记录 + 模板（TODO #21 落地）。
- `AGENTS.md`：只留门禁铁律 + 运行时分流 + 项目事实；修 3 处过期（原型地址补 `/DO/`、删 MVP 时代的「下一步」、「W0–W4」→「一期–五期」）；纠正「`.zcode/` 是 claude-sdlc 约定目录」的表述。
- `CODEBUDDY.md` / `RULE.mdc`：同文块 + 各自特有内容（保留 alwaysApply）。
- `.sdlc/INDEX.md`：Entry Points 不再外链已删目录；手写区 `## Change Artifacts` 移到 `## Active Decisions` 之后（实测被 `refresh-index` 抹过两次）；补 2026-09-19 学习并标注旧的「两个工具缺陷（待修）」已修。
- 删除 `.zcode/`（提交 `601ca38`，53 files，−2091）；删除后 `validate` 仍绿。
- 顺带修：`.sdlc/changes/record-card-export-h5/design.md` 的假断链；`memory-export-overlap-fix/{plan,build}.md` 的 `status` 漂移回退 `accepted`。

## Changed areas

主仓库：`AGENTS.md`、`CODEBUDDY.md`、`.codebuddy/`（rules + 17 个 skills）、`.sdlc/`（RUNBOOK、DAILY、INDEX、两处历史工件、本 change 工件）、`docs/TODO.md`、`CLAUDE_SDLC_TODO.md`。
工具箱（不在本项目版本控制内）：`inspect_sdlc_state.py`、`validate_sdlc_state.py`、`update_sdlc_state.py`（add-artifact 守卫）。

## Material deviations

1. `AGENTS.md` 行数**没降反升**（46 → 52）：铁律压到 8 行、删三处重复，但补了四组标题与分流表——换来「规定/事实」分离与三处同文可校验。
2. 同文校验首版**误报**：三文件 EOL 不同（LF vs CRLF，差 9 字节）→ 校验收敛为**归一行尾后比内容**。
3. 工件曾被清空：`add-artifact` 覆盖已存在文件（见上），三份工件按事实重建，工具已加守卫。
4. **并行会话**：同一时段另一会话建了 change `v2-device-feedback` 并改了 4 个源码文件 + `DESIGN.md` + `ui-v2-redesign/{build,maintain}.md`。本 change 的提交按内容边界隔离，未卷入其改动；`.sdlc/INDEX.md`、`lifecycle.yaml`、`DAILY.md` 因双方都在写而留给最后收尾的一方提交。

## Local checks

| Check | Command | Result |
|---|---|---|
| 状态检查 | `inspect_sdlc_state.py .` | 通过（三个 change 均 `Missing: none`） |
| 状态校验 | `validate_sdlc_state.py .` | 通过（`SDLC state is valid`，本项目首次转绿，删除 `.zcode` 后仍绿） |
| 铁律同文 | 三处 `gate-rules` 块归一 EOL 后 SHA-256 | 通过（`3a16b4469c0c`） |
| 薄封装完整 | 目录计数 | 通过（17/17） |
| `.zcode` 移除 | `git ls-files .zcode` | 通过（0 项） |
| `add-artifact` 守卫 | 对已存在工件重跑 | 通过（拒绝覆盖，文件字节数不变） |

## Known limitations

- 工具箱修复只在本机（无 remote，无法 push 上游）；换机器按 RUNBOOK §1 重装 + §6 留档重做。
- 裸克隆下薄封装指向失效属预期（`Tools/` 被 gitignore），回落路径是「纸面」的，未在缺工具箱的机器上实测。
