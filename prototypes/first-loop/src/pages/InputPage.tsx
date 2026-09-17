import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUp, CaretLeft } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { planAction } from '../lib/ai';
import { planActionMock } from '../lib/mock';
import { useExpandTransition } from '../lib/use-expand-transition';
import { growTextarea } from '../lib/textarea';
import { PRESS_SCALE, SPRING_IN, SPRING_TAP, popIn, slideIn, stagger } from '../lib/motion';
import type { PlanReply, PlanTurn } from '../types';
import NavBar from '../components/NavBar';
import './input.css';

/**
 * 对话规划页（#15，V2 语言重排）：至多问两次，然后在第一步页给出单一最小行动。
 * 首页黑卡里的念头是第一条消息——进页即自动发出，用户不必再说一遍。
 */
export default function InputPage() {
  const { settings, navDirection, idea } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const [turns, setTurns] = useState<PlanTurn[]>([]);
  // 选项只属于最新一条提问，新一轮发送即清空，避免误点旧选项
  const [options, setOptions] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  // 请求令牌：返回首页即作废在途回复，防止迟到的 action 把用户从首页拽走
  const runToken = useRef(0);
  // 首页带来的念头只自动发一次（重复挂载 / StrictMode 双调用都不会发两次）
  const seeded = useRef(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const turnsRef = useRef<PlanTurn[]>([]);
  turnsRef.current = turns;

  // 新气泡 / 「想一下…」出现时滑到最新一条：平滑滚动，而不是瞬间跳到底
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.scrollTo({ top: stream.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [turns, thinking, reduceMotion]);

  const applyReply = (reply: PlanReply, origin: string, token: number) => {
    if (runToken.current !== token) return;
    setThinking(false);
    if (reply.kind === 'action') {
      // 行动落定：plannedAction 交给第一步页采用；念头写用户原话，不用 AI 转述
      dispatch({ type: 'setPlannedAction', action: reply.action });
      dispatch({ type: 'setIdea', idea: origin });
      dispatch({ type: 'setScreen', screen: 'action' });
      return;
    }
    setTurns((prev) => [...prev, { role: 'assistant', text: reply.text }]);
    setOptions(reply.options ?? []);
  };

  const send = (raw: string, base?: PlanTurn[]) => {
    const text = raw.trim();
    if (!text || thinking) return;
    const history: PlanTurn[] = [...(base ?? turnsRef.current), { role: 'user', text }];
    const token = ++runToken.current;
    setTurns(history);
    setDraft('');
    setOptions([]);
    setThinking(true);
    if (composeRef.current) composeRef.current.style.height = '';
    planAction(history, settings)
      .then((reply) => applyReply(reply, history[0].text, token))
      .catch(() => {
        // adapter 已在失败时回落 mock，这里再兜一层：对话永不卡在「想一下…」
        applyReply(planActionMock(history), history[0].text, token);
      });
  };

  useEffect(() => {
    if (seeded.current || !idea.trim()) return;
    seeded.current = true;
    send(idea, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 真正离开：收尾 dispatch（收回动画播完后由 hook 调用）。念头留在首页黑卡里，不清空 */
  const finalizeLeave = () => {
    // 返回即放弃整段对话：作废在途请求，不留半成品
    runToken.current += 1;
    setTurns([]);
    setDraft('');
    setOptions([]);
    setThinking(false);
    dispatch({ type: 'goHome' });
  };
  const expand = useExpandTransition(finalizeLeave);
  const leave = expand.leave;

  return <motion.section
    className={`page input-page${expand.className}`}
    style={expand.clipPath ? { clipPath: expand.clipPath } : undefined}
    initial={expand.animated ? false : { x: navDirection === 'back' ? '-30%' : '30%', opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={expand.animated || reduceMotion ? { duration: 0 } : SPRING_IN}
  >
    <NavBar
      left={<button className="icon-action" onClick={leave} aria-label="返回"><CaretLeft size={19} weight="bold" /></button>}
      title="找第一步"
      right={<span className="nav-spacer" />}
    />
    <div className="plan-stream" ref={streamRef}>
      {turns.length === 0 && <motion.p className="plan-hint" {...popIn(reduceMotion)}>不用先想清楚目标或计划。</motion.p>}
      {/* 气泡从各自的那一侧推入（用户从右、AI 从左），方向本身在传达「谁在说话」 */}
      {turns.map((turn, index) => turn.role === 'user'
        ? <motion.p className="plan-bubble mine" key={index} {...slideIn(reduceMotion, 1)}>{turn.text}</motion.p>
        : <motion.div className="plan-turn" key={index} {...slideIn(reduceMotion, -1)}>
            <p className="plan-bubble">{turn.text}</p>
            {index === turns.length - 1 && options.map((option, i) => <motion.button className="plan-option" key={option}
              whileTap={reduceMotion ? undefined : { scale: PRESS_SCALE, transition: SPRING_TAP }}
              {...popIn(reduceMotion, stagger(i + 1, 0.07), 22, 0.84)} onClick={() => send(option)}>{option}</motion.button>)}
          </motion.div>)}
      {thinking && <p className="plan-bubble pending thinking-dots" aria-label="想一下…">
        <span /><span /><span />
      </p>}
    </div>
    <div className="plan-compose">
      <textarea ref={composeRef} rows={1} value={draft} placeholder="想到什么，就写什么" onChange={(event) => { setDraft(event.target.value); growTextarea(event.target, 96); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(draft); } }} />
      <button className="keyboard-action" disabled={thinking || !draft.trim()} onClick={() => send(draft)} aria-label="发送"><ArrowUp weight="bold" size={20} /></button>
    </div>
  </motion.section>;
}
