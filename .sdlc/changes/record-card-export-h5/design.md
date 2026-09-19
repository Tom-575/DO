# Design: 记录卡片导出

status: accepted
owner: ZCode(agent,窗口 A)
source_intent: plan.md
created_at: 2026-09-13
updated_at: 2026-09-13

## Chosen approach

1. **卡片模板 v1(1 套,浅色固定)**:宽 340px 导出(pixelRatio 2),高度自适应;结构:顶行(小字日期)→ 封面区(有图:首图 1:1 圆角裁切;无图:无封面区)→ 正文(refined || text,pre-wrap,15px/1.6)→ 页脚(关联 DO 则「念头:{thought}」muted 小字 + 产品签名「DO · 不完美,也可以出发」)。不强行升华:正文一字不改。
2. **入口**:MemoriesPage 每条 record 右上角「导出卡片」图标按钮(不随 article 点击进编辑冒泡)→ 全屏浅色遮罩层内实时预览 + 「保存图片」「关闭」。
3. **导出**:html-to-image toPng(node,{pixelRatio:2,backgroundColor:'#fff'}) → Blob → a[download]（文件名 `DO卡片-YYYYMMDD.png`）;失败时行内提示,不静默。
4. **数据**:即时渲染,不落库、不改 Record 契约,SCHEMA_VERSION 不动。

## Alternatives considered

- 自己写 canvas 绘制:排版维护成本高,html-to-image(~6KB)复用 DOM 即设计稿,选它。
- AI 生成卡片文案:违背「保留原话语气」v1 决策,后置。

## Validation strategy

浏览器实测:有图/纯文/无关联三种记录的预览与 PNG 下载,产物打开可见;详见 test.md。
