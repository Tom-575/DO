import { motion, useReducedMotion } from 'motion/react';
import { ClockCounterClockwise, House, Plus } from '@phosphor-icons/react';
import { SPRING_BOUNCE } from '../lib/motion';
import { captureExpandOrigin } from '../lib/screen-origin';
import { useAppState, useDispatch } from '../store/store';

/**
 * 底部导航:变色 + 图标放大 + 一枚滑动指示点(layoutId 共享布局动画)。
 * 两个 Tab 按钮的按下反馈只能用透明度——按钮一旦被 transform 缩放,指示点的测量位置会漂。
 */
export default function TabBar() {
  const { tab } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  return <nav className="tab-bar">
    <button className={tab === 'today' ? 'selected' : ''} aria-label="今天" aria-current={tab === 'today' ? 'page' : undefined} onClick={() => dispatch({ type: 'setTab', tab: 'today' })}>
      <House size={24} weight={tab === 'today' ? 'fill' : 'regular'} />
      {tab === 'today' && !reduceMotion && <motion.span className="tab-indicator" layoutId="tab-indicator" transition={SPRING_BOUNCE} />}
    </button>
    {/* 记录页从这枚 + 号「长」满整屏;它是圆形控件,声明 'circle' 才能全程是个圆 */}
    <button className="tab-create" aria-label="新增记录" onClick={(event) => {
      captureExpandOrigin(event.currentTarget, 'circle');
      dispatch({ type: 'setScreen', screen: 'record' });
    }}><Plus size={22} weight="bold" /></button>
    <button className={tab === 'memories' ? 'selected' : ''} aria-label="回忆" aria-current={tab === 'memories' ? 'page' : undefined} onClick={() => dispatch({ type: 'setTab', tab: 'memories' })}>
      <ClockCounterClockwise size={25} weight={tab === 'memories' ? 'fill' : 'regular'} />
      {tab === 'memories' && !reduceMotion && <motion.span className="tab-indicator" layoutId="tab-indicator" transition={SPRING_BOUNCE} />}
    </button>
  </nav>;
}
