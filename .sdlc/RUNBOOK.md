# SDLC RUNBOOK（本项目怎么用这套工具箱）

> **定位**：**工具用法**只写在这里。`AGENTS.md` / `CODEBUDDY.md` / `.codebuddy/rules/sdlc-gate/RULE.mdc` 只写「必须用它」的铁律并指向本文件——同一段说明不再三处复制。
> **维护点**：工具箱本体 `Tools/claude-sdlc/`（**被 `.gitignore` 忽略**，自带独立 git 仓库）。**2026-09-21 起已有远端**：`origin → https://github.com/Tom-575/claude-sdlc-skill.git`——此前它只存在于本机，是本项目最大的结构性风险（换机器即失），现已消除。
> **决策 B（2026-09-19）**：旧运行时留下的 skill 快照 `.zcode/` **已删除**，skill 正文只在工具箱本体里。

## 1. 装工具箱三步（新机器 / 裸克隆）

1. 从远端克隆工具箱到 `Tools/claude-sdlc/`：
   `git clone https://github.com/Tom-575/claude-sdlc-skill.git Tools/claude-sdlc`
   （该目录被 gitignore，不进本仓库的版本控制；2026-09-21 之前只能靠拷贝，现已可从远端取。）
2. 确认 `Tools/claude-sdlc/skills/`（17 个 skill）与 `Tools/claude-sdlc/shared/`（6 个契约文档）都在。
3. 校验：`python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .` 应输出 `Missing: none`；`python Tools/claude-sdlc/scripts/validate_sdlc_state.py .` 应输出 `SDLC state is valid`。

`shared/` 的路径按「项目根 → `.zcode/shared` → 工具箱本体」探测（2026-09-19 修）；**缺失时不要凭记忆复述 skill**，先装好工具箱再继续。

## 2. gate 词表（阶段专属，传错即拒）

| 阶段 | gate |
|---|---|
| plan | `intent-accepted` |
| design | `design-accepted` |
| build | `candidate-ready` |
| test | `evidence-passed` |
| deploy | `deployed-stable` |
| maintain | `learning-closed` |

`set-gate` 必须传**当前阶段**的词；`advance` 要求当前 gate 已等于该词。记录 gate 必须带 `--approver`，且**只能写在人工确认之后**——对话里的口头确认不算状态变更。

**上表是「已批准」的 gate。** 「等待人工」用的是另一个值：**`awaiting-human-review`**——它是 `start` 与 `rollback` 的默认 gate（`update_sdlc_state.py` 的 `--gate` 默认值），`validate` 接受它且不要求 `--approver`。所以「新阶段还没人工确认」是有表达方式的，只是过去没写进文档（2026-09-19 补记）。

## 3. 状态推进命令

```bash
python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .
python Tools/claude-sdlc/scripts/update_sdlc_state.py start <change-id> --title "..." --risk low --owner <name> --source "..."
python Tools/claude-sdlc/scripts/update_sdlc_state.py set-gate <change-id> --gate <当前阶段的 gate> --approver <name> --note "..."
python Tools/claude-sdlc/scripts/update_sdlc_state.py advance <change-id> --gate <刚批准的 gate>
python Tools/claude-sdlc/scripts/update_sdlc_state.py refresh-index
python Tools/claude-sdlc/scripts/update_sdlc_state.py archive <change-id>
```

> **每次 `advance` 之前先跑 `validate_sdlc_state.py .`** —— 它已经含通用非空检查与两道专属门禁
> （Test 的两轴 code review §9、Deploy 的真机走查交代 §10）。推进 gate 却不跑校验，
> 等于门禁不存在。`.githooks/pre-commit`（§10 末）会在提交时再拦一道。

两个**已修**的历史坑（2026-09-19，详见第 6 节）：

