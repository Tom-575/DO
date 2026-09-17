# Deploy: UI V2 全套视觉与四屏闭环重做

status: not-released
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
| 当前状态 | not-released |

## Preconditions

- [x] Test verdict passed
- [ ] 人工确认三个待决项（见 plan.md Open decisions）
- [ ] 候选版本提交

## Rollout

本 change 内**不发布**。发布路径：`npm run build` → `dist/` 推到 GitHub Pages（`base: '/DO/'` 已配好）。
无迁移（新增字段均可选）、无回滚脚本（回退即回退提交）。

## Success signals

- 线上首页首屏为暖白今天页，底部四槽胶囊正常；
- 老用户（localStorage 已有设置）不被出发页拦下；
- 已有记录在痕迹页正常展示（无 outcome 的旧数据不显示结果后缀）。