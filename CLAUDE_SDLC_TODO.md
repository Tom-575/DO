# CLAUDE_SDLC_TODO

> **定位**：**SDLC 工具箱的长期优化台账**（2026-09-19 用户指定单独保留，不是中转文件）。
> **相关**：工具用法见 `.sdlc/RUNBOOK.md`；任务拆解见 `docs/TODO.md` #41（指向本文件）；日常记录见 `.sdlc/DAILY.md`；首个 change 的工件见 `.sdlc/changes/sdlc-toolbox-alignment/`。
> **状态图例**：✅ 完成 ／ 🔶 部分完成 ／ ⬜ 未开工 ／ ❓ 待拍板　　**最后更新**：2026-09-20
>
> **结论：A 段（工具箱侧）已全部落地**，见下方 A1–A4；待办只剩「是否把非空校验接入 `validate`」（D1，已定：暂不接入）。

## 0. 判断依据（本机事实）

- 工具箱本体 `Tools/claude-sdlc/`：**独立 git 仓库、无 remote、被 `.gitignore` 忽略**。本机提交：
  `ebcb611`（56 项：阶段工件改名收尾 + 10 个 primitive skill 入库）／`3a8332a`（inspect、validate 修复）／`0df0aac`（add-artifact 守卫）／`dbd495d`（gate 词表文档化、refresh-index 标记化、advance 语义、daily 模板、工件非空校验）／`6a7a512`（6 个阶段 SKILL 写明 gate 值、模板去 status 双写、init 生成 README、变量改名）／**`24b02bd`（另一窗口产出、主 agent 代为入库：`code-review` 提为 Test 必需 + 真机走查提为 Deploy 必需 + 两门禁并入 `validate`）**。
- `.zcode/`（旧 IDE 快照）**已删除**（主仓库提交 `601ca38`）。
- 四个校验当前全绿（2026-09-20 复跑）：
  - `inspect_sdlc_state.py .` → 各 change `Missing: none`
  - `validate_sdlc_state.py .` → `SDLC state is valid`
  - `check_artifacts_nonempty.py .` → `artifacts are gate-ready (4 active change(s) checked)`
  - 临时项目冒烟（`init → start → set-gate → advance ×2`）→ 全部符合预期，见 E 段

## A. 工具箱侧（改 `Tools/claude-sdlc/`）—— 全部完成 ✅

### A1 阻塞级 ✅

- ✅ **A1-1 提交那 56 项未提交改动** → `ebcb611`。
- ✅ **A1-2 `inspect_sdlc_state.py` 的 FIELDS 对齐新名** → `3a8332a`。修前症状：对正确的 `lifecycle.yaml` 报 `Missing: learning` + `Next: repair missing artifacts`（把 agent 引去修一个存在的文件）。
- ✅ **A1-3 `validate_sdlc_state.py` 不再硬编码 `<root>/shared/*.md`** → `3a8332a`（候选探测 + `display_path()`）。
- ✅ **A1-4 `add-artifact` 存在性守卫** → `0df0aac`。修前无条件用空模板覆盖——**实测把已写好的 design/build/test 清空**。

### A2 契约与文档 ✅

- ✅ **A2-1 gate 词表写进 SKILL** → navigator 词表在 `dbd495d`；**6 个阶段 SKILL 在 `6a7a512` 各自写明自己的 gate 值**（此前 `ai-sdlc-plan` 只说「the Plan gate」，从不出现字符串 `intent-accepted`，agent 无从得知也无法自检）。
- ✅ **A2-2「等待人工」文档化** → `dbd495d`：`awaiting-human-review` 的含义、来源（`start`/`rollback` 默认值）、无需 approver，写进 navigator 与 `shared/artifact-contracts.md`。
- ✅ **A2-3 `advance` 不沿用旧 gate** → `dbd495d`，**已冒烟实测**：推进后新阶段为 `awaiting-human-review`；且**未人工确认就推不动**（`cannot advance smoke-1; gate must be design-accepted, got awaiting-human-review`）。
- ✅ **A2-4 `refresh-index` 只重写标记内区块** → `dbd495d`：`## Current State` 整段重写（纯数据）；Active Changes 只改 `<!-- changes:start -->` / `<!-- changes:end -->` 之间；旧格式首次运行自动补标记。修前会连手写备注一起抹（实测被抹两次）。
- ✅ **A2-5 字段名对照表 + 改名残留** → 对照表在 `dbd495d`（`shared/artifact-contracts.md`）；局部变量 `intent` → `plan_artifact` 在 `6a7a512`。

