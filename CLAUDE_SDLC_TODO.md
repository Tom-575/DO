# CLAUDE_SDLC_TODO

> **用途**：把「SDLC 工具箱 + 本项目对齐」的全部待办摊开给人工过目。
> **状态**：草稿，未开工。确认后——工具箱侧条目进 `Tools/claude-sdlc/`（它自带 git），
> 本项目侧条目并进 `docs/TODO.md` #41 并走 change `sdlc-toolbox-alignment`；本文件中转完即删。
> **日期**：2026-09-19　**依据**：本机实测（`inspect` / `validate` / `update` 实跑、53 文件全量 hash 比对、源码逐行核对）。

## 0. 已确认的前提

| 事实 | 证据 |
|---|---|
| `Tools/claude-sdlc/` 是**自带 git 的独立克隆**（branch `master`，HEAD `2741d8d`，**无 remote**），主仓库用 `.gitignore` 忽略它 | `Test-Path Tools\claude-sdlc\.git` |
| 它里面有 **56 项未提交改动**（7 改 + 11 新 skill、shared 3 改 1 新、scripts 2 改 3 新、模板改名） | `git -C Tools/claude-sdlc status --porcelain` |
| `.zcode/`（主仓库内）与 `Tools/.../skills+shared` **当前逐字节一致**（53 vs 53，0 差异） | 全量 hash 比对 |
| `init_sdlc.py` **只创建 `.sdlc/`**，不装 skills、不建 `.zcode/` | `scripts/init_sdlc.py` line 21/23 |
| **决策 B**：删掉 `.zcode/`，薄封装指向工具箱本体 | 用户 2026-09-19 |

## A. 工具箱侧（改 `Tools/claude-sdlc/`，独立仓库）

### A1 阻塞级：会给出错误指令

- [ ] **A1-1 提交那 56 项改动**（一切的前提）
      `git -C Tools/claude-sdlc commit`（信息建议：`上游改名收尾(intent→plan/change→build/evidence→test/release→deploy/learning→maintain)+新增阶段 skill`）
      **为什么**：不提交 → `git checkout` 就没了、`git pull` 必冲突。
- [ ] **A1-2 修 `inspect_sdlc_state.py` 的 FIELDS**
      现状 `intent / (intent,design) / …,change / …,evidence / …,release / learning`，
      与同文件 `STAGES` 及 `update` 的新名 `plan/design/build/test/deploy/maintain` 全不一致。
      **实测症状**：对正确的 `lifecycle.yaml` 报 `Missing: learning` + `Next: repair missing artifacts`（把 agent 引去修一个存在的文件）。
      改 6 行。验收：`python scripts/inspect_sdlc_state.py <项目根>` 输出 `Missing: none`。
- [ ] **A1-3 修 `validate_sdlc_state.py` 的路径假定**
      硬编码 `<root>/shared/{lifecycle,risk-model,artifact-contracts,evidence-policy}.md`（line 17–20），
      但本项目 `shared` 不在项目根（原在 `.zcode/shared`，B 之后只在工具箱本体）→ 校验恒红。
      改 4 行：优先读 `sdlc.config.yaml` 的路径键，取不到再按候选探测（`./shared`、`.zcode/shared`、工具本体 `shared/`）。

### A2 契约缺失：文档与工具不同步

- [ ] **A2-1 把 gate 词表写进文档**（现在只活在 `update` 的 GATES 字典里）
      词表：`intent-accepted / design-accepted / candidate-ready / evidence-passed / deployed-stable / learning-closed`（阶段专属，传错即拒——我传 `passed` 被当场拒）。
      落点：navigator SKILL.md + 6 个阶段 SKILL 各自的「gate」一节。
- [ ] **A2-2 增加「等待人工」的表达**（现在 GATES 里没有，而上一轮归档 yaml 的 gate 恰恰是 `awaiting-human-review`）
      二选一：① 允许 `awaiting-<stage>-review` 取值；② 加正交字段 `pending:`。
      **不做的代价**：无法表达「已交付、等人工确认」，只能沿用旧 gate，「新阶段还没确认」在机器状态里看不见。
- [ ] **A2-3 `advance` 不沿用旧 gate**（`update` line 149–150 `found["gate"] = args.gate`）
      现状产出 `stage: maintain` + `gate: deployed-stable` 这类含糊组合。改为推进后置 `awaiting-<stage>-review`。
