import type { DOAction } from '../types';

/**
 * 行动生成当前用关键词模拟(#8 接入真实 AI 前的实现),禁止删除。
 * 其余 seed/mock 数据已随 #2 数据层移除,页面统一走 store。
 */
export function getAction(idea: string): DOAction {
  if (idea.includes('运动')) return { title: '换上运动鞋，到楼下走 10 分钟。', stop: '走到小区门口，就可以回来。', time: '大约 10 分钟' };
  if (idea.includes('做饭') || idea.includes('菜')) return { title: '打开冰箱，选出今天最想用掉的一样食材。', stop: '选好食材，就可以停下来。', time: '大约 2 分钟' };
  return { title: `先花 10 分钟，开始“${idea}”。`, stop: '时间到了，就可以停下来。', time: '大约 10 分钟' };
}
