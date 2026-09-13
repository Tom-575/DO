import type { DOAction, PlanReply, PlanTurn } from '../types';

/**
 * 行动生成当前用关键词模拟(#8 接入真实 AI 前的实现),禁止删除。
 * planActionMock(#15)是对话规划的本地兜底:比远程契约更早收敛,已有 1 次提问就必给行动,绝不把对话变成盘问。
 * 其余 seed/mock 数据已随 #2 数据层移除,页面统一走 store。
 */
export function getAction(idea: string): DOAction {
  if (idea.includes('运动')) return { title: '换上运动鞋，到楼下走 10 分钟。', stop: '走到小区门口，就可以回来。', time: '大约 10 分钟' };
  if (idea.includes('做饭') || idea.includes('菜')) return { title: '打开冰箱，选出今天最想用掉的一样食材。', stop: '选好食材，就可以停下来。', time: '大约 2 分钟' };
  return { title: `先花 10 分钟，开始“${idea}”。`, stop: '时间到了，就可以停下来。', time: '大约 10 分钟' };
}

/** 模糊念头:太短,或只有「想…」加语气词而没有具体对象——这类输入问一句比猜错成本低 */
function isVagueIdea(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 8) return true;
  return /^(想运动|想学|想试|想拍|想做|想)[的一下点什么吧啊呢]*$/.test(trimmed);
}

export function planActionMock(history: PlanTurn[]): PlanReply {
  const lastUser = [...history].reverse().find((turn) => turn.role === 'user');
  // 红线:已有一次提问就收敛,行动对象取用户最新的话;adapter 侧满 2 次提问回落到这里也必然给行动
  if (history.some((turn) => turn.role === 'assistant')) {
    return { kind: 'action', action: getAction(lastUser?.text ?? '') };
  }
  const text = history.find((turn) => turn.role === 'user')?.text ?? '';
  if (!isVagueIdea(text)) return { kind: 'action', action: getAction(text) };
  // 模糊念头:按领域挑一个最短的问题,选项给具体可点的对象,降低回复成本
  if (text.includes('运动')) return { kind: 'question', text: '想在哪儿动一动？', options: ['下楼走走', '在家拉伸'] };
  if (text.includes('学')) return { kind: 'question', text: '想先试哪一步？', options: ['看 10 分钟入门视频', '跟着教程做一次'] };
  if (text.includes('拍')) return { kind: 'question', text: '想拍什么？', options: ['拍一张此刻的样子', '拍 15 秒身边的声音和画面'] };
  if (text.includes('做')) return { kind: 'question', text: '想做的是哪一类？', options: ['做点吃的', '动手做点东西'] };
  return { kind: 'question', text: '更靠近哪一件？', options: ['在家就能做的', '出门走 10 分钟的'] };
}
