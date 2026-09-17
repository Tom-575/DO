/**
 * 记录类的日期标签：不带星期，且需要「今天 / 昨天」的相对表达。
 * 与 lib/date.ts 的 kicker / 相对时间分开（后者是本轮新增的展示口径）。
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** 记录时间相对今天的天数差(0 = 今天,1 = 昨天);Math.round 抵消夏令时带来的 ±1 小时偏移 */
function daysFromToday(createdAt: number, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(new Date(createdAt))) / DAY_MS);
}

/** 「今天 / 昨天 / M月D日」,跨月与未来时间都落到 M月D日 */
export function memoryDayLabel(createdAt: number, now: Date = new Date()): string {
  const date = new Date(createdAt);
  switch (daysFromToday(createdAt, now)) {
    case 0:
      return '今天';
    case 1:
      return '昨天';
    default:
      return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

/** 24 小时制 HH:mm */
export function formatClock(createdAt: number): string {
  const date = new Date(createdAt);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
