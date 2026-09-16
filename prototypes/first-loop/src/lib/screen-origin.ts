/**
 * 屏幕变换的「原点」:进入新界面之前,把被点控件相对手机框的矩形与形状量下来。
 *
 * 存在模块级变量而非 store,是因为这是**视口测量值**——必须在来源控件卸载前同步取到,
 * 而 store 更新是异步批处理的。目标界面挂载时取走一次即清空。
 */

/** 圆形控件(如 `+` 号)必须用 circle,否则动画中途会退化成圆角方块 */
export type ExpandShape = 'circle' | 'rect';

export interface ExpandOrigin {
  /** 来源控件相对手机框的矩形(px) */
  top: number;
  left: number;
  width: number;
  height: number;
  /** 手机框尺寸:用来把矩形换算成裁切内距与终点半径 */
  frameWidth: number;
  frameHeight: number;
  shape: ExpandShape;
  /** rect 来源的圆角 */
  radius: number;
}

/** 与 styles.css 的 .bloom-out 过渡时长保持一致 */
export const COLLAPSE_MS = 340;

let latest: ExpandOrigin | null = null;

/**
 * 读控件真实的圆角。不能用 `min(宽,高)/2` 近似——那是外接圆角,只在圆形控件上成立,
 * 会把 DO 按钮(386×86 / 圆角 16px)算成 43px、起点变成一枚胶囊。
 * 百分比圆角在计算值里带百分号,直接回退到 `fallback`(即外接圆角)。
 */
function readBorderRadius(element: HTMLElement, fallback: number): number {
  const raw = getComputedStyle(element).borderTopLeftRadius;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (raw.includes('%')) return fallback;
  return Math.round(value);
}

/**
 * 在点击处理器里同步测量来源控件。传 null 表示这次进入没有原点,目标屏回退到默认进入动效。
 * 量不到手机框(比如控件已被卸载)也置空。
 */
export function captureExpandOrigin(element: HTMLElement | null, shape: ExpandShape = 'rect'): void {
  const frame = element?.closest('.phone-app');
  if (!element || !frame) {
    latest = null;
    return;
  }
  const f = frame.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  // 量布局盒而非被变换过的盒:whileTap 按下时元素缩到 0.94,直接读 rect 会拿到缩小值。
  // 变换以元素中心为原点,所以中心不动,用布局宽高还原即可。
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const sourceWidth = element.offsetWidth || rect.width;
  const sourceHeight = element.offsetHeight || rect.height;
  const frameWidth = Math.round(f.width);
  const frameHeight = Math.round(f.height);
  const left = Math.max(0, Math.round(centerX - sourceWidth / 2 - f.left));
  const top = Math.max(0, Math.round(centerY - sourceHeight / 2 - f.top));
  // 来源可能被裁掉一部分(比如列表里半露的条目):矩形要收进框内,否则裁切会失真
  const width = Math.max(1, Math.min(Math.round(sourceWidth), frameWidth - left));
  const height = Math.max(1, Math.min(Math.round(sourceHeight), frameHeight - top));
  // 圆形来源的圆角就是它的半径;矩形来源读真实圆角,再夹到「不超过外接圆角」以免出现无效值
  const half = Math.round(Math.min(width, height) / 2);
  latest = {
    left,
    top,
    width,
    height,
    frameWidth,
    frameHeight,
    shape,
    radius: shape === 'circle' ? half : Math.min(readBorderRadius(element, half), half),
  };
}

/** 取走原点(只生效一次);没有则返回 null */
export function takeExpandOrigin(): ExpandOrigin | null {
  const origin = latest;
  latest = null;
  return origin;
}

/* ---------- 裁切起点与终点 ----------
   两者必须是**同一种形状函数**,CSS 才能插值:
   circle ↔ circle 走的是「半径变大、圆心不动」,这正是「一个圆铺满整屏」;
   若起点用 circle、终点用 inset,浏览器无法插值,会直接跳变。 */

/** 圆心(圆形来源用) */
function circleCenter(origin: ExpandOrigin): string {
  return `${Math.round(origin.left + origin.width / 2)}px ${Math.round(origin.top + origin.height / 2)}px`;
}

/** 起点裁切:正好是被点控件自己的形状 */
export function originClipPath(origin: ExpandOrigin): string {
  if (origin.shape === 'circle') {
    return `circle(${Math.round(Math.min(origin.width, origin.height) / 2)}px at ${circleCenter(origin)})`;
  }
  const right = Math.max(0, origin.frameWidth - origin.left - origin.width);
  const bottom = Math.max(0, origin.frameHeight - origin.top - origin.height);
  return `inset(${origin.top}px ${right}px ${bottom}px ${origin.left}px round ${origin.radius}px)`;
}

/** 终点裁切:铺满整屏。圆形的终点半径取「圆心到最远角」的距离 */
export function fullClipPath(origin: ExpandOrigin): string {
  if (origin.shape === 'circle') {
    const cx = origin.left + origin.width / 2;
    const cy = origin.top + origin.height / 2;
    const dx = Math.max(cx, origin.frameWidth - cx);
    const dy = Math.max(cy, origin.frameHeight - cy);
    return `circle(${Math.ceil(Math.hypot(dx, dy))}px at ${circleCenter(origin)})`;
  }
  return 'inset(0px 0px 0px 0px round 0px)';
}
