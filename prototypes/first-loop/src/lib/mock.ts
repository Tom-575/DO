import type { DO, DOAction, MemoryRecord } from '../types';

export interface MemorySeed {
  day: string;
  time: string;
  text: string;
  image?: string;
  alt?: string;
}

export const memories: MemorySeed[] = [
  { day: '今天', time: '08:40', text: '把阳台上的薄荷换到了更大的盆里。泥撒了一点，但它终于有地方继续长了。' },
  { day: '昨天', time: '19:10', text: '傍晚沿着山路走了一小段。风很大，照片拍得不太清楚。', image: '/assets/mountain-walk.jpg', alt: '傍晚经过的山路' },
];

export const earlierIdeas = ['想找个地方散散步', '想重新拿起相机', '想试着烤一次面包'];

export const defaultLastIdea = '想学会做一道简单的菜';

export function getAction(idea: string): DOAction {
  if (idea.includes('运动')) return { title: '换上运动鞋，到楼下走 10 分钟。', stop: '走到小区门口，就可以回来。', time: '大约 10 分钟' };
  if (idea.includes('做饭') || idea.includes('菜')) return { title: '打开冰箱，选出今天最想用掉的一样食材。', stop: '选好食材，就可以停下来。', time: '大约 2 分钟' };
  return { title: `先花 10 分钟，开始“${idea}”。`, stop: '时间到了，就可以停下来。', time: '大约 10 分钟' };
}

export const seedDos: DO[] = [defaultLastIdea, ...earlierIdeas].map((thought, index): DO => ({
  id: `do-${index + 1}`,
  thought,
  action: getAction(thought),
  status: '待定',
  intent: null,
  createdAt: Date.now() - (index + 1) * 60_000,
}));

export const seedRecords: MemoryRecord[] = memories.map((memory, index): MemoryRecord => ({
  id: `record-${index + 1}`,
  text: memory.text,
  images: memory.image ? [memory.image] : [],
  createdAt: Date.now() - (index + 1) * 86_400_000,
}));
