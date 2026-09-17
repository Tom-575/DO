/**
 * 分享卡绘制（V2）。Canvas 手绘而非 DOM 序列化：嵌入式 webview 里
 * html-to-image 的 foreignObject 路径会永久挂起，canvas 是唯一确定性方案。
 *
 * 封面**按原比例完整绘制，不裁切**（#16 的结论保留，2026-09-17 用户确认）：
 * 高度 = 宽度 × 原图比例，卡片总高随之伸缩；文字排在封面**下方**的深色区，
 * 不压在照片上（压图必然要裁切，两者不能同时成立）。
 */

const CARD_WIDTH = 340;
const PAD = 20;
const CONTENT_WIDTH = CARD_WIDTH - PAD * 2;
const BODY_FONT = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
const BODY_LINE = 20;
const FIGURE_FONT = '52px "Bebas Neue", "Arial Narrow", "PingFang SC", sans-serif';
const SMALL_FONT = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
const SIGN_FONT = '600 11px "PingFang SC", "Microsoft YaHei", sans-serif';
const INK = '#0f0f0f';
const PEACH = '#f2c9b4';

export interface CardData {
  createdAt: number;
  body: string;
  idea: string | null;
  /** 关联 DO 的时长（分钟）；无关联或解析失败为 null */
  minutes: number | null;
  /** 这是第几次尝试（关联 DO 的累计次数） */
  attempt: number;
  coverBlob: Blob | null;
  coverUrl: string | null;
}

/** 贪心逐字换行；显式 \n 分段，与正文编辑区的 pre-wrap 行为一致 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 99): string[] {
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
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, -1)}…`;
  return kept;
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
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('cover load failed'));
        img.src = data.coverUrl as string;
      });
      return img;
    }
  } catch {
    return null; // 封面加载失败时退化为纯文字卡，不阻塞导出
  }
  return null;
}

function imageSize(image: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  if ('naturalWidth' in image) return { width: image.naturalWidth, height: image.naturalHeight };
  return { width: image.width, height: image.height };
}

/** 渲染一张卡片到 canvas（2x 分辨率）；先量后画，卡片高度由内容决定 */
export async function renderRecordCard(canvas: HTMLCanvasElement, data: CardData): Promise<void> {
  const scale = 2;
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return;
  // 字体就绪后再画：Bebas 未加载时会退化成系统体
  try {
    await document.fonts?.ready;
  } catch {
    /* 忽略：字体 API 不可用就直接画 */
  }

  const cover = await loadCover(data);
  measure.font = BODY_FONT;
  const bodyLines = data.body.trim() ? wrapText(measure, data.body.trim(), CONTENT_WIDTH, 3) : [];
  // 封面原比例：只按宽度缩放，高度随原图比例（#16）
  const coverHeight = cover
    ? Math.round((CONTENT_WIDTH * imageSize(cover).height) / imageSize(cover).width)
    : 0;

  const figureH = data.minutes ? 54 : 0;
  const bodyH = bodyLines.length * BODY_LINE;
  const ideaH = data.idea ? 17 : 0;
  const headH = !cover && data.attempt > 0 ? 24 + 14 : 0;
  const blockH =
    headH +
    (figureH ? figureH + 14 : 0) +
    (bodyH ? bodyH + 14 : 0) +
    (ideaH ? ideaH + 10 : 0) +
    15;
  const height = PAD + (coverHeight ? coverHeight + 16 : 0) + blockH + PAD;

  canvas.width = CARD_WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.textBaseline = 'top';

  // 卡片底：深色 + 左上暖色光
  roundRect(ctx, 0, 0, CARD_WIDTH, height, 22);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#101010';
  ctx.fillRect(0, 0, CARD_WIDTH, height);
  const glow = ctx.createRadialGradient(CARD_WIDTH * 0.22, height * 0.1, 10, CARD_WIDTH * 0.22, height * 0.1, CARD_WIDTH * 0.95);
  glow.addColorStop(0, 'rgba(242,201,180,.3)');
  glow.addColorStop(1, 'rgba(242,201,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, height);
  ctx.restore();

  let y = PAD;

  // 封面：原始比例完整绘制，不裁切
  if (cover) {
    ctx.save();
    roundRect(ctx, PAD, y, CONTENT_WIDTH, coverHeight, 18);
    ctx.clip();
    ctx.drawImage(cover as CanvasImageSource, PAD, y, CONTENT_WIDTH, coverHeight);
    ctx.restore();
    if (data.attempt > 0) {
      const label = `第 ${data.attempt} 次尝试`;
      ctx.font = SIGN_FONT;
      const badgeWidth = ctx.measureText(label).width + 22;
      ctx.fillStyle = PEACH;
      roundRect(ctx, PAD + 12, y + 12, badgeWidth, 26, 13);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(label, PAD + 23, y + 20);
    }
    y += coverHeight + 16;
  } else if (data.attempt > 0) {
    const label = `第 ${data.attempt} 次尝试`;
    ctx.font = SIGN_FONT;
    const badgeWidth = ctx.measureText(label).width + 22;
    ctx.fillStyle = PEACH;
    roundRect(ctx, PAD, y, badgeWidth, 24, 12);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillText(label, PAD + 11, y + 7);
    y += 24 + 14;
  }

  // 时长大字
  if (data.minutes) {
    const figure = data.minutes >= 60 ? String(data.minutes / 60) : String(data.minutes);
    const unit = data.minutes >= 60 ? 'HR' : 'MIN';
    ctx.fillStyle = '#ffffff';
    ctx.font = FIGURE_FONT;
    ctx.fillText(figure, PAD, y);
    const figureWidth = ctx.measureText(figure).width;
    ctx.fillStyle = PEACH;
    ctx.font = '26px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx.fillText(unit, PAD + figureWidth + 8, y + 22);
    y += 54 + 14;
  }

  // 正文（原话或整理版，一字不改）
  if (bodyLines.length) {
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = BODY_FONT;
    bodyLines.forEach((line, index) => ctx.fillText(line, PAD, y + index * BODY_LINE));
    y += bodyH + 14;
  }

  // 关联念头
  if (data.idea) {
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = SMALL_FONT;
    const ideaLines = wrapText(ctx, data.idea, CONTENT_WIDTH, 1);
    ctx.fillText(ideaLines[0] ?? '', PAD, y);
    y += ideaH + 10;
  }

  // 签名
  ctx.fillStyle = PEACH;
  ctx.font = SIGN_FONT;
  ctx.fillText('DO · 不完美，也可以出发', PAD, y);
}
