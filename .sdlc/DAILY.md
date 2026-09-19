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
