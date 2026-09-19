# SDLC 运行日志（DAILY）

> **铁律**（TODO #21）
> 1. 每个窗口会话结束前追加一节；**凡写 passed 必挂证据链接**（写相对路径，且目标必须真实存在）。
> 2. 「待决策」为空 = 当日无需人工动作。
> 3. 只记**事实与决策**，不复述工件内容。
>
> 新增一节请复制文末的「模板」。

## 2026-09-19

**做了**

- change `ui-v2-redesign`（五期 V2）：四处待裁决策全部落地——分享卡封面不裁切、痕迹页去筛选、底部导航三槽不放「我的」、行动页保留三选不复刻「换一个建议」；两轴 code review 补齐并当场修净（3 处硬违规 + 死代码 + 9 处过期注释）。证据：`.sdlc/changes/ui-v2-redesign/test.md`、`.sdlc/evidence/ui-v2-redesign/`。
- 发布：`8a5925f`（V2 代码与工件）+ `192c8a4`（部署放行）推 `origin/main` → Pages 部署；线上产物哈希 `index-DfyYnmoi.js` 与本地构建一致。证据：`.sdlc/changes/ui-v2-redesign/deploy.md`。
- 工具箱：提交 `ebcb611`（阶段工件改名收尾 + 10 个 primitive skill 入库）、`3a8332c`（`inspect` 字段名对齐、`validate` 不再硬编码 `shared/`）。
- 流程资产：新增 `.sdlc/RUNBOOK.md`（工具用法唯一落点）；`.codebuddy/skills/` 补齐 17 个薄封装并改指工具箱本体；**首个 `validate_sdlc_state.py` 转绿**（此前恒红）。
- 决策 B：删除旧运行时快照 `.zcode/`；skill 正文只在 `Tools/claude-sdlc/`。

**待决策**

- 无（本轮四项裁决均已落地）。

**遗留**

- 真机（iOS / 安卓）走查未做 → 记在 `.sdlc/changes/ui-v2-redesign/maintain.md` 与 `docs/TODO.md`。

## 2026-09-19（第二轮：SDLC 工具链对齐，change `sdlc-toolbox-alignment`）

**做了**

- 工具箱（`Tools/claude-sdlc/`，独立 git、被 gitignore）：提交 `ebcb611`（56 项：阶段工件改名收尾 + 10 个 primitive skill 入库）、`3a8332a`（`inspect` 的 FIELDS 对齐新名；`validate` 不再硬编码 `<root>/shared`）。**`validate` 在本项目首次转绿**。
- 本项目：门禁文档三分（`AGENTS.md` / `CODEBUDDY.md` / `RULE.mdc` 只留铁律 4 条，`gate-rules` 标记 + 归一行尾的 hash 校验）；新增 `.sdlc/RUNBOOK.md`（工具用法唯一落点）与 `.sdlc/DAILY.md`（本文件）；`.codebuddy/skills/` 由 2 个补到 **17 个**并改指工具箱本体。
- 提交 `a778123`（29 文件，+775/−74）。证据：`.sdlc/changes/sdlc-toolbox-alignment/`。
- 修正两处**错误知识**：`refresh-index` 的重写范围是 `## Current State` → `## Active Decisions`（不是我先前写的「只有 Active Changes 段」，实测被抹两次）；「等待人工」其实有表达方式——`start` / `rollback` 的默认 gate 就是 `awaiting-human-review`。

**待决策**

- `.zcode/` 删除待人工确认（`git rm -r .zcode` 三次因授权弹窗超时被取消；引用已全部改指工具箱，删除不留断链）。
- `CLAUDE_SDLC_TODO.md` 是否删除（已随 `a778123` 入库，删了可从 git 恢复）。

**遗留**

- **发现并行会话**：另一会话在 2026-09-19 17:3x 建了 change `v2-device-feedback`（真机反馈：第一步页返回卡死 / 今天-痕迹横滑手势失效 / 念头卡去示例 chip），并改了 4 个源码文件 + `DESIGN.md` + `ui-v2-redesign/{build,maintain}.md`。本轮提交已刻意隔离，未卷入其在建改动；`.sdlc/INDEX.md` 与 `lifecycle.yaml` 因被双方写入而留给最后收尾的一方提交。**建议串行化窗口**。
- 工具箱行为项（`refresh-index` 局部重写、`advance` 沿用旧 gate、gate 词表进 SKILL、工件非空校验脚本等）→ `docs/TODO.md` #41。

---

## 模板

```markdown
## YYYY-MM-DD

**做了**

- <change-id>：<一句事实>；证据：<相对路径>。

**待决策**

- <需要人工拍板的一件事 + 两个选项>（没有就写「无」）

**遗留**

- <未做/有风险的项> → 去向：<已落地的记录位置>
```
