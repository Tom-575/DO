import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { getAction } from '../lib/mock';
import NavBar from '../components/NavBar';

export default function ActionPage() {
  const { idea, dos, activeDOId } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  // 从「上一条 DO」进入时,原话与行动内容都来自该 DO;原话被改动则按新念头处理
  const matched = activeDOId ? dos.find((item) => item.id === activeDOId) : undefined;
  const activeDO = matched && matched.thought === idea ? matched : undefined;
  const action = activeDO ? activeDO.action : getAction(idea);
  const leave = () => {
    dispatch({ type: 'setIdea', idea: '' });
    dispatch({ type: 'setActiveDO', id: null });
    dispatch({ type: 'goHome' });
  };
  const begin = () => {
    if (activeDO) dispatch({ type: 'updateDO', id: activeDO.id, patch: { status: '待记录' } });
    else dispatch({ type: 'addDO', thought: idea, action, status: '待记录' });
    leave();
  };
  const park = () => {
    if (activeDO) dispatch({ type: 'updateDO', id: activeDO.id, patch: { status: '待定', parkedAt: Date.now() } });
    else dispatch({ type: 'addDO', thought: idea, action, status: '待定', parkedAt: Date.now() });
    leave();
  };
  return <motion.section className="page action-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '18%', opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={() => dispatch({ type: 'setScreen', screen: 'input' })} aria-label="返回"><ArrowLeft size={23} /></button>} title="现在的一步" right={<span className="nav-spacer" />} />
    <div className="action-content"><p className="source-idea">{idea}</p><h1>{action.title}</h1><div className="action-meta"><span>{action.time}</span><span>{action.stop}</span></div></div>
    <div className="bottom-actions"><button className="primary-action" disabled={!idea.trim()} onClick={begin}>现在开始</button><button className="secondary-action" disabled={!idea.trim()} onClick={park}>先放着</button></div>
  </motion.section>;
}
