/**
 * 时长解析与格式化（V2 第一步页的大字与时长胶囊）。
 * 数据契约里 action.time 是给人看的字符串（如「大约 10 分钟」），第一步页需要把它变成
 * 可调整的数字，所以这里只做「尽力解析 + 规范回写」，解析不出来就回落默认值，不抛错。
 *
 * 2026-09-20（#48）：档位收敛为 5 / 15 / 自定义，**AI 的建议时长不再作为档位出现**——
 * 它是「初始选中哪一档」的依据（吸附到最近档位），不是显示值。单位统一按分钟，
 * 不再有 MIN / HR 两套：自定义上限 90，`75 MIN` 比 `1.25 HR` 好读。
 */

/** 第一步页的两个固定档位；第三个是用户自己输入的「自定义」 */
export const DURATION_OPTIONS = [5, 15] as const;

export const DEFAULT_MINUTES = 5;

/** 自定义时长的可输入范围 */
export const CUSTOM_MINUTES_MIN = 1;
export const CUSTOM_MINUTES_MAX = 90;

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

/** 分钟数 → 写回 action.time 的规范文案（第一步页大字下的小标签） */
export function durationLabel(minutes: number): string {
  return `大约 ${minutes} 分钟`;
}

/**
 * AI 建议的分钟数 → 落在哪个固定档位上（10 → 15；距离相同时取大的那个）。
 * 解析不出来或压根没给就用默认档。这样界面上**永远有一个档位是选中的**，
 * 不会出现「大字写着 10、两颗胶囊都不亮」这种读不出归属的状态。
 */
export function snapToOption(minutes: number | null): number {
  if (minutes === null || !Number.isFinite(minutes)) return DEFAULT_MINUTES;
  let best: number = DURATION_OPTIONS[0];
  let bestGap = Number.POSITIVE_INFINITY;
  for (const option of DURATION_OPTIONS) {
    const gap = Math.abs(option - minutes);
    // 用 <= 让「距离相同」时后一个（更大的档位）胜出
    if (gap <= bestGap) {
      bestGap = gap;
      best = option;
    }
  }
  return best;
}

/** 自定义输入 → 合法分钟数：四舍五入并夹到 1–90，非数字回落默认档 */
export function clampCustomMinutes(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MINUTES;
  return Math.min(CUSTOM_MINUTES_MAX, Math.max(CUSTOM_MINUTES_MIN, Math.round(value)));
}
