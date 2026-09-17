# Deploy: UI V2 全套视觉与四屏闭环重做

status: accepted
candidate_revision: 工作树（未提交）
source_evidence: test.md
release_owner:
created_at: 2026-09-17
updated_at: 2026-09-17

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | ui-v2-redesign |
| 阶段负责人 | tom57 |
| 验证记录 | test.md |
| 目标环境 | GitHub Pages（`https://tom-575.github.io/DO/`） |
| 当前状态 | released（2026-09-17） |
| 发布版本 | `8a5925f`（77 files, +3218 / −1599） |

## Preconditions

- [x] Test verdict passed（含两轴 code review）
- [x] 四处待决项已由用户裁决（plan.md Open decisions 全 `[x]`）
- [x] 候选版本已提交（`8a5925f`）

## Rollout

用户 2026-09-17 指示「发布」。发布路径：push `main` → `.github/workflows/deploy.yml` → GitHub Pages（`base: '/DO/'`）。
无迁移（新增字段均可选）、无回滚脚本（回退即回退提交）。

## Success signals

- 线上首页首屏为暖白今天页，底部四槽胶囊正常；
- 老用户（localStorage 已有设置）不被出发页拦下；
- 已有记录在痕迹页正常展示（无 outcome 的旧数据不显示结果后缀）。

## Approval

- approved_by: tom57（对话中确认「发布」）
- approved_at: 2026-09-17

## Deployment result

- 提交 `8a5925f` 已推送 `origin/main`；`.github/workflows/deploy.yml` 触发并完成。
- 线上冒烟（`https://tom-575.github.io/DO/`）：引用的构建产物 = `assets/index-DfyYnmoi.js`，
  与本地 `npm run build` 产出的哈希**完全一致**；`index.html` 含 Bebas Neue 字体链接 → 确认为本次构建，非旧缓存。

## Post-deploy checks

| 检查 | 结果 |
|---|---|
| 线上为新构建（产物哈希一致） | 通过 |
| 字体链接随构建上线 | 通过 |
| 存储向前兼容（无迁移、旧数据不崩） | 依据 test.md 的代码路径核对（无 schema 迁移） |
| 移动端真实首屏 | **未测**（GUI 沙箱不可用，需真机/手动打开） |