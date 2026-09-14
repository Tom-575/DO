# Deploy: 三期图片体验:卡片封面原比例显示 + 回忆页全屏看图(小红书式滑动)

status: accepted
candidate_revision: 提交「三期图片体验(#16/#17)」(hash 见 Deployment result)
source_evidence: test.md
release_owner: trae-agent
issue:
pr:
target_environment: production(GitHub Pages,push main 自动部署)
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | image-experience-h5 |
| 阶段负责人 | trae-agent |
| 发布版本 | push main → Actions build & deploy |
| 验证记录 | test.md |
| 目标环境 | production |
| 当前状态 | draft |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Preconditions

- [x] Test verdict passed or exception approved(test.md 8/8)
- [x] Required approvals complete(各 gate 已记录 approver)
- [x] Migration ready(无 schema 变更,SCHEMA_VERSION 仍为 1)
- [x] Rollback ready(git revert 单提交即可)
- [x] Monitoring available(GitHub Actions run 状态 + 用户真机反馈)

## Rollout

push main,GitHub Actions 自动构建并发布 GitHub Pages(与 #10 既有管线一致)。

## Migration

无。纯渲染层变更,数据契约不变。

## Rollback

`git revert <deploy commit>` + push,Actions 自动重发布。

## Success signals

- Actions run 绿色,Pages 更新为新构建。
- 用户真机:竖图导出卡片不裁切;点图全屏、横滑切换顺滑、无背景滚动穿透。

## Approval

- approved_by: user(对话发起并确认方案 2026-09-14)
- approved_at: 2026-09-14

## Deployment result

- commit 90e28f8(90e28f8c438dbb34db4a2a80c446dadc194938f7)push main 2026-09-14
- GitHub Actions「Deploy to GitHub Pages」run 34849772765(run_number 13):completed / success
- Pages 线上已更新

## Post-deploy checks

- [x] Actions run 成功(run 34849772765)
- [x] Pages 线上版本含 #16/#17(run 构建自该 commit)
- [ ] 用户真机走查(待用户:竖图卡片不裁切、点图全屏、横滑顺滑、无背景滚动穿透)
