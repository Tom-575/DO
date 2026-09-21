# Deploy: V2 真机反馈 —— 第一步页返回卡死 / 今天-痕迹横滑手势失效 / 念头卡去示例 chip

status: accepted
candidate_revision: 工作区（HEAD 之后，未提交）
source_evidence: test.md
release_owner: tom57
issue:
pr:
target_environment: GitHub Pages（https://tom-575.github.io/DO/）
created_at: 2026-09-21
updated_at: 2026-09-21

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | v2-device-feedback |
| 阶段负责人 | tom57 |
| 发布版本 | 与 change `v2-usage-refinement` **同批**：一次 push 出一个产物 |
| 验证记录 | test.md（29 条桌面断言全绿 + 两轴 code review） |
| 目标环境 | GitHub Pages `https://tom-575.github.io/DO/`（纯静态，无后端、无迁移） |
| 当前状态 | released（2026-09-21） |
| 创建时间 | 2026-09-21 |
| 更新时间 | 2026-09-21 |

## Preconditions

- [x] Test verdict passed（test.md 的 `pass`；含两轴 code review）
- [x] Required approvals complete（用户 2026-09-21 批准方案 A：补齐工件并发布）
- [x] Migration ready —— 无需迁移：本轮不动 schema，无新字段
- [x] Rollback ready —— 回退提交即可（纯静态资源）
- [x] Monitoring available —— 无监控服务，用「线上产物哈希与本地构建一致」做冒烟判据

## Rollout

一次 `push origin main` → `.github/workflows/deploy.yml` → GitHub Pages。
两个 change（`v2-device-feedback` + `v2-usage-refinement`）同批发布，因为它们改的是同几个文件，
拆开发只会制造一个中间态。

## Rollback

`git revert` 那两个提交后 push；Pages 会重新部署上一版。
用户侧无需清缓存，`index.html` 引用的产物名带内容哈希。

## Success signals

- 线上 `index.html` 引用的产物 = 本地 `npm run build` 的产物（内容哈希一致）；
- 手机打开：编辑态第一步页点返回**一次到位**（#42）；
- 手机打开：今天 ↔ 痕迹**手指能滑**且越过中点指示跟手（#43）；
- 首页念头卡不再出现三个示例 chip（#44）。

## Approval

- approved_by: tom57
- approved_at: 2026-09-21
- note: 用户当日批准方案 A（补齐 deploy 工件并发布线上）；逐阶段 gate 由该次批准覆盖。

## Deployment result

- 提交 `3b974e5` 已推送 `origin/main`（`89dbaf1..3b974e5`）；`.github/workflows/deploy.yml` 触发并完成。
- 线上冒烟（`https://tom-575.github.io/DO/`）：`index.html` 引用的产物 = `assets/index-Cmm2L0p8.js`
  / `assets/index-B8rwtE3P.css`，与本地 `npm run build` 的产物**完全一致**。
  升级前线上是 `index-DfyYnmoi.js`（2026-09-17 的 V2）——确认是换代，不是缓存。

## Post-deploy checks

| 检查 | 结果 |
|---|---|
| 线上为新构建（产物哈希与本地一致） | **通过**：`index-Cmm2L0p8.js` / `index-B8rwtE3P.css` |
| 旧数据向前兼容（无 schema 变化） | 依据 test.md 的代码路径核对（无迁移） |

## 真机走查

**未做**（本文件写就时仍是桌面模拟 + 本机 dev server 的结论）。这是本 change 从 `deployed-stable` 转「稳定」的**阻塞项**：

- 待验项（也是本次上线的目的）：编辑态第一步页返回是否一次到位；今天 ↔ 痕迹手指能否滑动、指示是否跟手。
- **去向**：`test.md` 的「放行后的必做项」已列为阻塞项；问题清单与后续动作在 `docs/TODO.md` 六期 #42–#45。
- 为什么这次先发：这两个缺陷**正是线上版本造成的**（用户 2026-09-19 在真机上撞到），
  线上是当前唯一方便真机复验的入口（局域网 dev server 需要同一 Wi-Fi）。
  即「先发再验」在这里是**为了把真机验证变成可能**，而不是跳过它。