### A3 流程资产 ✅

- ✅ **A3-1 DAILY 模板进工具箱** → `dbd495d` 新增 `.sdlc/templates/daily.md`。
- ✅ **A3-2 工件非空校验** → `dbd495d` 新增 `scripts/check_artifacts_nonempty.py`：占位符（`<change name>` / `TBD` / `（待填）`）、表格须有数据行、`test`/`deploy`/`maintain` 须有目标存在的证据链接。**首次运行即抓出 `ui-v2-redesign/maintain.md` 无表格无证据链**（已补）。按需运行（决策 D1）。
- ✅ **A3-3 空目录** → 按建议「带 README 保留」：`init_sdlc.py` 为 `learnings/`、`decisions/` 生成说明页（`6a7a512`）；本项目两页也已补齐（`.sdlc/learnings/README.md`、`.sdlc/decisions/README.md`）。
- ✅ **A3-4 模板去掉 `status:`** → `6a7a512`：6 个模板不再预填 `status: draft/candidate`（预填正是漂移来源）。同时明确：**`lifecycle.yaml` 是唯一记录，任何脚本都不读工件里的 `status:`**；`update_sdlc_state.py` 仍会写 `active|accepted|superseded`，那是**给人看的镜像**，不得手改。已实测：`start` 生成的 `plan.md` 里 `status:` 行数 = 0。

### A4 仓库卫生 ✅

- ✅ **A4-1 删本机缓存**：`.pytest_cache/`、`scripts/__pycache__/`、`tests/__pycache__/` 已清，工具箱工作区干净（缓存跑测试会自动再生，属正常）。
- ✅ **A4-2 上游回报去向已留档**：该克隆无 remote → 修复清单写在 `.sdlc/RUNBOOK.md` §6（判据见 `docs/TODO.md` #20：去向必须已落地）。

## B. 本项目侧 ✅（2026-09-19 完成，change `sdlc-toolbox-alignment`）

- ✅ **B1 删除 `.zcode/`**（提交 `601ca38`，53 文件 / −2091；先改引用后删，全程无断链）
- ✅ **B2 skill 发现入口**：`.codebuddy/skills/` 2 → **17 个**（15 个新建：6 个阶段技能 + 9 个工程 primitive），2 个手写封装改指工具箱本体并写死回落步骤
- ✅ **B3 `AGENTS.md`**：只留铁律 4 条 + 运行时分流 + 项目事实；修 3 处过期；纠正「`.zcode/` 是约定目录」的错误表述
- ✅ **B4 `CODEBUDDY.md`**（33 行）/ ✅ **B5 `RULE.mdc`**（24 行）：与 `AGENTS.md` 铁律段逐字同文（`gate-rules` 标记，hash `3a16b4469c0c`）
- ✅ **B6 `.sdlc/RUNBOOK.md`**（工具用法唯一落点）/ ✅ **B7 `.sdlc/DAILY.md`**（#21 落地）
- ✅ **B8 `docs/TODO.md` #41 立项并指向本文件**
- ✅ **B9 `memory-export-overlap-fix` 的 status 漂移回退 `accepted`**（注：该 `status:` 字段现已明确为「镜像」，权威在 `lifecycle.yaml`）
- ✅ **B10 回归**：`inspect` / `validate` / `check_artifacts_nonempty` / 三处 hash / 目录计数 全部通过

## C. 明确不做（避免过度清理）

