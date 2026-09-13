# Build: 记录撰写:草稿/二次编辑/图片健壮性+对比度修复

status: accepted
source_intent: plan.md
source_design: design.md
revision: d84f61c..working tree
owner: ZCode(agent,窗口 A)
created_at: 2026-09-13
updated_at: 2026-09-13

## Implementation summary

- RecordPage:新建态草稿自动暂存/恢复(IndexedDB `do.recordDraft`,含图片 Blob);编辑态(回忆页点条目进入)复用同页,「保存修改」走 updateRecord;选图即压缩(>300KB 长边 1600px JPEG 0.85);关联候选含当前已关联 DO(编辑态可查看/取消)
- store:updateRecord 联动新旧关联 DO 状态(原关联回退待记录/新关联转已记录);新增 activeRecordId
- MemoriesPage/MemoryItem:条目可点进编辑;图片加载失败占位
- record.css:占位/提示升 secondary、主输入加 surface 底衬(§7.5)
- 抽取共用 useImageUrls 到 lib/image-urls.ts

## Changed areas

`RecordPage.tsx`、`MemoryItem.tsx`、`MemoriesPage.tsx`、`record.css`、`memories.css`、`store/store.tsx`、`store/types.ts`、`lib/storage.ts`、`lib/image-urls.ts`(新)、`docs/TODO.md` 契约注记

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | npx tsc --noEmit | pass |

## Known limitations

草稿仅保留最近一份;编辑态无草稿(取消即放弃)。
