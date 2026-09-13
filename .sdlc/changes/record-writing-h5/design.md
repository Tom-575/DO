# Design: 记录撰写

status: accepted
owner: ZCode(agent,窗口 A)
source_intent: plan.md
created_at: 2026-09-13
updated_at: 2026-09-13

## Chosen approach

1. **草稿**:IndexedDB key `do.recordDraft`,内容 {text, refined, images(Blob[]), linkedDOId, savedAt}。RecordPage 内容变更即写(fire-and-forget);挂载时若有草稿静默恢复并显示一行「已恢复未保存的草稿」;保存成功或内容清空时删除。编辑既有记录时不启用草稿(取消即放弃)。
2. **二次编辑**:回忆页 article 可点 → store 增 `activeRecordId`,RecordPage 进入编辑态(NavBar「编辑记录」、按钮「保存修改」)。关联变更:原关联 A(已记录)→ 改关联 B:B 变已记录,A 回退「待记录」(其已记录源于本条);改为不关联:A 回退「待记录」。reducer 增 `updateRecord` 内联动 DO 状态的旁路逻辑。
3. **保存后再整理**:编辑态「帮我整理」照常可用,以当前文字重生成覆盖 refined。
4. **图片压缩**:addImages 内 createImageBitmap + canvas 长边 ≤1600px、JPEG 0.85(原图 ≤300KB 跳过);保持同步快照模式。
5. **失败占位**:MemoriesPage img onError → 固定占位块(断图图标 + 「图片加载失败」)。
6. **对比度**:record.css 占位/标签由 tertiary 提到 secondary,输入区加 surface 底衬(§7.5)。

## Alternatives considered

- 草稿存 localStorage:存不了图片 Blob,放弃。
- 关联移除让 A 进回收:语义错误——A 只是失去记录,应回「待记录」而非「放弃」。

## Validation strategy

浏览器实测:草稿往返、编辑保存与 DO 联动、压缩尺寸对比、断图占位、浅色走查;详见 test.md。
