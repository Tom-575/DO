# CLAUDE_SDLC_TODO

> **定位**：**SDLC 工具箱的长期优化台账**（2026-09-19 用户指定单独保留，不是中转文件）。
> **相关**：工具用法见 `.sdlc/RUNBOOK.md`；任务拆解见 `docs/TODO.md` #41（指向本文件）；日常记录见 `.sdlc/DAILY.md`；工件见 `.sdlc/changes/sdlc-toolbox-alignment/`。
> **状态图例**：✅ 完成 ／ 🔶 进行中 ／ ⬜ 未开工 ／ ❓ 待拍板　　**最后更新**：2026-09-19

## 0. 判断依据（本机事实）

- 工具箱本体 `Tools/claude-sdlc/`：**独立 git 仓库、无 remote、被 `.gitignore` 忽略**；本机提交 `ebcb611`（56 项改名收尾 + 10 个 primitive skill）、`3a8332a`（inspect/validate 修复）、`0df0aac`（add-artifact 守卫）。
- `.zcode/`（旧 IDE 快照）**已删除**（提交 `601ca38`）；skill 正文与 `shared/` 只在工具箱本体。
- 当前状态：`inspect` → 三个 change 全 `Missing: none`；`validate` → `SDLC state is valid`（本项目首次转绿）。
- gate 词表与命令：`.sdlc/RUNBOOK.md` §2 / §3。

## A. 工具箱侧（改 `Tools/claude-sdlc/`）

### A1 阻塞级 ✅ 全部完成

- ✅ **A1-1 提交那 56 项未提交改动** → `ebcb611`（阶段工件改名收尾 intent→plan / change→build / evidence→test / release→deploy / learning→maintain；10 个工程 primitive skill 与总览文档入库；71 files，+2304/−192）。
- ✅ **A1-2 `inspect_sdlc_state.py` 的 FIELDS 对齐新名** → `3a8332a`。修前症状：对正确的 `lifecycle.yaml` 报 `Missing: learning` + `Next: repair missing artifacts`（把 agent 引去修一个存在的文件）。
- ✅ **A1-3 `validate_sdlc_state.py` 不再硬编码 `<root>/shared/*.md`** → `3a8332a`。改为候选探测（项目根 → `.zcode/shared` → 工具箱本体）+ `display_path()` 处理跨根路径。
- ✅ **A1-4（本轮新增）`add-artifact` 存在性守卫** → `0df0aac`。修前：无条件用空模板覆盖目标文件——**实测把已写好的 design/build/test 清空**（见本 change 的 build.md 偏差 3）。

### A2 契约与文档 ⬜

- ⬜ **A2-1 gate 词表写进 SKILL**（现在是六阶段专属值，只活在 `update_sdlc_state.py` 的 GATES 字典里；实测传 `passed` 被拒）。落点：navigator + 6 个阶段 SKILL 的「gate」一节。
- ⬜ **A2-2「等待人工」写进上游文档**：值 **已存在**（`awaiting-human-review`，是 `start` / `rollback` 的默认 gate，且不要求 approver），但**任何文档都没写**。本轮已补进本项目 RUNBOOK §2；上游 SKILL 仍缺。
- ⬜ **A2-3 `advance` 不沿用旧 gate**（`found["gate"] = args.gate`）：产出 `stage: maintain` + `gate: deployed-stable` 这类组合，看不出「新阶段还没人工确认」。
- ⬜ **A2-4 `refresh-index` 只重写标记内区块**：实测重写范围是 **`## Current State` → `## Active Decisions` 之间的一切**（不是只有 Active Changes 段），手写内容会被整段抹掉——本轮被抹两次，最终把手写区挪到 `## Active Decisions` 之后才稳定。
- ⬜ **A2-5 字段名对照表进 SKILL**（旧 `intent/change/evidence/release/learning` → 新 `plan/build/test/deploy/maintain`）；顺手把 `update` 里指向 `plan.md` 的局部变量 `intent` 改名（纯命名残留）。

### A3 流程资产 ⬜

