# CLAUDE_SDLC_TODO

> **定位**：**SDLC 工具箱的长期优化台账**（2026-09-19 用户指定单独保留，不是中转文件）。
> **相关**：工具用法见 `.sdlc/RUNBOOK.md`；任务拆解见 `docs/TODO.md` #41（指向本文件）；日常记录见 `.sdlc/DAILY.md`；首个 change 的工件见 `.sdlc/changes/sdlc-toolbox-alignment/`。
> **状态图例**：✅ 完成 ／ 🔶 部分完成 ／ ⬜ 未开工 ／ ❓ 待拍板　　**最后更新**：2026-09-19

## 0. 判断依据（本机事实）

- 工具箱本体 `Tools/claude-sdlc/`：**独立 git 仓库、无 remote、被 `.gitignore` 忽略**。本机提交：
  `ebcb611`（56 项：阶段工件改名收尾 + 10 个 primitive skill 入库）／`3a8332a`（inspect、validate 修复）／`0df0aac`（add-artifact 守卫）／**`dbd495d`（gate 词表文档化、refresh-index 标记化、advance 语义、daily 模板、工件非空校验）**。
- `.zcode/`（旧 IDE 快照）**已删除**（主仓库提交 `601ca38`）；skill 正文与 `shared/` 只在工具箱本体。
- 三个校验当前全绿：
  - `inspect_sdlc_state.py .` → 各 change `Missing: none`
  - `validate_sdlc_state.py .` → `SDLC state is valid`（本项目首次转绿）
  - `check_artifacts_nonempty.py .` → `artifacts are gate-ready (3 active change(s) checked)`

## A. 工具箱侧（改 `Tools/claude-sdlc/`）

### A1 阻塞级 ✅ 全部完成

- ✅ **A1-1 提交那 56 项未提交改动** → `ebcb611`（阶段工件改名收尾 intent→plan / change→build / evidence→test / release→deploy / learning→maintain；10 个工程 primitive skill 与总览文档入库；71 files，+2304/−192）。
- ✅ **A1-2 `inspect_sdlc_state.py` 的 FIELDS 对齐新名** → `3a8332a`。修前症状：对正确的 `lifecycle.yaml` 报 `Missing: learning` + `Next: repair missing artifacts`（把 agent 引去修一个存在的文件）。
- ✅ **A1-3 `validate_sdlc_state.py` 不再硬编码 `<root>/shared/*.md`** → `3a8332a`。改为候选探测（项目根 → `.zcode/shared` → 工具箱本体）+ `display_path()`。
- ✅ **A1-4 `add-artifact` 存在性守卫** → `0df0aac`。修前无条件用空模板覆盖目标文件——**实测把已写好的 design/build/test 清空**。

### A2 契约与文档

- 🔶 **A2-1 gate 词表写进 SKILL** → `dbd495d` 完成 **navigator**（词表 + 含义 + 「传错即拒」的说明）；**6 个阶段 SKILL 仍待办**。
- ✅ **A2-2「等待人工」文档化** → `dbd495d`：值 `awaiting-human-review` 已写进 navigator 与 `shared/artifact-contracts.md`（它是 `start` / `rollback` 的默认 gate、不要求 approver）。
- ✅ **A2-3 `advance` 不沿用旧 gate** → `dbd495d`：推进后新阶段一律置 `awaiting-human-review`，每个阶段各自 `set-gate`。
- ✅ **A2-4 `refresh-index` 只重写标记内区块** → `dbd495d`：`## Current State` 整段重写（纯数据）；Active Changes 只改 `<!-- changes:start -->` / `<!-- changes:end -->` 之间；旧格式首次运行自动补标记。修前会连手写备注一起抹（实测被抹两次）。
- 🔶 **A2-5 字段名对照表** → `dbd495d` 已补进 `shared/artifact-contracts.md`（阶段↔字段↔gate + 改名历史 + 「三个脚本必须读同一批字段」的告诫）；**`update` 里指向 `plan.md` 的局部变量 `intent` 尚未改名**（纯命名残留）。

### A3 流程资产

- ✅ **A3-1 DAILY 模板进工具箱** → `dbd495d` 新增 `.sdlc/templates/daily.md`（铁律 + 模板）。
- ✅ **A3-2 工件非空校验** → `dbd495d` 新增 `scripts/check_artifacts_nonempty.py`：占位符检测（`<change name>` / `TBD` / `（待填）`）、表格须有数据行、`test`/`deploy`/`maintain` 阶段须有目标存在的证据链接。**首次运行即抓出本项目 `ui-v2-redesign/maintain.md` 无表格无证据链**（已补）。当前按需运行，**未接入 `validate`**（避免历史工件一片红）。
- ⬜ **A3-3 `.sdlc/learnings/`、`.sdlc/decisions/` 空目录去留**：本项目里 0 文件（学习写在 `INDEX.md` 正文）→ 要么 init 时放 README 说明用途，要么不再创建。
- ⬜ **A3-4 模板去掉 `status:`**：与 `lifecycle.yaml` 的 gate 双写，已见漂移实例（`memory-export-overlap-fix` 的 status 被改成 `candidate`/`active`，本轮回退 `accepted`）。

