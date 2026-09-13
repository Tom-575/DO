import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { getAction } from '../lib/mock';
import NavBar from '../components/NavBar';

export default function ActionPage() {
  const { idea, lastIdea } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const action = getAction(idea || lastIdea);
  return <motion.section className="page action-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '18%', opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={() => dispatch({ type: 'setScreen', screen: 'input' })} aria-label="返回"><ArrowLeft size={23} /></button>} title="现在的一步" right={<span className="nav-spacer" />} />
    <div className="action-content"><p className="source-idea">{idea}</p><h1>{action.title}</h1><div className="action-meta"><span>{action.time}</span><span>{action.stop}</span></div></div>
    <div className="bottom-actions"><button className="primary-action" onClick={() => { dispatch({ type: 'setLastIdea', idea }); dispatch({ type: 'goHome' }); }}>现在开始</button><button className="secondary-action" onClick={() => dispatch({ type: 'goHome' })}>先放着</button></div>
  </motion.section>;
}
