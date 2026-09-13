# Build: 记录卡片导出:单张图文卡片存为 PNG

status: accepted
source_intent: plan.md
source_design: design.md
revision: working tree
owner: ZCode(agent,窗口 A)
created_at: 2026-09-13
updated_at: 2026-09-13

## Implementation summary

- `lib/card-render.ts`(新):canvas 手绘卡片(2x 分辨率,先量后画,CJK 逐字换行,封面 1:1 居中裁切圆角,失败回落灰块/纯文)
- `components/RecordCard.tsx`:canvas 预览组件,预览即导出物
- `MemoriesPage`:条目右上角导出按钮 → 全屏遮罩预览 +「保存图片」(canvas.toBlob → PNG 下载)
- **弃用 html-to-image**:其 DOM 序列化在嵌入式 webview 中永久挂起(实测 toPng 12s+ 不返回、无报错);canvas 路径确定性。依赖已移除。
- `vite.config.ts`:server.watch.usePolling 开启——本机 fs 事件不可靠,多次出现编辑后供应过期模块

## Changed areas

`lib/card-render.ts`(新)、`components/RecordCard.tsx`、`components/card.css`、`pages/MemoriesPage.tsx`、`package.json`(-html-to-image)、`vite.config.ts`

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | npx tsc --noEmit | pass |

## Known limitations

v1 单模板浅色;深色卡片与多模板后置。
