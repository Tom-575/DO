import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CaretDown, UserCircle } from '@phosphor-icons/react';
import { selectHomeQueue, useAppState, useDispatch } from '../store/store';
import { formatDate } from '../lib/date';
import type { DO } from '../types';
import DOButton from '../components/DOButton';
import PreviousRow from '../components/PreviousRow';
import './today.css';

export default function TodayPage() {
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
    <header className="large-header"><div><span>{formatDate(new Date())}</span><h1>今天</h1></div><button aria-label="外观设置" onClick={() => dispatch({ type: 'setAppearanceOpen', open: true })}><UserCircle size={32} weight="light" /></button></header>
    <main className="today-content">
      <section className="do-intro"><h2>现在想做什么？</h2><p>先写下来。DO 会把它变成可以开始的一步。</p><DOButton onClick={() => { dispatch({ type: 'setActiveDO', id: null }); dispatch({ type: 'setIdea', idea: '' }); dispatch({ type: 'setScreen', screen: 'input' }); }} /></section>
      {rows.length > 0 && <section className="previous-section">
        <div className="previous-heading"><h3>最近的 DO</h3>{canExpand && <button onClick={() => dispatch({ type: 'toggleHistory' })} aria-label={historyOpen ? '收起更多 DO' : '展开更多 DO'} aria-expanded={historyOpen}><CaretDown className={historyOpen ? 'rotated' : ''} size={16} weight="bold" /></button>}</div>
        <div className="do-history">
          {rows.map((item, index) => <PreviousRow key={item.id} className={index > 0 ? 'divided' : undefined} muted={mutedIds.has(item.id)} text={item.thought} onClick={() => openDO(item)} />)}
          {historyOpen && <motion.div className="earlier-dos" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
            {extra.map((item) => <PreviousRow className="earlier-row" key={item.id} text={item.thought} onClick={() => openDO(item)} />)}
            {recycled.length > 0 && <p className="recycled-label">放了超过一天</p>}
            {recycled.map((item) => <PreviousRow className="earlier-row" muted key={item.id} text={item.thought} onClick={() => openDO(item)} />)}
          </motion.div>}
        </div>
      </section>}
    </main>
  </>;
}