- **`refresh-index` 的重写范围**：现在只整段重写 `## Current State`（纯数据），Active Changes 列表只改 `<!-- changes:start -->` / `<!-- changes:end -->` 标记之间的行。**手写备注放在标记之外即可**（旧格式文件首次运行会自动补上标记）。
- **`advance` 写入新阶段的 gate**：现在推进后新阶段一律是 `awaiting-human-review`，**不会**把上一阶段刚批准的 gate 带过去——所以每个阶段都要各自 `set-gate` 一次；`stage: maintain` + `gate: deployed-stable` 这种组合不会再出现。同时 `advance` 要求**当前阶段**的 gate 已是该阶段的批准值，未确认就推进会被拒：`cannot advance <id>; gate must be <gate>, got awaiting-human-review`（2026-09-20 实测）。**即：没人工确认，阶段推不动。**

## 4. 每阶段必需工件（`lifecycle.yaml` 的字段名 = 工件名）

| 阶段 | 必需字段 | 文件 |
|---|---|---|
| plan | `plan` | `.sdlc/changes/<id>/plan.md` |
| design | `plan`, `design` | + `design.md` |
| build | + `build` | + `build.md` |
| test | + `test` | + `test.md` |
| deploy | + `deploy` | + `deploy.md` |
| maintain | `maintain` | `maintain.md` |

**Test 阶段的额外要求**（2026-09-21 起，用户裁决「改成必须」）：`test.md` 必须含一节两轴 code review
（`## Code review`，段内 `Standards` 与 `Spec` 都要出现）；纯流程 / 文档 change 可走窄豁免。
规则全文与豁免条件见 **§9**，机械校验由 `check_artifacts_nonempty.py` 覆盖。

**字段名历史**：旧名 `intent / change / evidence / release / learning` 已于 2026-09-19 由工具箱统一改名；见到旧名按本表换算。

`validate_sdlc_state.py` 会检查：工件存在、`status:` 取值合法、`revision:` 能在 git 里找到、`.sdlc/**/*.md` 的相对链接有目标、`INDEX.md` 的 Active changes 计数与 `lifecycle.yaml` 一致。

## 5. 工件非空铁律（TODO #22）

当前阶段该有的工件必须非空：**验收表有行、证据链接有目标**。链接目标不存在 = 等于没有证据。

**机械校验**（2026-09-19 新增，本机）：`python Tools/claude-sdlc/scripts/check_artifacts_nonempty.py .`
它检查每个活跃 change **当前阶段**的工件：无模板占位符（`<change name>` / `TBD` / `（待填）` 等）、表格有数据行；`test` / `deploy` / `maintain` 阶段还要求至少一条**目标存在**的证据链接。
通过时输出 `artifacts are gate-ready (N active change(s) checked)`。

**已并入 `validate`（2026-09-21）**：`validate_sdlc_state.py` 现在 `import` 这个脚本的检查函数，
所以 `python Tools/claude-sdlc/scripts/validate_sdlc_state.py .` 一处就能跑完
通用非空检查 + 下面两道专属门禁（`.githooks/pre-commit` 也走它）。两个入口容易「一个绿一个红」，
所以只留一个。

两道**专属门禁**（都是 2026-09-21 用户要求「改成必须」的）：

- **Test 的两轴 code review**（§9）：登记了 `test` 工件的 change，其 `test.md` 必须含 `## Code review`
  一节且两轴关键词齐，或走「不适用 + 改动清单」窄豁免。
- **Deploy 的真机走查交代**（§10）：登记了 `deploy` 工件的 change，其 `deploy.md` 必须含
  `## 真机走查` 一节，且**要么**给出目标存在的证据链接、**要么**明说「未做」并写明欠账去向。

两条都**不等到 `stage == <阶段>` 才查**：提前写好的工件也受同一把尺子管。

## 6. 本机改动与去向（换机器会丢，故在此留档）

> **读表须知（2026-09-21）**：下表前几条里写的「无 remote / 无法 push 上游」是**当时**的事实。同日该克隆已接上远端 `origin → https://github.com/Tom-575/claude-sdlc-skill.git` 并推送 `d6eab14`，此后工具箱的每次修改都有 off-machine 备份。