- ⬜ **A3-1 DAILY 模板进工具箱**（`.sdlc/templates/daily.md` + navigator 一句约定）。本项目已自建 `.sdlc/DAILY.md`，但工具箱不带模板，下个项目还得重写。
- ⬜ **A3-2 工件非空校验脚本**（对应 `docs/TODO.md` #22 的机械校验：当前阶段工件必须「验收表有行、证据链接有目标」）。目前只有 RUNBOOK §5 的文字规则。
- ⬜ **A3-3 `.sdlc/learnings/`、`.sdlc/decisions/` 空目录去留**：本项目里 0 文件（学习实际写在 `INDEX.md` 正文）→ 要么 init 时放 README 说明用途，要么不再创建。
- ⬜ **A3-4 模板去掉 `status:`**：与 `lifecycle.yaml` 的 gate 双写，已见漂移实例（`memory-export-overlap-fix` 的 status 被人改成 `candidate`/`active`，本轮回退为 `accepted`）。

### A4 仓库卫生

- ⬜ **A4-1 删本机缓存**：`Tools/claude-sdlc/.pytest_cache/`、`scripts/__pycache__/`（可再生；两次授权弹窗超时未执行）。
- ✅ **A4-2 上游回报去向已留档**：该克隆无 remote，无法 push 上游 → 修复清单写在 `.sdlc/RUNBOOK.md` §6（判据见 `docs/TODO.md` #20：去向必须已落地）。

## B. 本项目侧 ✅（2026-09-19 完成，change `sdlc-toolbox-alignment`）

- ✅ **B1 删除 `.zcode/`**（提交 `601ca38`，53 文件 / −2091；引用先改指、后删，全程无断链）
- ✅ **B2 skill 发现入口**：`.codebuddy/skills/` 2 → **17 个**（15 个新建：6 个阶段技能 + 9 个工程 primitive），2 个手写封装改指工具箱本体并写死回落步骤
- ✅ **B3 `AGENTS.md`**：只留铁律 4 条 + 运行时分流 + 项目事实；修 3 处过期；纠正「`.zcode/` 是约定目录」的错误表述
- ✅ **B4 `CODEBUDDY.md`** / ✅ **B5 `RULE.mdc`**：同文块（`gate-rules` 标记）+ 各自特有内容
- ✅ **B6 `.sdlc/RUNBOOK.md`**（工具用法唯一落点）/ ✅ **B7 `.sdlc/DAILY.md`**（##21 落地）
- ✅ **B8 `docs/TODO.md` #41 立项并指向本文件**
- ✅ **B9 `memory-export-overlap-fix` 的 status 漂移回退 `accepted`**
- ✅ **B10 回归**：`inspect` / `validate` / 三处 hash（`3a16b4469c0c`）/ 目录计数 全部通过

## C. 明确不做（避免过度清理）

- ❌ **不搬工具箱目录**（决策 B：删快照、薄封装指本体）。搬目录要改 17 个 skill 的相对链接 + `shared/` 路径 + 全套文档。
- ❌ **不动工具箱的 `tests/`、`.github/`、`RELEASE-CHECKLIST.md`、`requirements-dev.txt`**：上游开发物，删了会让克隆与上游分叉、以后 `git pull` 变脏。
- ❌ **不改 `.sdlc/archive/`** 的历史归档。
- ❌ **不擅自删 `.sdlc/learnings/`、`decisions/` 空目录**：按 A3-3 的结论处置。

## D. 待拍板 ❓

| # | 问题 | 选项 | 建议 |
|---|---|---|---|
| 1 | A2-2「等待人工」怎么表达 | ① 允许 `awaiting-<stage>-review`；② 用现有 `awaiting-human-review`（已在用） + 加正交字段 `pending:` | ② 成本最低 |
| 2 | A3-3 空目录 | 带 README 保留 / init 不再创建 | 带 README 保留（`decisions/` 未来有用） |
| 3 | A4-1 缓存删除 | 删 / 留着 | 删（可再生） |
| 4 | 同文校验是否做成 pre-commit 钩子 | 做 / 保持手动命令 | 保持手动（本项目提交频率低，钩子收益不大） |

## E. 验收方式（每项都可复跑）

| 项 | 命令 / 断言 |
|---|---|
| A1-2 | `python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .` → `Missing: none` |
| A1-3 | `python Tools/claude-sdlc/scripts/validate_sdlc_state.py .` → `SDLC state is valid` |
| A1-4 | 对已存在工件跑 `add-artifact` → `refusing to overwrite`，文件字节数不变 |
| B1 | `git ls-files .zcode` 为空；目录不存在 |
| B2 | `.codebuddy/skills/` = 17，且每个目标路径存在（工具箱在本机时） |
| B3–B5 | 三处 `gate-rules` 块归一 EOL 后 hash 相同（命令见 RUNBOOK §7） |
| B6/B7 | `.sdlc/RUNBOOK.md`、`.sdlc/DAILY.md` 存在且非空 |
