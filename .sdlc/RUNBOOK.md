# SDLC RUNBOOK（本项目怎么用这套工具箱）

> **定位**：**工具用法**只写在这里。`AGENTS.md` / `CODEBUDDY.md` / `.codebuddy/rules/sdlc-gate/RULE.mdc` 只写「必须用它」的铁律并指向本文件——同一段说明不再三处复制。
> **维护点**：工具箱本体 `Tools/claude-sdlc/`（**被 `.gitignore` 忽略**，自带独立 git 仓库、**无 remote**）。
> **决策 B（2026-09-19）**：旧运行时留下的 skill 快照 `.zcode/` **已删除**，skill 正文只在工具箱本体里。

## 1. 装工具箱三步（新机器 / 裸克隆）

1. 把 claude-sdlc 工具箱克隆或拷贝到 `Tools/claude-sdlc/`（该目录被 gitignore，不进版本控制）。
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

两个已知现象（工具箱待修，见第 6 节）：

- **`refresh-index` 的重写范围**：源码 `sync_index()` 覆盖 **`## Current State` 到 `## Active Decisions` 之间的一切**（不是只有 Active Changes 那一段）。手写内容必须放在 **`## Active Decisions` 之后**——放中间会被整段抹掉（2026-09-19 实测被抹两次；`INDEX.md` 的 `## Change Artifacts` 段因此放在 Active Decisions 之后）。
- **`advance` 会把传入的 gate 写进新阶段**（`found["gate"] = args.gate`），于是出现 `stage: maintain` + `gate: deployed-stable` 这类组合——机器状态里看不出「新阶段还没人工确认」。要表达「等人工」就显式把 gate 置回 `awaiting-human-review`。

## 4. 每阶段必需工件（`lifecycle.yaml` 的字段名 = 工件名）

| 阶段 | 必需字段 | 文件 |
|---|---|---|
| plan | `plan` | `.sdlc/changes/<id>/plan.md` |
| design | `plan`, `design` | + `design.md` |
| build | + `build` | + `build.md` |
| test | + `test` | + `test.md` |
| deploy | + `deploy` | + `deploy.md` |
| maintain | `maintain` | `maintain.md` |

**字段名历史**：旧名 `intent / change / evidence / release / learning` 已于 2026-09-19 由工具箱统一改名；见到旧名按本表换算。

`validate_sdlc_state.py` 会检查：工件存在、`status:` 取值合法、`revision:` 能在 git 里找到、`.sdlc/**/*.md` 的相对链接有目标、`INDEX.md` 的 Active changes 计数与 `lifecycle.yaml` 一致。

## 5. 工件非空铁律（TODO #22）

当前阶段该有的工件必须非空：**验收表有行、证据链接有目标**。链接目标不存在 = 等于没有证据。

## 6. 本机改动与去向（换机器会丢，故在此留档）

| 日期 | 改动 | 去向 |
|---|---|---|
| 2026-09-19 | `inspect_sdlc_state.py` 的 FIELDS 由旧名改为 `plan/design/build/test/deploy/maintain` | 已提交工具箱本地仓库 `3a8332a`；**工具箱无 remote，无法 push 上游** → 本表即去向 |
| 2026-09-19 | `validate_sdlc_state.py` 不再硬编码 `<root>/shared`，改为候选探测 | 同上 |
| 2026-09-19 | `update_sdlc_state.py` 的 `add-artifact` 加**存在性守卫**：绝不用模板覆盖已存在的工件（本轮实测踩坑——已写好的 design/build/test 被空模板清空） | 已提交工具箱本地仓库；同上无 remote |
| 2026-09-19 | `.sdlc/changes/record-card-export-h5/design.md` 一处假 Markdown 链接（文件名模板被当成链接目标） | 随本项目提交 |

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