| 日期 | 改动 | 去向 |
|---|---|---|
| 2026-09-19 | `inspect_sdlc_state.py` 的 FIELDS 由旧名改为 `plan/design/build/test/deploy/maintain` | 已提交工具箱本地仓库 `3a8332a`；**工具箱无 remote，无法 push 上游** → 本表即去向 |
| 2026-09-19 | `validate_sdlc_state.py` 不再硬编码 `<root>/shared`，改为候选探测 | 同上 |
| 2026-09-19 | `update_sdlc_state.py` 的 `add-artifact` 加**存在性守卫**：绝不用模板覆盖已存在的工件（本轮实测踩坑——已写好的 design/build/test 被空模板清空） | 已提交工具箱本地仓库；同上无 remote |
| 2026-09-19 | `refresh-index`（`sync_index`）改为**标记内重写**：只改 `<!-- changes:start -->` / `<!-- changes:end -->` 之间的行（旧格式首次运行会自动补上标记）。此前会连手写备注一起抹掉，实测被抹两次 | 同上 |
| 2026-09-19 | `advance` 不再沿用上一阶段的 gate：推进后新阶段一律置 `awaiting-human-review`（每个阶段各自 `set-gate` 一次），避免「`stage: maintain` + `gate: deployed-stable`」这种看不出未确认的组合 | 同上 |
| 2026-09-19 | navigator SKILL 补 **gate 词表**与 `awaiting-human-review` 的含义；`shared/artifact-contracts.md` 补**阶段↔字段名↔gate** 对照表与改名历史 | 同上 |
| 2026-09-19 | 新增 `.sdlc/templates/daily.md`（DAILY 模板）与 `scripts/check_artifacts_nonempty.py`（工件非空校验） | 同上 |
| 2026-09-20 | **6 个阶段 SKILL 各自写明 gate 值**（此前 `ai-sdlc-plan` 等只提「the Plan gate」，不写字符串，agent 无从得知） | 已提交工具箱 `6a7a512` |
| 2026-09-20 | 6 个工件模板**去掉 `status:` 行**（与 `lifecycle.yaml` 双写、已见漂移）；`shared/artifact-contracts.md` 明确：`lifecycle.yaml` 是唯一记录，工具写进工件的 `status:` 只是**给人看的镜像**，任何脚本都不读它 | 同上 |
| 2026-09-20 | `init_sdlc.py` 为 `learnings/`、`decisions/` 生成 README（空目录在 Git 里不存在，新人看不出用途） | 同上 |
| 2026-09-20 | `update_sdlc_state.py` 内指向 `plan.md` 的局部变量 `intent` → `plan_artifact`（改名残留） | 同上 |
| 2026-09-20 | 本机缓存清理：`.pytest_cache/`、`scripts/__pycache__/`、`tests/__pycache__/` | 可再生，无需提交 |
| 2026-09-21 | `advance` 补**存在性守卫**：字段为空但工件文件已存在时**只登记、不覆盖**（与 `add-artifact` 是同一个洞的另一扇门；实测 `v2-usage-refinement/design.md` 的 8KB 真内容只差一步被清成模板） | 已提交工具箱 `671afb1` |
| 2026-09-21 | `validate` 的 `^status:` / `^revision:` 正则 `\s*` → `[ \t]*`：`\s` 会吃掉换行，值为空的字段于是捕获**下一行**首词（实测把 `owner:` 当成 revision）。**该 bug 按阶段生效——stage 推到 build/test 才现形**，此前一直绿 | 同上 |
| 2026-09-19 | `.sdlc/changes/record-card-export-h5/design.md` 一处假 Markdown 链接（文件名模板被当成链接目标） | 随本项目提交 |
| 2026-09-21 | 两道专属门禁（code review / 真机走查）**并入 `validate_sdlc_state.py`**（`import check_artifacts_nonempty`）：此前是两个入口，容易「一个绿一个红」；现在 `validate` 一处跑完，`advance` 前跑它即可 | 同上 |
| 2026-09-21 | 新增 `.githooks/pre-commit`（进版本控制）+ `.gitattributes` 钉住 `.githooks/* eol=lf`。**启用需人工执行一次** `git config core.hooksPath .githooks`（Git 配置不进版本控制，agent 不得代改）。工具箱缺失时**跳过不拦**——`Tools/` 被 gitignore，换机器拦下来只会让人没法提交 | 随本项目提交；用法见 §10 末 |
| 2026-09-21 | `deploy.md` 真机走查门禁（`## 真机走查` 一节：有证据链接，或「未做 + 去向」），配套把 `ui-v2-redesign/deploy.md` 按事实补上该节 | 同上；规则见 §10 |
| 2026-09-21 | `check_artifacts_nonempty.py` 新增 **Test 阶段 code review 门禁**：登记了 `test` 工件的 change，其 `test.md` 必须含 `## Code review` 一节且段内 `Standards` / `Spec` 两轴齐全；纯流程 / 文档 change 可用「不适用 + 改动清单（≥60 字符）」窄豁免。**首版把段内的 `### Standards` 误当成截断点**（等于对真实项目误报），靠临时 probe 的 A/B/C 三态实测才发现并修 | 本机工具箱、无 remote → **本表即去向**；规则见 §9 |

