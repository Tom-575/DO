# Deploy: V2 使用细化 —— 入口改「DO」且无 AI 直跳 / 关联念头提升 / 时长档位 5-15-自定义

status: deployed
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
| 变更编号 | v2-usage-refinement |
| 阶段负责人 | tom57 |
| 发布版本 | 与 change `v2-device-feedback` **同批**：一次 push 出一个产物 |
| 验证记录 | test.md（29 条桌面断言全绿 + 两轴 code review） |
| 目标环境 | GitHub Pages `https://tom-575.github.io/DO/`（纯静态，无后端、无迁移） |
| 当前状态 | released（2026-09-21） |
| 创建时间 | 2026-09-21 |
| 更新时间 | 2026-09-21 |

## Preconditions

- [x] Test verdict passed（test.md 的 `pass`；含两轴 code review）
- [x] Required approvals complete（用户 2026-09-21 批准方案 A：补齐工件并发布）
- [x] Migration ready —— 无需迁移：`action.time` 仍是人读字符串，只是取值来源收敛为「用户选择」
- [x] Rollback ready —— 回退提交即可（纯静态资源）
- [x] Monitoring available —— 无监控服务，用「线上产物哈希与本地构建一致」做冒烟判据

## Rollout

一次 `push origin main` → `.github/workflows/deploy.yml` → GitHub Pages。
与 `v2-device-feedback` 同批：两者改的是同几个文件（`TodayPage` / `ActionPage` / `RecordPage` / 样式），
拆开发只会制造一个「返回修了但时长没改」的中间态。

## Rollback

`git revert` 那两个提交后 push；Pages 会重新部署上一版。用户侧无需清缓存（产物名带内容哈希）。

## Success signals

- 线上 `index.html` 引用的产物 = 本地 `npm run build` 的产物（内容哈希一致）；
- 没配 AI 时点「DO」**直接进第一步页**（不再经过对话页，也是 #46 的目的）；
- 时长档位是 `5 / 15 / 自定义`，且**永远有一个档位是选中的**（AI 建议的 10 分钟吸附到 15）；
- 记录页工具行只剩三颗，**「关联一个念头」独立成行**且点开候选就地展开。

## Approval

- approved_by: tom57
- approved_at: 2026-09-21
- note: 用户当日批准方案 A（补齐 deploy 工件并发布线上）；逐阶段 gate 由该次批准覆盖。

## Deployment result

（推送后回填：提交号、Actions run、线上产物哈希对比。）

## Post-deploy checks

| 检查 | 结果 |
|---|---|
| 线上为新构建（产物哈希与本地一致） | 推送后回填 |
| 旧数据向前兼容（无 schema 变化） | 依据 test.md 的代码路径核对（无迁移） |
| 老用户不被出发页拦下（`onboarded` 缺省归一为 true） | 依据 test.md 的代码路径核对 |

## 真机走查

**未做**（写就时只有桌面模拟与本机 dev server 的结论）。这是本 change 从 `deployed-stable` 转「稳定」的**阻塞项**：

- 待验项：没配 AI 时点「DO」的跳转、自定义时长输入在手机上的数字键盘与光标、记录页关联行的可点区域与整页长度。
- **去向**：`test.md` 的「放行后的必做项」已列为阻塞项；相关任务在 `docs/TODO.md` 六期 #46–#48。
- 与同批的 `v2-device-feedback` 一起在线上验：这两个 change 的改动互相咬合（同一个第一步页），
  分开验没有意义。
