/**
 * 自增高的 textarea（今天页念头 / 输入页 / 记录页共用一份，避免三处各写一遍）。
 * max 传入时封顶，超出由容器内滚。
 */
export function growTextarea(element: HTMLTextAreaElement, max?: number): void {
  element.style.height = 'auto';
  const next = max === undefined ? element.scrollHeight : Math.min(element.scrollHeight, max);
  element.style.height = `${next}px`;
}
