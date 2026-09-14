# Deploy: 修复回忆条目导出按钮与时间文字重叠

status: active
candidate_revision: 提交(见 Deployment result)
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
| 变更编号 | memory-export-overlap-fix |
| 阶段负责人 | trae-agent |
| 发布版本 | push main → Actions build & deploy |
| 验证记录 | test.md |
| 目标环境 | production |
| 当前状态 | draft |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Preconditions

- [x] Test verdict passed(test.md 全过)
- [x] Required approvals complete
- [x] Migration ready(无 schema 变更)
- [x] Rollback ready(git revert 单提交)
- [x] Monitoring available(Actions run + 用户反馈)

## Rollout

push main,既有 GitHub Pages 管线自动发布。

## Migration

无。

## Rollback

`git revert <deploy commit>` + push。

## Success signals

- Actions run 绿色;线上时间行不再被导出按钮遮挡。

## Approval

- approved_by: user(截图反馈 2026-09-14)
- approved_at: 2026-09-14

## Deployment result

(推送后回填)

## Post-deploy checks

- [ ] Actions run 成功
- [ ] 用户真机确认时间完整显示
