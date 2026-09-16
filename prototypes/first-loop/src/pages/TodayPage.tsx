import { useEffect, useState } from 'react';
import { motion, useReducedMotion, type MotionValue } from 'motion/react';
import { CaretDown } from '@phosphor-icons/react';
import { selectHomeQueue, useAppState, useDispatch } from '../store/store';
import { formatDate } from '../lib/date';
import { EASE_OUT, riseIn, stagger } from '../lib/motion';
import type { DO } from '../types';
import AppearanceButton from '../components/AppearanceButton';
import DOButton from '../components/DOButton';
import PreviousRow from '../components/PreviousRow';
import './today.css';

interface TodayPageProps {
  /**
   * 大标题的横向惯性甩出(来自 App 的 useSwipeLag)。
   * 注意它**只在运动过程中**有值,静止时恒为 0——所以静止时标题永远在原位。
   */
  titleLag: MotionValue<number>;
}

export default function TodayPage({ titleLag }: TodayPageProps) {
  const { dos, historyOpen } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  // 回收在渲染时按 now 计算,每分钟校准一次,跨过回收线的 DO 会自动下沉,无需后台任务
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { main, alternate, extra, recycled } = selectHomeQueue(dos, now);
  // 没有活跃 DO 可推荐时,退而展示最近的回收 DO,首页不留空洞
  const fallbackRows = main || alternate ? [] : recycled.slice(0, 3);
  const rows = [main, alternate, ...fallbackRows].filter((item): item is DO => Boolean(item));
  const mutedIds = new Set(fallbackRows.map((item) => item.id));
  const canExpand = Boolean(main) && (extra.length > 0 || recycled.length > 0);

  const openDO = (item: DO) => {
    dispatch({ type: 'setActiveDO', id: item.id });
    dispatch({ type: 'setIdea', idea: item.thought });
    dispatch({ type: 'setScreen', screen: 'action' });
  };

  return <>
    {/* 页面位移交给原生横滑;只有大标题跟着惯性甩一下,手停即回原位(静止态恒为原位) */}
    <header className="large-header">
      <motion.div style={{ x: titleLag }}>
        <span>{formatDate(new Date())}</span>
        <h1>今天</h1>
      </motion.div>
      <AppearanceButton />
    </header>
    <main className="today-content">
      <motion.section className="do-intro" {...riseIn(reduceMotion, 0, 34)}>
        <h2>现在想做什么？</h2>
        <p>先写下来。DO 会把它变成可以开始的一步。</p>
        <DOButton onClick={() => { dispatch({ type: 'setActiveDO', id: null }); dispatch({ type: 'setIdea', idea: '' }); dispatch({ type: 'setScreen', screen: 'input' }); }} />
      </motion.section>
      {rows.length > 0 && <motion.section className="previous-section" {...riseIn(reduceMotion, .12, 34)}>
        <div className="previous-heading"><h3>最近的 DO</h3>{canExpand && <button onClick={() => dispatch({ type: 'toggleHistory' })} aria-label={historyOpen ? '收起更多 DO' : '展开更多 DO'} aria-expanded={historyOpen}><CaretDown className={historyOpen ? 'rotated' : ''} size={16} weight="bold" /></button>}</div>
        <div className="do-history">
          {rows.map((item, index) => <PreviousRow key={item.id} className={index > 0 ? 'divided' : undefined} muted={mutedIds.has(item.id)} text={item.thought} enterDelay={stagger(index, .09)} onClick={() => openDO(item)} />)}
          {/* 展开区常驻挂载,靠 height/opacity 动画开合(收起也有动效);收起时 inert,键盘与读屏不会落进隐藏行。
              这是容器高度动画,不涉及退场依赖,不受 DESIGN §5 页面切换约束影响。
              inert/aria-hidden 挂在外层普通 div 上,不依赖动画库对自定义属性的透传。 */}
          <div className="earlier-dos" inert={!historyOpen} aria-hidden={!historyOpen}>
            <motion.div className="earlier-dos-body" initial={false}
              animate={{ height: historyOpen ? 'auto' : 0, opacity: historyOpen ? 1 : 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: .3, ease: EASE_OUT }}>
              {extra.map((item, index) => <PreviousRow className="earlier-row" key={item.id} text={item.thought} enterDelay={stagger(index, .09, 5)} onClick={() => openDO(item)} />)}
              {recycled.length > 0 && <p className="recycled-label">放了超过一天</p>}
              {recycled.map((item, index) => <PreviousRow className="earlier-row" muted key={item.id} text={item.thought} enterDelay={stagger(extra.length + index, .09, 5)} onClick={() => openDO(item)} />)}
            </motion.div>
          </div>
        </div>
      </motion.section>}
    </main>
  </>;
}
