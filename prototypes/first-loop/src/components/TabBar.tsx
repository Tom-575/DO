import type { MouseEvent, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ListDashes, Plus, Sun } from '@phosphor-icons/react';
import { SPRING_BOUNCE } from '../lib/motion';
import { captureExpandOrigin } from '../lib/screen-origin';
import { useAppState, useDispatch } from '../store/store';

/**
 * 底部导航（V2）：深色胶囊三槽——今天 / 开始 / 痕迹。
 * 「我的」不在这里——今天页右上角头像已经是它的入口，底部再放一个是重复（2026-09-17 用户决定）。
 * 今天与痕迹是分页（共用一枚滑动白胶囊）；「开始」是一次性动作（打开记录页），
 * 所以它的按下反馈只用透明度：按钮一旦被 transform 缩放，指示胶囊的测量位置会漂。
 */
export default function TabBar() {
  const { tab } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();

  const openRecord = (event: MouseEvent<HTMLButtonElement>) => {
    // 记录页从这一槽「长」满整屏。它是被 grid 拉伸的胶囊（不是圆），
    // 所以按默认 rect 走 `inset(... round 26px)`——声明 circle 会让起点退成一个 26px 的小圆。
    captureExpandOrigin(event.currentTarget);
    dispatch({ type: 'setScreen', screen: 'record' });
  };

  const tabButton = (key: 'today' | 'traces', label: string, icon: ReactNode) => (
    <button
      className={tab === key ? 'selected' : ''}
      aria-label={label}
      aria-current={tab === key ? 'page' : undefined}
      onClick={() => dispatch({ type: 'setTab', tab: key })}
    >
      {tab === key && !reduceMotion && <motion.span className="tab-pill" layoutId="tab-pill" transition={SPRING_BOUNCE} />}
      {icon}
      <span className="tab-label">{label}</span>
    </button>
  );

  return <nav className="tab-bar">
    {tabButton('today', '今天', <Sun size={21} weight={tab === 'today' ? 'fill' : 'regular'} />)}
    <button aria-label="开始" onClick={openRecord}>
      <Plus size={21} weight="bold" />
      <span className="tab-label">开始</span>
    </button>
    {tabButton('traces', '痕迹', <ListDashes size={21} weight={tab === 'traces' ? 'fill' : 'regular'} />)}
  </nav>;
}
