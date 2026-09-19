# Plan: SDLC 工具链对齐（删旧 IDE 快照 / 补发现入口 / 门禁文档重排 / 工具修复留档）

status: accepted
owner: codebuddy-agent
source: 用户 2026-09-19「Tool 中的 SDLC 工具箱有什么需要优化更新的」「把无关的清理一下」+ `CLAUDE_SDLC_TODO.md` 逐条过目后开工
issue:
pr:
risk_level: low
created_at: 2026-09-19
updated_at: 2026-09-19

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | sdlc-toolbox-alignment |
| 阶段负责人 | tom57 |
| 来源类型 | maintenance（工具链与流程文档） |
| 来源引用 | `CLAUDE_SDLC_TODO.md`（本轮逐条核对本机事实后写成） |
| 风险等级 | low（不碰产品代码；改动集中在流程文档、skill 发现入口与工具箱脚本） |
| 当前状态 | accepted |

## Problem

三件事叠在一起，让「这套 SDLC 工具箱在本项目怎么用」变成了口头传统：

1. **工具用法无处可查**：gate 词表只活在 `update_sdlc_state.py` 的 GATES 字典里（实测传错即拒），装工具箱的步骤更是哪儿都没写，于是每个 agent 都要撞一次。
2. **同一段门禁文字抄了三处**（`AGENTS.md` 31 行 / `CODEBUDDY.md` / `.codebuddy/rules/sdlc-gate/RULE.mdc`），改一处要同步三处，且没有任何机械校验。
3. **发现入口残缺 + 一份过时快照**：17 个 skill 只有 2 个有薄封装（阶段技能全缺，navigator 要求「加载对应阶段技能」时只能靠人记得手读）；`.zcode/` 是旧 IDE 留下的整份副本，`Tools/claude-sdlc/` 才是维护点。

附带发现（同批处理）：`inspect_sdlc_state.py` 字段名与工具箱其余部分不一致（给出**错误指令**）、`validate_sdlc_state.py` 硬编码 `<root>/shared/` 导致校验恒红、`Tools/claude-sdlc` 有 **56 项未提交改动**、历史工件一处假 Markdown 链接。

## Desired outcome

- 工具用法**只有一个落点**：`.sdlc/RUNBOOK.md`；项目约定只保留**铁律 4 条**并指向它，三处同文可机器校验。
- 当前 IDE 能**自动发现全部 17 个 skill**（薄封装指向工具箱本体，且指针失效时有明确回落步骤）。
- `inspect` / `validate` 两个脚本给出**正确**指令：`Missing: none`、`SDLC state is valid`。
- 旧 IDE 快照 `.zcode/` 删除；工具箱的 56 项改动与其后的修复都已提交（有回滚点）。
- 待办有去向：工具箱侧剩余项进 `docs/TODO.md` #41；日常运行有 `.sdlc/DAILY.md`。

## Scope

### In scope

1. `Tools/claude-sdlc/`：提交 56 项改动；修 `inspect` FIELDS、修 `validate` 的 `shared/` 路径假定。
2. 本项目：删 `.zcode/`；`.codebuddy/skills/` 补齐 17 个薄封装并改指工具箱本体；新增 `.sdlc/RUNBOOK.md`、`.sdlc/DAILY.md`。
3. 门禁文档重排：`AGENTS.md`（46→52 行但成分变化：约定+项目事实）、`CODEBUDDY.md`（34→33 行，只留入口与坑）、`RULE.mdc`（28→24 行）；三者铁律段**逐字同文 + `gate-rules` 标记 + hash 校验命令**。
4. 顺手修：`INDEX.md` 指向已删目录的 4 个链接、一条过期学习记录、`memory-export-overlap-fix` 的 status 漂移、历史工件假链接。

### Out of scope

- 工具箱的行为改动：`refresh-index` 局部重写、`advance` 不沿用旧 gate、「等待人工」状态、DAILY 模板、工件非空校验脚本 → 列入 #41，单独提。
- 搬动工具箱目录（决策 B 已定：删快照、指向本体）。
- 产品代码与 V2 UI（已由 `ui-v2-redesign` 交付）。

## Constraints

- 工具箱本体被 `.gitignore` 忽略 → 脚本修复**换机器会丢**，必须在 `.sdlc/RUNBOOK.md` 留档（#20 判据：去向必须已落地）。
- 该克隆**没有 remote** → 无法 push 回上游，留档位置只能是本项目。
- 删 `.zcode/` **必须晚于**引用更新，否则中途是断链状态。
- 同文校验**必须归一行尾**：三文件在磁盘上的 EOL 不同（首版校验因此误报）。

## Success criteria

- [ ] `python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .` → `Missing: none`
- [ ] `python Tools/claude-sdlc/scripts/validate_sdlc_state.py .` → `SDLC state is valid`
- [ ] 铁律段三处 hash 相同；`.codebuddy/skills/` 17 个薄封装的指向目标存在
- [ ] `.zcode/` 已从版本控制移除（`git ls-files .zcode` 为空）
- [ ] 工具箱两个提交有记录（`ebcb611`、`3a8332a`），工作区干净

## Open decisions

- [x] 旧快照 `.zcode/` 去留 → **B：删除**（用户 2026-09-19）
- [x] 工具箱 56 项由谁提交 → 我提交（用户「开始」）
- [x] 「等待人工」怎么表达 → 正交字段 `pending:`（列入 #41，本轮不改脚本行为）
- [x] `memory-export-overlap-fix` 的 status 漂移 → 回退 `accepted`
- [x] `CLAUDE_SDLC_TODO.md` 去向 → 拆分完成即删
