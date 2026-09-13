/**
 * 记录卡片绘制(#14)。Canvas 手绘而非 DOM 序列化:嵌入式 webview 里
 * html-to-image 的 foreignObject 路径会永久挂起,canvas 是唯一确定性方案。
 * 布局与 card.css 的视觉约定一致:白底、日期、1:1 封面、正文、念头行、签名。
 * CJK 逐字换行即可,无需分词。
 */

const CARD_WIDTH = 340;
const PADDING = 22;
const BODY_WIDTH = CARD_WIDTH - PADDING * 2;
const BODY_FONT = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
const BODY_LINE = 25;
const SMALL_FONT = '12px "PingFang SC", "Microsoft YaHei", sans-serif';

export interface CardData {
  createdAt: number;
  body: string;
  idea: string | null;
  coverBlob: Blob | null;
  coverUrl: string | null;
}

/** 贪心逐字换行;显式 \n 分段,与正文编辑区的 pre-wrap 行为一致 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const char of paragraph) {
      if (ctx.measureText(line + char).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line += char;
      }
    }
    lines.push(line);
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

async function loadCover(data: CardData): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    if (data.coverBlob) return await createImageBitmap(data.coverBlob);
    if (data.coverUrl) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('cover load failed'));
        img.src = data.coverUrl as string;
      });
      return img;
    }
  } catch {
    return null; // 封面加载失败时出纯文卡片,不阻塞导出
  }
  return null;
}

/** 渲染一张卡片到 canvas(2x 分辨率);先量后画,canvas 高度由内容决定 */
export async function renderRecordCard(canvas: HTMLCanvasElement, data: CardData): Promise<void> {
  const scale = 2;
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return;
  measure.font = BODY_FONT;
  const bodyLines = data.body ? wrapText(measure, data.body, BODY_WIDTH) : [];
  const hasCover = Boolean(data.coverBlob || data.coverUrl);

  let y = PADDING;
  const dateH = 17;
  const coverSize = hasCover ? BODY_WIDTH : 0;
  const bodyH = bodyLines.length * BODY_LINE;
  const footH = 12 + (data.idea ? 17 : 0) + 17;
  const contentH = y + dateH + (hasCover ? 12 + coverSize : 0) + (bodyLines.length ? 14 + bodyH : 0) + 18 + footH + PADDING;

  canvas.width = CARD_WIDTH * scale;
  canvas.height = contentH * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_WIDTH, contentH);

  // 日期
  const date = new Date(data.createdAt);
  ctx.fillStyle = '#a8a29e';
  ctx.font = SMALL_FONT;
  ctx.textBaseline = 'top';
  ctx.fillText(`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`, PADDING, y);
  y += dateH;

  // 封面:1:1 居中裁切 + 圆角
  if (hasCover) {
    y += 12;
    const cover = await loadCover(data);
    if (cover) {
      const source = cover as ImageBitmap;
      const side = Math.min(source.width, source.height);
      const sx = (source.width - side) / 2;
      const sy = (source.height - side) / 2;
      ctx.save();
      roundRect(ctx, PADDING, y, coverSize, coverSize, 14);
      ctx.clip();
      ctx.drawImage(cover as CanvasImageSource, sx, sy, side, side, PADDING, y, coverSize, coverSize);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f1ece7';
      roundRect(ctx, PADDING, y, coverSize, coverSize, 14);
      ctx.fill();
    }
    y += coverSize;
  }

  // 正文:整理版 || 原话,一字不改
  if (bodyLines.length) {
    y += 14;
    ctx.fillStyle = '#44403c';
    ctx.font = BODY_FONT;
    for (const line of bodyLines) {
      ctx.fillText(line, PADDING, y);
      y += BODY_LINE;
    }
  }

  // 页脚:分隔线 + 可选念头行 + 签名
  y += 18;
  ctx.strokeStyle = '#f1ece7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(CARD_WIDTH - PADDING, y);
  ctx.stroke();
  y += 12;
  ctx.font = SMALL_FONT;
  if (data.idea) {
    ctx.fillStyle = '#78716c';
    ctx.save();
    ctx.beginPath();
    ctx.rect(PADDING, y, BODY_WIDTH, 17);
    ctx.clip();
    ctx.fillText(`念头：${data.idea}`, PADDING, y);
    ctx.restore();
    y += 17;
  }
  ctx.fillStyle = '#d9784a';
  ctx.font = '600 12px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('DO · 不完美，也可以出发', PADDING, y);
}
