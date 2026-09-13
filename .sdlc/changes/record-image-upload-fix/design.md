# Design: 修复记录页图片上传静默失败

status: accepted
owner: ZCode(agent)
source_intent: plan.md
issue:
pr:
supersedes:
created_at: 2026-09-13
updated_at: 2026-09-13

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | record-image-upload-fix |
| 阶段负责人 | ZCode(agent) |
| 来源类型 | bug |
| 来源引用 | 用户对话指令 |
| 上游记录 | plan.md |
| 当前状态 | design-accepted |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## Chosen approach

`addImages` 在事件处理器内同步执行 `const picked = Array.from(files)`,把快照数组送进 `setImages` 更新器;更新器只读快照,不再触碰实时 FileList。调用方清空 `input.value` 的既有模式(便于重选同一文件)保持不变。一行级修复,数据模型与存储链路不动。

## Alternatives considered

- 延迟清空 `input.value`(如 requestAnimationFrame):时序脆弱,依赖渲染调度,放弃。
- 移除 `input.value = ''`:重选同一文件将不触发 change,体验回退,放弃。

## Validation strategy

同一反馈回路回归:修复前注入图片 previews=0 / counter 0/9(红);修复后必须 previews=1 / counter 1/9(绿),并验证 保存→IndexedDB→刷新→渲染 全链路。
