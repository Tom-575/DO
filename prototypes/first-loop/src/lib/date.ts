const WEEKDAYS_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** V2 今天页的 kicker：`THURSDAY · SEP 17`（与设计稿一致的全大写英文） */
export function formatKicker(date: Date): string {
  return `${WEEKDAYS_EN[date.getDay()]} · ${MONTHS_EN[date.getMonth()]} ${date.getDate()}`;
}

/** 「刚刚 / 12 分钟前 / 今天 09:41」：记录页 eyebrow 的相对时间 */
export function formatRelative(createdAt: number, now: number = Date.now()): string {
  const minutes = Math.floor((now - createdAt) / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const date = new Date(createdAt);
  const clock = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const sameDay = new Date(now).toDateString() === date.toDateString();
  return sameDay ? `今天 ${clock}` : `${date.getMonth() + 1}月${date.getDate()}日 ${clock}`;
}
