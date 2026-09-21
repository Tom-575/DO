# SDLC 运行日志（DAILY）

> **铁律**（TODO #21）
> 1. 每个窗口会话结束前追加一节；**凡写 passed 必挂证据链接**（写相对路径，且目标必须真实存在）。
> 2. 「待决策」为空 = 当日无需人工动作。
> 3. 只记**事实与决策**，不复述工件内容。
>
> 新增一节请复制文末的「模板」。

## 2026-09-21 · review 门禁

**做了**

- **`code-review` 提为 Test 阶段必需（TODO #49，用户裁决「改成必须」）**。三处落点：
  ① `.sdlc/RUNBOOK.md` **§9**（硬要求：`test.md` 必须含 `## Code review` 且 `Standards` / `Spec` 两轴齐全；固定点与「两轴不合并」；纯流程 change 的窄豁免必须列改动清单且 ≥60 字符）；
  ② `check_artifacts_nonempty.py` **新增机械校验**——凡是登记了 `test` 工件的 change 一律检查，**不等到 `stage == test`**，提前写的 `test.md` 受同一把尺；
  ③ `AGENTS.md` 铁律段外加一句指针（铁律段三处同文不受影响，hash 无需重算）。
- 三个既有 `test.md` 按新尺补齐：`v2-usage-refinement`（补写两轴结论）、`v2-device-feedback`（评审结论从「后续影响」提升为独立 `## Code review` 节）、`sdlc-toolbox-alignment`（**窄豁免**：改动全在流程/工具层，`git log --name-only 192c8a4..HEAD` 核实无 `prototypes/` 改动，附六项改动清单与替代验证说明）。
- **门禁五态实测**（临时 probe，跑在 `%TEMP%`，不落本仓库）：A 无 review 节 → 拦；B 两轴齐 → 放行；C 只有一轴 → 拦（`missing axis: Spec`）；D 豁免但太薄 → 拦；E 豁免且写明清单 → 放行；F 真实项目 → 放行。
- **probe 顺带抓出首版脚本的 bug**：`review_section` 把段内必然出现的 `### Standards` 当成截断点，等于**对真实项目的两个 test.md 误报**——只做正向验证（跑通就算过）根本发现不了，是三态实测逼出来的。
- **真机走查提为 Deploy 阶段必需（TODO #50）**：`deploy.md` 必须含 `## 真机走查`，且二选一——给出**目标存在**的证据链接，或明说「未做」+ 写明欠账**去向**。四期与五期各欠过一次真机走查、两次都以「待走查」三个字放行，代价是用户在真机第一天撞到 #42 / #43（两条都是**桌面断言判过**的）。从今天起**「待走查」不再是可放行状态**。`ui-v2-redesign/deploy.md` 已按事实补上该节（未做 + 阻塞转稳定 + 去向指向 `v2-device-feedback`）。四态实测：无节 → 拦 / 有证据 → 放行 / 未做无去向 → 拦 / 未做有去向 → 放行。
- **门禁并入口 + 提交钩子（TODO #51）**：两道专属门禁（§9 review、§10 真机）与通用非空检查**并入 `validate_sdlc_state.py`**（此前两个入口容易「一个绿一个红」），`advance` 前跑一次 `validate` 即可；新增 `.githooks/pre-commit`（进版本控制）+ `.gitattributes` 钉 `eol=lf`（CRLF 会让 `#!/bin/sh` 变 `#!/bin/sh\r`，钩子直接死）。钩子跑的就是 `validate`，工具箱缺失时**跳过不拦**（`Tools/` 被 gitignore，换机器拦下来只会让人没法提交）。

**待决策**

- **提交钩子需要你手动启用一次**：`git config core.hooksPath .githooks`（Git 配置不进版本控制，agent 不得代改）。不启用则钩子不生效，门禁退回「靠人记得跑」。
- 两个 change 的 gate 放行（`v2-device-feedback` / `v2-usage-refinement`）仍未批。
- `snapToOption`（AI 时长吸附到最近档位）仍是假设：若用户想「恒定 5 分钟」，改一处即可。
- **工具箱是否该进版本控制**：CI 门禁目前**不可能**（`Tools/` 被 gitignore，校验脚本不在仓库里）。要么接受本地钩子，要么把校验器搬进仓库、工具箱只留 skill 正文——取舍待拍板。

**遗留**

- 门禁是**命令**不是**钩子**（靠人记得跑）→ 去向：`docs/TODO.md` #41 ⑨ 与 `CLAUDE_SDLC_TODO.md`（可做成 pre-commit）。
- 豁免的边界「有没有产品代码」仍需人判断，机械校验只能查「有没有写」→ 去向：`RUNBOOK.md` §9 的文字边界 + 本节 D/E 两条实测。

---

## 2026-09-20 · 使用细化轮

**做了**

