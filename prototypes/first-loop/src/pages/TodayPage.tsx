import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CaretDown, UserCircle } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import type { DO } from '../types';
import DOButton from '../components/DOButton';
import PreviousRow from '../components/PreviousRow';

export default function TodayPage() {
  const { dos, historyOpen } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const sorted = [...dos].sort((a, b) => b.createdAt - a.createdAt);
  const latest = sorted[0];
  const earlier = sorted.slice(1).filter((item) => item.status !== '已记录');
  const openDO = (item: DO) => {
    dispatch({ type: 'setActiveDO', id: item.id });
    dispatch({ type: 'setIdea', idea: item.thought });
    dispatch({ type: 'setScreen', screen: 'action' });
  };
  return <>
    <header className="large-header"><div><span>9月12日 星期六</span><h1>今天</h1></div><button aria-label="外观设置" onClick={() => dispatch({ type: 'setAppearanceOpen', open: true })}><UserCircle size={32} weight="light" /></button></header>
    <main className="today-content">
      <section className="do-intro"><h2>现在想做什么？</h2><p>先写下来。DO 会把它变成可以开始的一步。</p><DOButton onClick={() => { dispatch({ type: 'setActiveDO', id: null }); dispatch({ type: 'setIdea', idea: '' }); dispatch({ type: 'setScreen', screen: 'input' }); }} /></section>
      {latest && <section className="previous-section">
        <div className="previous-heading"><h3>上一条 DO</h3>{earlier.length > 0 && <button onClick={() => dispatch({ type: 'toggleHistory' })} aria-label={historyOpen ? '收起更多 DO' : '展开更多 DO'} aria-expanded={historyOpen}><CaretDown className={historyOpen ? 'rotated' : ''} size={16} weight="bold" /></button>}</div>
        <div className="do-history"><PreviousRow text={latest.thought} onClick={() => openDO(latest)} />
          <AnimatePresence initial={false}>{historyOpen && <motion.div className="earlier-dos" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .22 }}>{earlier.map((item) => <PreviousRow className="earlier-row" key={item.id} text={item.thought} onClick={() => openDO(item)} />)}</motion.div>}</AnimatePresence>
        </div>
      </section>}
    </main>
  </>;
}
