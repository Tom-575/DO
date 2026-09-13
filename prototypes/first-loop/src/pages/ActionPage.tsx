import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { PENDING_RECYCLE_MS, createId, useAppState, useDispatch } from '../store/store';
import { getAction } from '../lib/mock';
import type { DOIntent } from '../types';
import NavBar from '../components/NavBar';
import './action.css';

const INTENT_CHOICES: DOIntent[] = ['愿意去做', '不想做了', '暂不决定'];

export default function ActionPage() {
  const { idea, dos, activeDOId } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  // 从「上一条 DO」进入时,原话与行动内容都来自该 DO;原话被改动则按新念头处理
  const matched = activeDOId ? dos.find((item) => item.id === activeDOId) : undefined;
  const activeDO = matched && matched.thought === idea ? matched : undefined;
  const action = activeDO ? activeDO.action : getAction(idea);
  // 已有 DO 回显其意向;新念头尚未落库,选中结果先记在本地,落库时机见 chooseIntent
  const [intent, setIntent] = useState<DOIntent | null>(() => activeDO?.intent ?? null);
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
  /**
   * 行动意向三选:愿意去做→status 待记录,保持可开始;暂不决定→待定并刷新停放时间;
   * 不想做了→用户放弃,parkedAt 回拨 24 小时以上,让回收规则自然把它收进展开区末尾。
   * 新念头在此刻落库(预生成 id 并接管 activeDO),之后「现在开始 / 先放着」更新的是同一条。
   */
  const chooseIntent = (value: DOIntent) => {
    setIntent(value);
    if (value === '不想做了') {
      const rolledBack = Date.now() - PENDING_RECYCLE_MS - 60_000;
      if (activeDO) dispatch({ type: 'updateDO', id: activeDO.id, patch: { intent: value, status: '待定', parkedAt: rolledBack } });
      else dispatch({ type: 'addDO', id: createId(), thought: idea, action, status: '待定', parkedAt: rolledBack, intent: value });
      leave();
      return;
    }
    if (activeDO) {
      dispatch({ type: 'updateDO', id: activeDO.id, patch: value === '愿意去做' ? { intent: value, status: '待记录' } : { intent: value, status: '待定', parkedAt: Date.now() } });
      return;
    }
    const id = createId();
    dispatch({ type: 'addDO', id, thought: idea, action, status: value === '愿意去做' ? '待记录' : '待定', parkedAt: Date.now(), intent: value });
    dispatch({ type: 'setActiveDO', id });
  };
  return <motion.section className="page action-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '18%', opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={() => dispatch({ type: 'setScreen', screen: 'input' })} aria-label="返回"><ArrowLeft size={23} /></button>} title="现在的一步" right={<span className="nav-spacer" />} />
    <div className="action-content"><p className="source-idea">{idea}</p><h1>{action.title}</h1><div className="action-meta"><span>{action.time}</span><span>{action.stop}</span></div></div>
    <div className="bottom-actions">
      <button className="primary-action" disabled={!idea.trim()} onClick={begin}>现在开始</button>
      <button className="secondary-action" disabled={!idea.trim()} onClick={park}>先放着</button>
      <div className="intent-row" role="group" aria-label="行动意向">
        {INTENT_CHOICES.map((value) => <button key={value} className={intent === value ? 'selected' : undefined} disabled={!idea.trim()} onClick={() => chooseIntent(value)}>{value}</button>)}
      </div>
    </div>
  </motion.section>;
}