> **`add-artifact` 的正确用法**：它**生成模板**，不是「登记已有工件的路径」。工件已经写好时**不要**调用它——`lifecycle.yaml` 里的路径是 `start` / `advance` 自动填的（守卫加了之后调用只会被拒绝，不会再有损失）。

**工具箱侧待办台账**：`CLAUDE_SDLC_TODO.md`（长期维护，含完成度与验收命令；`docs/TODO.md` #41 指向它）。概要：gate 词表写进 SKILL、`refresh-index` 局部重写、`advance` 不沿用旧 gate、「等待人工」状态、DAILY 模板、工件非空校验脚本。

## 7. 门禁铁律三处同文校验

铁律段用 `<!-- gate-rules:start -->` / `<!-- gate-rules:end -->` 标注，在 `AGENTS.md`、`CODEBUDDY.md`、`.codebuddy/rules/sdlc-gate/RULE.mdc` 三处**逐字相同**。改完跑这条比对——三行 hash 相同才算同步：

```bash
python - <<'PY'
import hashlib, re
from pathlib import Path
for f in ("AGENTS.md", "CODEBUDDY.md", ".codebuddy/rules/sdlc-gate/RULE.mdc"):
    m = re.search(r"<!-- gate-rules:start -->(.*?)<!-- gate-rules:end -->", Path(f).read_text(encoding="utf-8"), re.S)
    if not m:
        print("MISSING", f)
        continue
    # 必须归一行尾：三个文件在磁盘上的 EOL 可能不同（git 在 Windows 检出时会转 CRLF），
    # 逐字同文比的是内容，不是 EOL。
    body = m.group(1).replace("\r\n", "\n")
    print(hashlib.sha256(body.encode("utf-8")).hexdigest()[:12], f)
PY
```

判定：三行 hash 相同 = 同步；出现 `MISSING` = 某处丢了标记或整段被删。

## 8. 每日运行日志

见 `.sdlc/DAILY.md`：每轮会话结束追加一节，**凡写 passed 必挂证据链接**；「待决策」为空 = 当日无需人工动作。

## 9. Test 阶段的 code review 门禁（2026-09-21 起必须）

`code-review` 技能此前**没有触发点**——没有 hook、没有 CI、没有提交钩子，全靠人记得跑。
2026-09-21 用户裁决：**改成必须**。落地形态如下。

