import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { PENDING_RECYCLE_MS, useAppState, useDispatch } from '../store/store';
import { generateAction } from '../lib/ai';
import { getAction } from '../lib/mock';
import type { DOAction, DOIntent, DOStatus } from '../types';
import NavBar from '../components/NavBar';
import './action.css';

export default function ActionPage() {
  const { idea, dos, activeDOId, settings } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  // 从「上一条 DO」进入时,原话与行动内容都来自该 DO
  const matched = activeDOId ? dos.find((item) => item.id === activeDOId) : undefined;
  const activeDO = matched && matched.thought === idea ? matched : undefined;
  // 行动内容:已有 DO 直接回显其已存行动;新念头走 generateAction(无 key 时 mock,配置后真实 AI)
  const [action, setAction] = useState<DOAction | null>(() => activeDO?.action ?? null);
  const [generating, setGenerating] = useState(() => !activeDO);
  // 生成令牌:只让最新一次 generateAction 的响应生效(StrictMode 双挂载时防串)
  const runToken = useRef(0);
  const runGenerate = (text: string) => {
    const token = ++runToken.current;
    setGenerating(true);
    generateAction(text, settings)
      .then((next) => {
        if (runToken.current !== token) return;
        setAction(next);
        setGenerating(false);
      })
      .catch(() => {
        // adapter 已在失败时回落 mock,这里再兜一层:页面永不卡在「想一下…」
        if (runToken.current !== token) return;
        setAction(getAction(text));
        setGenerating(false);
      });
  };
  useEffect(() => {
    if (activeDO) {
      setAction(activeDO.action);
      setGenerating(false);
      return;
    }
    runGenerate(idea);
  }, [idea]); // settings 在页面生命周期内视为不变,不纳入依赖
  const leave = () => {
    dispatch({ type: 'setIdea', idea: '' });
    dispatch({ type: 'setActiveDO', id: null });
    dispatch({ type: 'goHome' });
  };
  /**
   * 三选落库语义:马上做→待记录(愿意去做);等等→待定(暂不决定),刷新停放时间,24h 回收重新计起;
   * 不想做了→放弃,parkedAt 回拨 24 小时以上,让回收规则自然把它收进展开区末尾。
   * 意向由所选动作直接推导,页面不单独收集;数据模型三值保持不变。
   */
  const commit = (choice: { intent: DOIntent; status: DOStatus; parkedAt?: number }) => {
    if (!action) return;
    const { intent, status, parkedAt } = choice;
    if (activeDO) {
      dispatch({ type: 'updateDO', id: activeDO.id, patch: { intent, status, ...(parkedAt === undefined ? {} : { parkedAt }) } });
    } else {
      dispatch({ type: 'addDO', thought: idea, action, status, parkedAt, intent });
    }
    leave();
  };
  const begin = () => commit({ intent: '愿意去做', status: '待记录' });
  const park = () => commit({ intent: '暂不决定', status: '待定', parkedAt: Date.now() });
  const giveUp = () => commit({ intent: '不想做了', status: '待定', parkedAt: Date.now() - PENDING_RECYCLE_MS - 60_000 });
  const actionsDisabled = !idea.trim() || generating || !action;
  return <motion.section className="page action-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={() => dispatch({ type: 'setScreen', screen: 'input' })} aria-label="返回"><ArrowLeft size={23} /></button>} title="现在的一步" right={<span className="nav-spacer" />} />
    <div className="action-content">
      <p className="source-idea">{idea}</p>
      {action ? (
        <>
          <h1>{action.title}</h1>
          <div className="action-meta"><span>{action.time}</span><span>{action.stop}</span></div>
        </>
      ) : (
        <h1 className="action-pending">想一下…</h1>
      )}
    </div>
    <div className="bottom-actions">
      <button className="primary-action" disabled={actionsDisabled} onClick={begin}>马上做</button>
      <button className="secondary-action" disabled={actionsDisabled} onClick={park}>等等</button>
      <button className="quiet-action" disabled={actionsDisabled} onClick={giveUp}>不想做了</button>
    </div>
  </motion.section>;
}
