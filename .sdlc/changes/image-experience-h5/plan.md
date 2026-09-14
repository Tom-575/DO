# Plan: 三期图片体验:卡片封面原比例显示 + 回忆页全屏看图(小红书式滑动)

status: accepted
owner: trae-agent
source: 用户需求对话 2026-09-14;CONTEXT.md 未决语义「图片记录是否需要裁剪/排序/封面」
issue:
pr:
risk_level: low
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | image-experience-h5 |
| 阶段负责人 | trae-agent |
| 来源类型 | feature |
| 来源引用 | 用户对话 2026-09-14;docs/CONTEXT.md 未决语义 |
| 风险等级 | low |
| 当前状态 | active |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Problem

1. #14 卡片封面把任意比例的首图强行 1:1 居中裁切,竖图/横图都会丢掉画面主体,与「真实优先」的产品判断相悖。
2. 多图记录在回忆页只能看到缩略拼排,没有大图查看能力;点整条记录即进编辑态,看图反而要绕路。

## Desired outcome

- 卡片封面按原图比例完整绘制(宽度固定,高度随比例伸缩,卡片总高动态),不裁切、不设上限。
- 回忆页分区响应:点图片区 → 全屏查看器;点文字/其余区域 → 保持编辑态;查看器内提供编辑入口。
- 全屏查看器:黑底、scroll-snap 左右滑动切换、页码指示(n/N)、单图也进、关闭返回;加载失败占位复用现有样式。

## Scope

### In scope

- `src/lib/card-render.ts`:封面绘制由 1:1 裁切改为原比例 drawImage。
- 新增 `src/components/ImageViewer.tsx`(含样式):全屏图片查看器。
- `src/components/MemoryItem.tsx` / `src/pages/MemoriesPage.tsx`:分区点击 + 查看器挂载。
- `docs/design/DESIGN.md` as-built 同步;`docs/TODO.md` 三期任务勾选。

### Out of scope

- 图片排序、封面选择、双指缩放、双击放大(CONTEXT.md 未决语义,留待后续 change)。
- 记录编辑页与卡片预览流程的其他改动。

## Constraints

- 纯前端、IndexedDB Blob 直接出 objectURL,不引入新依赖。
- 手机优先,触摸滑动用 CSS scroll-snap 原生方案;遵守 reduce-motion。
- 保持 #13 编辑态、导出卡片入口行为不变。

## Success criteria

- [ ] 竖图/横图导出卡片,封面完整无裁切。
- [ ] 多图记录点图进全屏,左右滑动可切换,页码正确;单图同样可进。
- [ ] 点文字区仍进编辑态;查看器内可进编辑。
- [ ] 真机(手机浏览器)滑动顺滑,无页面滚动穿透。

## Open decisions

- [x] 点记录默认行为 → 用户已定:分区响应(点图看图/点文字编辑)。
- [x] 封面是否设高度上限 → 暂不设,实际用出问题再收紧。