- ❌ **不搬工具箱目录**（决策 B：删快照、薄封装指本体）。搬目录要改 17 个 skill 的相对链接 + `shared/` 路径 + 全套文档。
- ❌ **不动工具箱的 `tests/`、`.github/`、`RELEASE-CHECKLIST.md`、`requirements-dev.txt`**：上游开发物，删了会让克隆与上游分叉、以后 `git pull` 变脏。
- ❌ **不改 `.sdlc/archive/`** 的历史归档。
- ❌ **不删 `.sdlc/learnings/`、`decisions/`**：已按 A3-3 带 README 保留。

## D. 决策记录（2026-09-20 用户「都按照建议来」）

| # | 问题 | 决定 | 依据 |
|---|---|---|---|
| 1 | 非空校验是否接入 `validate` | ~~不接入~~ → **已并入 `validate_sdlc_state.py`**（2026-09-21 被取代） | 另一窗口按 `docs/TODO.md` #51 落地：两个入口曾「一个绿一个红」，并入后 `advance` 前跑一次即可 |
| 2 | `learnings/`、`decisions/` 空目录 | **带 README 保留** | 空目录在 Git 里不存在，README 让人看懂用途；`decisions/` 未来有用 |
| 3 | 本机缓存 | **删** | 可再生；已清 |
| 4 | 同文校验做成 pre-commit 钩子 | ~~不做~~ → **已建 `.githooks/pre-commit`**（2026-09-21 被取代） | 同上 #51。钩子只跑 `validate`，工具箱缺失时**跳过不拦**。**需你手动启用一次**：`git config core.hooksPath .githooks`（Git 配置不进版本控制，agent 不得代改） |
| 5 | `advance` 是否要求当前阶段 gate 已人工确认 | **代码已具备该行为**（`update_sdlc_state.py` 第 172 行），无需再改 | 2026-09-20 冒烟实测：未确认即拒绝推进 |
| 6 | `code-review` / 真机走查 是否提为门禁 | **已提为必需**：`test.md` 须含 `## Code review` 且 Standards/Spec 两轴齐全；`deploy.md` 须含 `## 真机走查`（有证据链接，或明说「未做」+ 去向） | 2026-09-21 用户裁决「改成必须」（`docs/TODO.md` #49 / #50）；四期、五期各欠过一次真机走查，代价是真机上手第一天撞到 #42/#43 |

## E. 验收方式（每项都可复跑）

| 项 | 命令 / 断言 | 2026-09-20 复跑结果 |
|---|---|---|
| A1-2 | `inspect_sdlc_state.py .` → `Missing: none` | ✅ |
| A1-3 / A3-2 | `validate_sdlc_state.py .` → `SDLC state is valid`；`check_artifacts_nonempty.py .` → `artifacts are gate-ready` | ✅ 4 个活跃 change |
| A1-4 | 对已存在工件跑 `add-artifact` → `refusing to overwrite`，文件字节数不变 | 已于 09-19 验证 |
| A2-3 / A2-4 | ① `advance` 后 `gate` = `awaiting-human-review`；② 未 `set-gate` 再 `advance` 必须被拒；③ `refresh-index` 后手写备注仍在 | ✅ ① `stage: design` + `gate: awaiting-human-review`；② `cannot advance smoke-1; gate must be design-accepted, got awaiting-human-review`；③ 标记外手写区幸存 |
| A3-3 / A3-4 | `init` 后 `learnings/README.md`、`decisions/README.md` 存在；`start` 生成的工件无 `status:` 行 | ✅ 均 True；`status:` 计数 0 |
| B1 | `git ls-files .zcode` 为空 | ✅ |
| B2 | `.codebuddy/skills/` = 17，且每个目标路径存在 | ✅ |
| B3–B5 | 三处 `gate-rules` 块归一 EOL 后 hash 相同（命令见 RUNBOOK §7） | ✅ |

## F. 仅剩的两件事（都要人点头）

1. **gate 是否推进**：`sdlc-toolbox-alignment` 现在 `stage: plan` / `gate: awaiting-human-review`。工具已保证「没人工确认推不动」——按新规则，这里需要你一句确认（或否决）才能 `set-gate` + `advance`。
2. **6 个本地提交是否 push**：`a778123` `3828e8e` `601ca38` `8a28098` `14d746b` `b1704ec`（+ 本文件的提交）。建议等并行会话收工后一次推，避免推入半成品。
