import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { PENDING_RECYCLE_MS, createId, useAppState, useDispatch } from '../store/store';
import { generateAction } from '../lib/ai';
import { getAction } from '../lib/mock';
import type { DOAction, DOIntent } from '../types';
import NavBar from '../components/NavBar';
import './action.css';

const INTENT_CHOICES: DOIntent[] = ['愿意去做', '不想做了', '暂不决定'];

export default function ActionPage() {
  const { idea, dos, activeDOId, settings } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  // 从「上一条 DO」进入时,原话与行动内容都来自该 DO;原话被改动则按新念头处理
  const matched = activeDOId ? dos.find((item) => item.id === activeDOId) : undefined;
  const activeDO = matched && matched.thought === idea ? matched : undefined;
  // 行动内容:已有 DO 直接回显其已存行动;新念头走 generateAction(无 key 时 mock,配置后真实 AI)
  const [action, setAction] = useState<DOAction | null>(() => activeDO?.action ?? null);
  const [generating, setGenerating] = useState(() => !activeDO);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // 递增令牌:「换一个」连点 / 改念头重生成时,只让最新一次请求生效
  const runToken = useRef(0);
  const runGenerate = (text: string, onDone?: (next: DOAction) => void) => {
    const token = ++runToken.current;
    setGenerating(true);
    generateAction(text, settings)
      .then((next) => {
        if (runToken.current !== token) return;
        setAction(next);
        setGenerating(false);
        onDone?.(next);
      })
      .catch(() => {
        // adapter 已在失败时回落 mock,这里再兜一层:页面永不卡在「想一下…」
        if (runToken.current !== token) return;
        const fallback = getAction(text);
        setAction(fallback);
        setGenerating(false);
        onDone?.(fallback);
      });
  };
  // 只跟随念头生成:进入页面、改念头确认后各触发一次;「换一个」走显式调用
  useEffect(() => {
    if (activeDO) {
      setAction(activeDO.action);
      setGenerating(false);
      return;
    }
    runGenerate(idea);
  }, [idea]); // settings 在页面生命周期内视为不变,不纳入依赖
  const [intent, setIntent] = useState<DOIntent | null>(() => activeDO?.intent ?? null);
  const leave = () => {
    dispatch({ type: 'setIdea', idea: '' });
    dispatch({ type: 'setActiveDO', id: null });
    dispatch({ type: 'goHome' });
  };
  const begin = () => {
    if (!action) return;
    if (activeDO) dispatch({ type: 'updateDO', id: activeDO.id, patch: { status: '待记录' } });
    else dispatch({ type: 'addDO', thought: idea, action, status: '待记录' });
    leave();
  };
  const park = () => {
    if (!action) return;
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
    if (!action) return;
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
  /** 换一个:用当前原话重新生成行动;这条念头已落库时,同步替换它的行动 */
  const swap = () => {
    if (generating || !idea.trim()) return;
    runGenerate(idea, activeDO ? (next) => dispatch({ type: 'updateDO', id: activeDO.id, patch: { action: next } }) : undefined);
  };
  /** 改念头:原话进入行内编辑,确认后按新念头重新生成(改念头 = 新的一步,意向清零) */
  const startEdit = () => {
    setDraft(idea);
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const confirmEdit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === idea) return;
    setIntent(null);
    setAction(null); // 新念头还没有自己的行动,先回到「想一下…」
    dispatch({ type: 'setIdea', idea: next });
  };
  const actionsDisabled = !idea.trim() || generating || !action;
  return <motion.section className="page action-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '18%', opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={() => dispatch({ type: 'setScreen', screen: 'input' })} aria-label="返回"><ArrowLeft size={23} /></button>} title="现在的一步" right={<span className="nav-spacer" />} />
    <div className="action-content">
      {editing ? (
        <div className="idea-edit">
          <textarea value={draft} rows={2} autoFocus aria-label="改念头" onChange={(event) => setDraft(event.target.value)} />
          <div className="idea-edit-actions">
            <button onClick={cancelEdit}>取消</button>
            <button className="confirm" disabled={!draft.trim() || draft.trim() === idea} onClick={confirmEdit}>确认</button>
          </div>
        </div>
      ) : (
        <p className="source-idea">{idea}</p>
      )}
      {action ? (
        <>
          <h1>{action.title}</h1>
          <div className="action-meta"><span>{action.time}</span><span>{action.stop}</span></div>
        </>
      ) : (
        <h1 className="action-pending">想一下…</h1>
      )}
      {action && !editing && (
        <div className="action-tweaks">
          {generating ? (
            <button disabled>想一下…</button>
          ) : (
            <>
              <button onClick={swap}>换一个</button>
              <button onClick={startEdit}>改念头</button>
            </>
          )}
        </div>
      )}
    </div>
    <div className="bottom-actions">
      <button className="primary-action" disabled={actionsDisabled} onClick={begin}>现在开始</button>
      <button className="secondary-action" disabled={actionsDisabled} onClick={park}>先放着</button>
      <div className="intent-row" role="group" aria-label="行动意向">
        {INTENT_CHOICES.map((value) => <button key={value} className={intent === value ? 'selected' : undefined} disabled={actionsDisabled} onClick={() => chooseIntent(value)}>{value}</button>)}
      </div>
    </div>
  </motion.section>;
}