### A4 仓库卫生

- ⬜ **A4-1 删本机缓存**：`Tools/claude-sdlc/.pytest_cache/`、`scripts/__pycache__/`（可再生；授权弹窗多次超时，待你点一次）。
- ✅ **A4-2 上游回报去向已留档**：该克隆无 remote → 修复清单写在 `.sdlc/RUNBOOK.md` §6（判据见 `docs/TODO.md` #20：去向必须已落地）。

## B. 本项目侧 ✅（2026-09-19 完成，change `sdlc-toolbox-alignment`）

- ✅ **B1 删除 `.zcode/`**（提交 `601ca38`，53 文件 / −2091；先改引用后删，全程无断链）
- ✅ **B2 skill 发现入口**：`.codebuddy/skills/` 2 → **17 个**（15 个新建：6 个阶段技能 + 9 个工程 primitive），2 个手写封装改指工具箱本体并写死回落步骤
- ✅ **B3 `AGENTS.md`**：只留铁律 4 条 + 运行时分流 + 项目事实；修 3 处过期；纠正「`.zcode/` 是约定目录」的错误表述
- ✅ **B4 `CODEBUDDY.md`**（33 行）/ ✅ **B5 `RULE.mdc`**（24 行）：与 `AGENTS.md` 铁律段逐字同文（`gate-rules` 标记，hash `3a16b4469c0c`）
- ✅ **B6 `.sdlc/RUNBOOK.md`**（工具用法唯一落点）/ ✅ **B7 `.sdlc/DAILY.md`**（#21 落地）
- ✅ **B8 `docs/TODO.md` #41 立项并指向本文件**
- ✅ **B9 `memory-export-overlap-fix` 的 status 漂移回退 `accepted`**
- ✅ **B10 回归**：`inspect` / `validate` / `check_artifacts_nonempty` / 三处 hash / 目录计数 全部通过

## C. 明确不做（避免过度清理）

- ❌ **不搬工具箱目录**（决策 B：删快照、薄封装指本体）。搬目录要改 17 个 skill 的相对链接 + `shared/` 路径 + 全套文档。
- ❌ **不动工具箱的 `tests/`、`.github/`、`RELEASE-CHECKLIST.md`、`requirements-dev.txt`**：上游开发物，删了会让克隆与上游分叉、以后 `git pull` 变脏。
- ❌ **不改 `.sdlc/archive/`** 的历史归档。
- ❌ **不擅自删 `.sdlc/learnings/`、`decisions/` 空目录**：按 A3-3 的结论处置。

## D. 待拍板 ❓

| # | 问题 | 选项 | 建议 |
|---|---|---|---|
| 1 | A3-2 是否把非空校验接入 `validate` | 接入（历史工件可能变红，需要逐个补）/ 保持按需运行 | 保持按需运行，等活跃 change 都干净后再接入 |
| 2 | A3-3 空目录 | 带 README 保留 / init 不再创建 | 带 README 保留（`decisions/` 未来有用） |
| 3 | A4-1 缓存删除 | 删 / 留着 | 删（可再生）——需要你在弹窗点一次确认 |
| 4 | 同文校验是否做成 pre-commit 钩子 | 做 / 保持手动命令 | 保持手动（提交频率低，钩子收益不大） |

## E. 验收方式（每项都可复跑）

| 项 | 命令 / 断言 |
|---|---|
| A1-2 | `python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .` → `Missing: none` |
| A1-3 / A3-2 | `python Tools/claude-sdlc/scripts/validate_sdlc_state.py .` → `SDLC state is valid`；`check_artifacts_nonempty.py .` → `artifacts are gate-ready` |
| A1-4 | 对已存在工件跑 `add-artifact` → `refusing to overwrite`，文件字节数不变 |
| A2-4 | `refresh-index` 后：标记之间刷新、标记之外的手写备注仍在 |
| A2-3 | `advance` 后 `gate` 应为 `awaiting-human-review`（**待一次真实 advance 实测**） |
| B1 | `git ls-files .zcode` 为空 |
| B2 | `.codebuddy/skills/` = 17，且每个目标路径存在（工具箱在本机时） |
| B3–B5 | 三处 `gate-rules` 块归一 EOL 后 hash 相同（命令见 RUNBOOK §7） |
