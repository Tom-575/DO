import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowUp } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { planAction } from '../lib/ai';
import { planActionMock } from '../lib/mock';
import type { PlanReply, PlanTurn } from '../types';
import NavBar from '../components/NavBar';
import './input.css';

/** 输入时自适应高度:内容多高输入区就多高,封顶后内滚,不把对话区挤没 */
function grow(element: HTMLTextAreaElement): void {
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
}

/**
 * 输入页(#15)= 对话规划流:用户的念头原话就是第一条消息,DO 至多问两次,
 * 行动落定即进行动页。对话只活在本地 state;store 只在行动落定时收到原话与 plannedAction。
 */
export default function InputPage() {
  const { settings } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const [turns, setTurns] = useState<PlanTurn[]>([]);
  // 选项只属于最新一条提问,新一轮发送即清空,避免误点旧选项
  const [options, setOptions] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  // 请求令牌:返回首页即作废在途回复,防止迟到的 action 把用户从首页拽走
  const runToken = useRef(0);
  const streamRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const stream = streamRef.current;
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, [turns, thinking]);

  const applyReply = (reply: PlanReply, origin: string, token: number) => {
    if (runToken.current !== token) return;
    setThinking(false);
    if (reply.kind === 'action') {
      // 行动落定:plannedAction 交给行动页采用;念头写用户原话,不用 AI 转述
      dispatch({ type: 'setPlannedAction', action: reply.action });
      dispatch({ type: 'setIdea', idea: origin });
      dispatch({ type: 'setScreen', screen: 'action' });
      return;
    }
    setTurns((prev) => [...prev, { role: 'assistant', text: reply.text }]);
    setOptions(reply.options ?? []);
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;
    const nextTurns: PlanTurn[] = [...turns, { role: 'user', text }];
    const token = ++runToken.current;
    setTurns(nextTurns);
    setDraft('');
    setOptions([]);
    setThinking(true);
    if (composeRef.current) composeRef.current.style.height = '';
    planAction(nextTurns, settings)
      .then((reply) => applyReply(reply, nextTurns[0].text, token))
      .catch(() => {
        // adapter 已在失败时回落 mock,这里再兜一层:对话永不卡在「想一下…」
        applyReply(planActionMock(nextTurns), nextTurns[0].text, token);
      });
  };

  const leave = () => {
    // 返回即放弃整段对话:作废在途请求、清空念头,不留半成品
    runToken.current += 1;
    setTurns([]);
    setDraft('');
    setOptions([]);
    setThinking(false);
    dispatch({ type: 'setIdea', idea: '' });
    dispatch({ type: 'goHome' });
  };

  return <motion.section className="page input-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={leave} aria-label="返回"><ArrowLeft size={23} /></button>} title="新的 DO" right={<span className="nav-spacer" />} />
    <div className="plan-stream" ref={streamRef}>
      {turns.length === 0 && <p className="plan-hint">不用先想清楚目标或计划。</p>}
      {turns.map((turn, index) => turn.role === 'user'
        ? <p className="plan-bubble mine" key={index}>{turn.text}</p>
        : <div className="plan-turn" key={index}>
            <p className="plan-bubble">{turn.text}</p>
            {index === turns.length - 1 && options.map((option) => <button className="plan-option" key={option} onClick={() => send(option)}>{option}</button>)}
          </div>)}
      {thinking && <p className="plan-bubble pending">想一下…</p>}
    </div>
    <div className="plan-compose">
      <textarea ref={composeRef} rows={1} value={draft} autoFocus placeholder="想到什么，就写什么" onChange={(event) => { setDraft(event.target.value); grow(event.target); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(draft); } }} />
      <button className="keyboard-action" disabled={thinking || !draft.trim()} onClick={() => send(draft)} aria-label="发送"><ArrowUp weight="bold" size={21} /></button>
    </div>
  </motion.section>;
}