- [ ] **A2-4 `refresh-index` 只重写标记内区块**
      现状会整体重写 `INDEX.md` 的 Active Changes 段，冲掉手写的工件链接与待办（本次已发生一次，我手工补回）。
      改为只重写 `<!-- generated:… -->` 与 `<!-- /generated -->` 之间的内容。
- [ ] **A2-5 字段名对照表**（旧 `intent/change/evidence/release/learning` → 新 `plan/build/test/deploy/maintain`）写进 RUNBOOK 与 skill；
      顺手把 `update` 里指向 `plan.md` 的局部变量 `intent` 改名（line 93/95，纯命名残留，无功能影响）。

### A3 流程资产（对应你之前提的两条）

- [ ] **A3-1 DAILY 模板**（对应本项目 TODO #21）
      新增 `.sdlc/templates/daily.md`（铁律：凡写 passed 必挂证据链接；「待决策」为空 = 当日无需人工动作），navigator 里加一句约定。
- [ ] **A3-2 工件非空校验**（对应本项目 TODO #22）
      新增 `scripts/check_artifacts_nonempty.py`：当前阶段的工件必须**验收表有行、证据链接的目标文件存在**；挂进 `validate_sdlc_state.py`。
- [ ] **A3-3 `.sdlc/learnings/`、`.sdlc/decisions/` 空目录的去留**
      本项目里是 0 文件（学习实际只写在 `INDEX.md` 正文）→ 要么 init 时放 README 说明用途，要么不再创建。
- [ ] **A3-4 模板去掉 `status:` 字段**（消除与 `lifecycle.yaml` 的双写漂移；已见实例：`memory-export-overlap-fix` 的 `status` 被人改成 `candidate`/`active`）
      或明确写「仅人读，机器状态以 lifecycle.yaml 为准」。

### A4 仓库卫生

- [ ] **A4-1 删本机缓存**：`.pytest_cache/`、`scripts/__pycache__/`（可再生；上次授权弹窗超时未执行）
- [ ] **A4-2 上游回报去向**：该克隆**没有 remote** → 修复无法 push 回上游。按 TODO #20 的判据，必须在本项目留档（RUNBOOK + #41 里写明「本机已修 + 上游无 remote」），否则等于没有去向。

## B. 本项目侧（走 change `sdlc-toolbox-alignment`）

- [ ] **B1 删 `.zcode/`（53 文件）**
      **先改引用、后删**（顺序不能反）：B2 的薄封装与 B3–B5 的文档都指向它。
      `git rm -r .zcode`（进版本控制的删除，自然可回滚）。
- [ ] **B2 薄封装改指向 + 补齐 15 个**
      `.codebuddy/skills/` 现有 2 个（`ai-sdlc-navigator`、`code-review`），全部改为指向 `Tools/claude-sdlc/skills/<name>/SKILL.md`，
      并写死回落说明（「工具箱缺失时按 `.sdlc/RUNBOOK.md` 的『装工具箱三步』先装」），使其**不因指针失效而变成死链**。
      再补 15 个薄封装（**优先 6 个阶段技能** `ai-sdlc-plan/design/build/test/deploy/maintain`，因为 navigator 会要求「加载对应阶段技能」，现在只能靠人记得手读）。
- [ ] **B3 `AGENTS.md` 重排**（46 → ~26 行）
      门禁段压成「铁律 4 条 + 1 行运行时分流表 + 指向 `.sdlc/RUNBOOK.md`」；末尾 bullet 归成 4 组（产品 / 技术 / 文档地图 / 流程）；
      删与门禁重复的「流程管理」bullet；**修 3 处过期**：① 原型地址缺 `/DO/`；② 「下一步：验证完整闭环」已过时（四期已跑通、五期 V2 已上线）；③ 「工作流 W0–W4」在 TODO 里已 0 处命中。
      顺带改一处事实错误：`.zcode/` 不是「claude-sdlc 的约定目录」（工具箱源码 0 处提 `.zcode`，自带的是 `.codex-plugin/`）。
- [ ] **B4 `CODEBUDDY.md` 瘦身**（34 → ~20 行）：删与门禁重复的段落，只留「本文件是入口 + 铁律指针 + 已知的坑」。
- [ ] **B5 `.codebuddy/rules/sdlc-gate/RULE.mdc` 瘦身**（28 → ~14 行）+ **三处同文校验命令**
      同文要求保留（换运行时也不漏），但改成**铁律段逐字相同**，并给一条可跑命令（对三处该段取 hash 比对），否则拆分后没人核。
