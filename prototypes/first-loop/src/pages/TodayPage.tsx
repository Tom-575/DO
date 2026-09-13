import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CaretDown, UserCircle } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { earlierIdeas } from '../lib/mock';
import DOButton from '../components/DOButton';
import PreviousRow from '../components/PreviousRow';

export default function TodayPage() {
  const { lastIdea, historyOpen } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  return <>
    <header className="large-header"><div><span>9月12日 星期六</span><h1>今天</h1></div><button aria-label="外观设置" onClick={() => dispatch({ type: 'setAppearanceOpen', open: true })}><UserCircle size={32} weight="light" /></button></header>
    <main className="today-content">
      <section className="do-intro"><h2>现在想做什么？</h2><p>先写下来。DO 会把它变成可以开始的一步。</p><DOButton onClick={() => { dispatch({ type: 'setIdea', idea: '' }); dispatch({ type: 'setScreen', screen: 'input' }); }} /></section>
      <section className="previous-section">
        <div className="previous-heading"><h3>上一条 DO</h3><button onClick={() => dispatch({ type: 'toggleHistory' })} aria-label={historyOpen ? '收起更多 DO' : '展开更多 DO'} aria-expanded={historyOpen}><CaretDown className={historyOpen ? 'rotated' : ''} size={16} weight="bold" /></button></div>
        <div className="do-history"><PreviousRow text={lastIdea} onClick={() => { dispatch({ type: 'setIdea', idea: lastIdea }); dispatch({ type: 'setScreen', screen: 'action' }); }} />
          <AnimatePresence initial={false}>{historyOpen && <motion.div className="earlier-dos" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .22 }}>{earlierIdeas.map((item) => <PreviousRow className="earlier-row" key={item} text={item} onClick={() => { dispatch({ type: 'setIdea', idea: item }); dispatch({ type: 'setScreen', screen: 'action' }); }} />)}</motion.div>}</AnimatePresence>
        </div>
      </section>
    </main>
  </>;
}