**硬要求**：`test.md` 里必须有一节 `## Code review`，且该节内**两轴（`Standards` / `Spec`）都要出现**。
两轴由**两个并行子代理**分别跑、**分开报告、不合并**（一轴过不能替另一轴背书）；
结论必须经作者逐条到代码复核，并在同一节里写明：**剔除的误报**、**未动的 judgement 项及理由**。

**固定点**：改动尚未提交时 = 当前 `HEAD`，被评审对象 = **工作区**
（`git diff HEAD` 导出成文件交给子代理——子代理跑不了 git；另附**未跟踪的新文件清单**）。
Spec 来源按 `code-review` 技能：本项目的 change `plan.md` / `design.md` / `docs/TODO.md` 条目 / `DESIGN.md` §2–§5。

**窄豁免**：当且仅当改动里**没有任何产品代码**（纯流程 / 文档 / 工具箱）时可写「不适用」，但必须：

1. 列出**改动清单**（改了什么、落在哪些目录）；
2. 说明用什么**替代方式**验证；
3. 整节不少于 60 字符（否则机械校验判为「太薄」）。

**机械校验**：`python Tools/claude-sdlc/scripts/check_artifacts_nonempty.py .`
对**每一个登记了 `test` 工件的活跃 change** 检查（不等到 `stage == test`），
所以提前写好的 `test.md` 也受同一把尺子管。不通过时 exit 1 并打印缺什么。

**为什么放进 `test.md` 而不是新增工件**：六阶段工件表不增加文件；评审是 Test 阶段的一部分，
不是额外产物——这正是 `changes/v2-usage-refinement/test.md` 与 `v2-device-feedback/test.md` 现在的写法。

## 10. 真机走查的证据门禁（2026-09-21 起必须）

**为什么加**：四期（#23–#32）与五期（V2）**各欠过一次**真机走查，两次都以「待走查」三个字挂在
`maintain.md` 的 Follow-up 里放行。代价是可量化的：用户在真机上第一天就撞到两个**桌面断言判过**的问题
（#42 第一步页返回卡死、#43 今天-痕迹横滑失效）。**「待走查」不是一个可以被放行的状态。**

**硬要求**：登记了 `deploy` 工件的 change，其 `deploy.md` 必须含一节 `## 真机走查`
（标题里出现「真机」或「真设备」即可），且这一节**二选一**：

1. **已走查**：给出**至少一条目标存在**的证据链接（截图 / 记录 / 日志），并写明设备与系统；
2. **未走查**：明说「未做 / 未测 / 未走查 / 待走查 / 阻塞」中的任一词，**且写明「去向」**
   （欠账记在哪个文件 / 哪个任务编号）——指向尚未落地的东西不算去向（与铁律 4 同一口径）。

两种都不满足 → 拦下：既不引证据、也不承认没做，拦；承认没做但不写去向，也拦。

**为什么是「二选一」而不是「必须做过」**：真机有时确实拿不到（本项目当前就没有可用的真机环境）。
机械校验能保证的只有「写清楚」，所以它不假装能保证「做过」；把「没做」变成一个**必须被记账**的状态，
已经比「待走查」强得多。

**机械校验**：随 §9 一起并入 `validate_sdlc_state.py`（见 §5）。

### 提交钩子：把门禁从「记得跑」变成「跑不了就交不上去」

```bash
git config core.hooksPath .githooks      # 每个克隆执行一次；Git 配置不进版本控制
```

- 钩子 `.githooks/pre-commit` **进版本控制**；`.gitattributes` 钉了 `.githooks/* eol=lf`
  —— CRLF 会让 `#!/bin/sh` 变成 `#!/bin/sh\r`，钩子直接死掉；
- 它跑的就是 `validate_sdlc_state.py`（含上面两道门禁）；
- **工具箱缺失时跳过并提示、不拦提交**：`Tools/` 被 gitignore，换机器时它本来就不在，
  拦下来只会让人没法提交；装好后（§1）自动生效；
- 绕过用 `git commit --no-verify`，但**绕过就要在 DAILY 里写理由**（与铁律 4 同源）。
