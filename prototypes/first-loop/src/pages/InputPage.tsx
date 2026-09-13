import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowUp } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import NavBar from '../components/NavBar';

export default function InputPage() {
  const { idea } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  return <motion.section className="page input-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="nav-action" onClick={() => dispatch({ type: 'goHome' })}><ArrowLeft size={21} />今天</button>} title="新的 DO" right={<button className="nav-action strong" disabled={!idea.trim()} onClick={() => dispatch({ type: 'setScreen', screen: 'action' })}>继续</button>} />
    <div className="input-content"><label htmlFor="idea">现在想做什么？</label><textarea id="idea" autoFocus value={idea} onChange={(event) => dispatch({ type: 'setIdea', idea: event.target.value })} placeholder="想到什么，就写什么" /><p>不用先想清楚目标或计划。</p></div>
    <button className="keyboard-action" disabled={!idea.trim()} onClick={() => dispatch({ type: 'setScreen', screen: 'action' })} aria-label="继续"><ArrowUp weight="bold" size={21} /></button>
  </motion.section>;
}
