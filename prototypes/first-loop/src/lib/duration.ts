/**
 * 时长解析与格式化（V2 第一步页的大字与时长胶囊）。
 * 数据契约里 action.time 是给人看的字符串（如「大约 10 分钟」），V2 需要把它变成
 * 可调整的数字，所以这里只做「尽力解析 + 规范回写」，解析不出来就回落默认值，不抛错。
 */

/** 第一步页的三个档位：10 分钟 / 30 分钟 / 1 小时 */
export const DURATION_OPTIONS = [10, 30, 60] as const;

export const DEFAULT_MINUTES = 10;

/** 从「大约 10 分钟」「1 小时」这类文案里取分钟数；取不到返回 null */
export function parseMinutes(time: string | undefined | null): number | null {
  if (!time) return null;
  const hours = time.match(/(\d+)\s*(小时|h|hour)/i);
  if (hours) return Number(hours[1]) * 60;
  const minutes = time.match(/(\d+)\s*(分钟|分|min)/i);
  if (minutes) return Number(minutes[1]);
  return null;
}

/** 分钟数 → 展示文案：整小时用「1 小时」，其余「25 分钟」 */
export function formatDuration(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} 小时`;
  return `${minutes} 分钟`;
}

/** 分钟数 → 写回 action.time 的规范文案（V2 大字下的小标签） */
export function durationLabel(minutes: number): string {
  return `大约 ${formatDuration(minutes)}`;
}

/** 分钟数的英文单位（第一步页大字右侧的 MIN / HR） */
export function durationUnit(minutes: number): 'MIN' | 'HR' {
  return minutes >= 60 ? 'HR' : 'MIN';
}

/** 时长的数字部分（60 分钟 → 1，配 HR） */
export function durationFigure(minutes: number): number {
  return minutes >= 60 ? minutes / 60 : minutes;
}
