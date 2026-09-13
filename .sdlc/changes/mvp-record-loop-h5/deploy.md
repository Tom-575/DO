# Deploy: MVP:记录闭环 H5(今天 + 记录 + 回忆)

status: accepted
candidate_revision: 531b570
source_evidence: .sdlc/changes/mvp-record-loop-h5/test.md
release_owner: tom57
issue:
pr:
target_environment: GitHub Pages(https://tom-575.github.io/DO/)
created_at: 2026-09-13
updated_at: 2026-09-13

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | mvp-record-loop-h5 |
| 发布负责人 | tom57 |
| 目标环境 | GitHub Pages(生产,公开 URL) |
| 当前状态 | 已发布上线(run 34758824216 success,2026-09-13);剩真机走查 |

## 部署内容与方式

- `.github/workflows/deploy.yml`:push 到 main 自动构建(vite build,base=/DO/)
  并发布到 GitHub Pages;concurrency 排队不取消
- 代码已全部推送至 main(531b570),push 已触发 workflow

## 放行清单(人工,当前阻塞点)

- [x] **GitHub 仓库 Pages Source 选「GitHub Actions」**
      ✅ 2026-09-13 由 ZCode 经 API 创建 Pages 站点(build_type=workflow)完成,此前所有 run 均因此失败
- [x] Actions 运行成功,https://tom-575.github.io/DO/ 可访问
      ✅ run 34758824216(2b6f391)success;线上 200,bundle 与本地构建哈希一致(index-BXLduAMJ.js),含三选新代码
- [x] 真机(iOS Safari / 安卓 Chrome)走通闭环 —— ✅ 2026-09-13 用户确认通过,一期 MVP 交付

## 已知环境注意

- 部署 URL 为公开页面,无访问控制:应用无账号,数据仅存访客本机浏览器,
  不存在服务端数据泄露面;若日后需要私密入口,以新 change 立项(见 plan.md Out of scope)
- 真实 AI 需在应用内设置(外观 Sheet → AI)填 baseURL/model/key;不填为 mock 演示模式

## 回滚方式

GitHub Pages 无历史版本切换;回滚 = 将 main 重置到上一个可用提交并推送,
Actions 自动重新发布。
