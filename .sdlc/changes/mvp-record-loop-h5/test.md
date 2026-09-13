# Test: MVP:记录闭环 H5(今天 + 记录 + 回忆)

status: accepted
candidate_revision: 531b570
source_intent: .sdlc/changes/mvp-record-loop-h5/plan.md
source_design: .sdlc/changes/mvp-record-loop-h5/design.md
source_change: mvp-record-loop-h5
issue:
pr:
verifier: 主会话(协调者,非各子代理自查)
created_at: 2026-09-13
updated_at: 2026-09-13

> 补录说明(2026-09-13):测试于 2026-09-13 在 ZCode 内嵌浏览器(Chromium webview,
> 430×900 移动视口)对 localhost dev server 实际执行;本记录回填归档。

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | mvp-record-loop-h5 |
| 验证者 | 主会话(独立于构建子代理) |
| 被测版本 | 531b570(dev 模式) |
| 环境 | Chromium webview,视口 430×900,IndexedDB/localStorage 可用 |
| 当前状态 | accepted(test gate 已过,补录) |

## 测试证据

### 静态闸(每个合并波次)

- `npx tsc --noEmit`:0 错误(全部 7 个提交前)
- `npx vite build`:成功(最终 4985 模块,产物引用 /DO/ 前缀正确)

### 闭环走查(浏览器实际操作,2026-09-13)

| 步骤 | 操作 | 结果 |
|---|---|---|
| 1 | 加载首页 | 日期实时「9月13日 星期日」;DO 主入口 + 记录次入口;无 DO 时上一条区域正确隐藏 |
| 2 | 点 DO → 输入「我想运动一下」→ 继续 | 进入行动页;mock AI 生成「换上运动鞋,到楼下走 10 分钟」+ 时长 + 停止条件 |
| 3 | 意向选「愿意去做」→ 现在开始 | 回首页,「最近的 DO」显示该念头 |
| 4 | 记录次入口 → 输入文字 → 帮我整理 | 整理版生成且可编辑;关联推荐自动出现 |
| 5 | 保存 | 跳转回忆页;记录「今天 14:26」正确展示 |
| 6 | 刷新页面 | **记录仍在(IndexedDB 持久化 ✓)**;首页不再显示已关联 DO(已记录,正确) |

### 走查中发现并当场修复的缺陷

- **P1 页面切换永久卡死**:AnimatePresence 退出动画在 webview 永不结束;
  用 git 历史原始版对比测试定位,移除退出依赖后复测通过(提交 531b570)。

### 未覆盖(移交 Deploy/Maintain)

- 真机 iOS Safari / 安卓 Chrome(#11)——webview 行为不能代表真机
- 真实 AI 远程调用(需用户配置 key 后验证;mock 路径已验证)
- 深色主题与四种背景的逐一眼检(代码层已实现,未逐项截图)
- 图片上传后的端到端显示(本次走查用纯文字记录)

## 结论

候选版本在测试环境通过完整闭环与持久化验证,**evidence-passed**(附 P1 修复记录)。
真机验证作为 Deploy 阶段的放行条件,不由本记录替代。