- [ ] **B6 新增 `.sdlc/RUNBOOK.md`**
      内容：gate 词表 / 状态推进命令（`start`·`advance`·`set-gate`·`refresh-index`·`archive`）/ 每阶段必需工件表 / **装工具箱三步** / 「`.zcode/` 快照已废弃（决策 B）」/ 本机已修脚本清单（A1-2、A1-3）与「上游无 remote」。
- [ ] **B7 新增 `.sdlc/DAILY.md`**（TODO #21 落地；模板用 A3-1）
- [ ] **B8 `docs/TODO.md`**：新增 **#41「SDLC 工具链对齐」**（把本文件 A/B 清单挂上去，避免又变成「没有去向」）；标注 #21/#22 与本文件的对应关系。
- [ ] **B9 处置 `memory-export-overlap-fix` 的 status 漂移**（`plan.md: active`、`build.md: candidate`，非我改动、仍挂工作区）
      三选：保留（并说明理由）／回退成 `accepted`／随 change 一起提交。**需你定**。
- [ ] **B10 回归验证**：`python scripts/inspect_sdlc_state.py .` 应输出 `Missing: none`；`validate_sdlc_state.py` 不再恒红；
      `.codebuddy/skills` 12 个薄封装的目标路径全部存在（B 之后 Tools 缺失属预期，脚本要能区分「预期缺失」与「断链」）。

## C. 明确不做（避免过度清理）

- ❌ **不搬工具箱目录**（决策 B 已定：删快照、薄封装指本体）。搬目录要改 17 个 skill 的相对链接 + `shared/` 路径 + 全套文档，收益只有好看。
- ❌ **不动 `Tools/claude-sdlc/tests/`、`.github/`、`RELEASE-CHECKLIST.md`、`requirements-dev.txt`**：那是上游的开发物，删了会让克隆与上游分叉、以后 `git pull` 变脏。
- ❌ **不改 `.sdlc/archive/`** 的历史归档（已放行的记录不追改）。
- ❌ **不为了「好看」删除 `.sdlc/learnings/`、`decisions/` 空目录**——按 A3-3 的结论处置，不擅自删。

## D. 执行顺序与依赖

```
A1-1（提交 56 项）            ← 解锁一切，必须先做
  └─ A1-2 / A1-3（阻塞级脚本修复）→ 立刻用 inspect/validate 复验
       └─ B1–B8（本项目对齐 + 文档重排 + RUNBOOK/DAILY）→ 走 change 留工件
            └─ A2-* / A3-* / A4-*（工具箱功能与契约改动，建议单独提）
```
依赖关系：**B1 必须晚于 B2/B3–B5 的引用更新**（先改指向再删，否则中途是断链状态）。

## E. 需要你拍板

| # | 问题 | 选项 | 我的建议 |
|---|---|---|---|
| 1 | A1-1 提交信息与是否由我提交 | 我提交 / 你自己提交 | 我提交（信息如上） |
| 2 | A2-2「等待人工」怎么表达 | ① 允许 `awaiting-<stage>-review`；② 加正交字段 `pending:` | ② 正交字段（不破坏现有词表语义） |
| 3 | B9 status 漂移怎么处置 | 保留 / 回退 / 随 change 提交 | 回退成 `accepted`（机器状态以 lifecycle.yaml 为准，避免两处不一致） |
| 4 | 本文件（`CLAUDE_SDLC_TODO.md`）的去向 | 拆完后删 / 移进 `Tools/claude-sdlc/` 长期维护 | 拆完后删（内容已进 #41 与工具箱） |

## F. 验收方式（每项都要能复跑）

| 项 | 命令 / 断言 |
|---|---|
| A1-2 | `python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .` → `Missing: none` |
| A1-3 | `python Tools/claude-sdlc/scripts/validate_sdlc_state.py .` → 不再因 `shared/` 路径恒红 |
| B1 | `git ls-files .zcode` 为空；`.codebuddy/skills/*` 目标路径存在 |
| B3–B5 | 三处铁律段 hash 相同（一条命令可比对） |
| B6/B7 | `.sdlc/RUNBOOK.md`、`.sdlc/DAILY.md` 存在且非空 |
| B10 | 薄封装目标路径逐条存在性检查通过 |