- **两轴 code review**（固定点 `9803f28`，覆盖两个 change 的全部代码，两个并行子代理分别跑 Standards / Spec）：
  确认并修掉 **4 处 §5 动效契约硬违规**（自定义面板误用带位移的 `popIn` 且参数越界 → 改容器高度展开；
  `.record-link` 按下缩放 0.99 越出 0.84–0.96 区间 → 0.96；箭头只有 `transition` 没有变换 → 补按下右移 2px）
  与 **4 处 spec 偏差**（越界夹取无断言 → 补断言；`commit` 无条件改写 `action.time` → 加 `timeTouched`；
  design 说候选列表「一字不动」与实现矛盾 → 改文档；`candidate_revision` 过期 → 更新）。
  断言随之从 27 条增至 **29 条**。结论与「未动的 judgement 项」逐条记在
  `changes/v2-usage-refinement/test.md` 的「Code review」。
- change `v2-usage-refinement`（六期 #46–#48，三处体验改动）：① 首页入口「帮我找到第一步」改名「DO」，`isAIConfigured` 为假时**跳过对话**直达第一步页（判据复用 `lib/ai.ts` 的导出版本，不另写一套）；② 记录页「关联一个念头」从工具行移出、独立成行，候选列表一并从页面底部移到入口正下方；③ 时长档位 `[10,30,60]` → `[5,15]` + 自定义（1–90，就地展开输入），AI 的建议时长改为**吸附到最近档位**、只决定初始选中项（10 → 15），删掉 `durationUnit` / `durationFigure` 两套单位。证据：`.sdlc/changes/v2-usage-refinement/`、`.sdlc/evidence/v2-usage-refinement/`（3 张新图）。
- 验证：`npm run verify` **27 / 27**（本轮新增 11 条 + 前两轮 16 条回归）；`typecheck` / `build` 通过（`index-B7Kjk_Pa.js`）。脚本加 `EVIDENCE_DIR`，截图按 change 归目录。
- 文档：`DESIGN.md` §2.1 / §2.2 / 记录页段、`CONTEXT.md` 已确认边界 +3 条、`docs/TODO.md` 六期 + #46/#47/#48、`INDEX.md` 手写区与 learnings 各一条。

**待决策**

- 两个 change 的 gate 放行（`v2-device-feedback` / `v2-usage-refinement`）都停在 `plan` / `awaiting-human-review`。
- `snapToOption`（AI 时长吸附）是按用户「不要 AI 建议值」推定的假设：AI 说 10 分钟时大字显示 15。若要「恒定 5 分钟」，改一处即可。
- 设置页「AI 状态显示」（本地模拟 / 已接入）是会话中提过、用户未表态的一项，未做。

**遗留**

- 真机确认（入口「DO」的分流 / 自定义输入的数字键盘与光标 / 关联行的可点区域）→ 去向：`changes/v2-usage-refinement/test.md`「放行后的必做项」+ `INDEX.md` 开放跟进。
- 行动正文里写的时长（如「走 10 分钟」）与用户所选档位仍可能不一致 → 去向：`changes/v2-usage-refinement/test.md` Residual risk 1。

---

## 2026-09-19 · 真机反馈轮

**做了**

- change `v2-device-feedback`（六期 #42–#44，三处代码改动）：① 第一步页返回改走 `useExpandTransition().leave()` 收回首页——原路径把屏幕设回对话页，而对话页挂载即重发念头、落定后又推回第一步页，形成「返回 → 弹回」循环；② `App.tsx` 的 `tab → 分页位置` effect 增加来源判定（`tabFromGesture`），手势驱动的那一次只对账、不调用 `scrollTo`——原实现在手指拖拽期间做程序化滚动，真机上即「滑一下就弹回」；③ 念头卡删掉三个示例 chip 与 `.idea-chips` 样式。证据：`.sdlc/changes/v2-device-feedback/`（plan / design / build / test）、`.sdlc/evidence/v2-device-feedback/`（4 图）。
- 验证：`npm run verify` —— **脚本已入库**（`prototypes/first-loop/scripts/verify.mjs`，headless Chrome + CDP，16/16 通过），含两条在修改前必然失败的对照断言：手势不再触发 `scrollTo`、返回路径不再渲染对话页；`npm run typecheck` / `npm run build` 通过（产物 `index-DrdySpHj.js`）。本地 dev server 已起（`http://192.168.110.144:4173/DO/`），手机同 Wi-Fi 可直接做人工走查。
- 文档：`DESIGN.md` §2.1/§2.2/§5.0 同步（念头卡去 chip、行动页返回语义、状态与位置谁在推进）；`docs/TODO.md` 新增六期 #42–#45 并给流程修复段补标题；`INDEX.md` 加 learnings 一条。

**待决策**

- 六期四件的 gate 放行：change 停在 `plan` / `awaiting-human-review`，plan + design + build + test 已齐（含证据），是否放行？
- `#45` 卡片改版：需一轮讨论（画幅 / 封面是否翻案 `#16` 不裁切 / 模板数量 / 信息层级 / 导出尺寸），六个维度已列在 change 的 plan.md「Open decisions」。

**遗留**

- **真机确认未做**（编辑态返回 / 今天-痕迹横滑）——这是本 change 转稳定的阻塞项 → 去向：`changes/v2-device-feedback/test.md`「放行后的必做项」+ `INDEX.md` 开放跟进。
- 记录页返回、全屏查看器手势未纳入本轮 → 去向：`changes/v2-device-feedback/plan.md` Out of scope（若确为同类缺陷，另开任务编号）。

---

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
