import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CaretLeft } from '@phosphor-icons/react';
import { PENDING_RECYCLE_MS, useAppState, useDispatch } from '../store/store';
import { generateAction } from '../lib/ai';
import { getAction } from '../lib/mock';
import { useExpandTransition } from '../lib/use-expand-transition';
import { DEFAULT_MINUTES, DURATION_OPTIONS, durationFigure, durationLabel, durationUnit, parseMinutes } from '../lib/duration';
import { popIn, riseIn, SPRING_IN } from '../lib/motion';
import type { DOAction, DOIntent, DOStatus } from '../types';
import NavBar from '../components/NavBar';
import './action.css';

/**
 * 第一步页（V2 稿 03）：黑卡放一个最小行动，大字是「多少分钟」，下面三个档位可以调。
 * 三选语义不变：现在开始 → 待记录·愿意去做；先不做，改天再说 → 待定·暂不决定；
 * 不想做了 → 待定·不想做了（parkedAt 回拨，自然沉入历史）。
 */
export default function ActionPage() {
  const { idea, dos, activeDOId, settings } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  // 从「正在进行的 DO」点进来时，原话与行动内容都来自该 DO
  const matched = activeDOId ? dos.find((item) => item.id === activeDOId) : undefined;
  const activeDO = matched && matched.thought === idea ? matched : undefined;
  const [action, setAction] = useState<DOAction | null>(() => activeDO?.action ?? null);
  const [generating, setGenerating] = useState(() => !activeDO);
  const [minutes, setMinutes] = useState(() => parseMinutes(activeDO?.action.time) ?? DEFAULT_MINUTES);
  // 生成令牌：只让最新一次 generateAction 的响应生效（StrictMode 双挂载时防串）
  const runToken = useRef(0);

  const runGenerate = (text: string) => {
    const token = ++runToken.current;
    setGenerating(true);
    generateAction(text, settings)
      .then((next) => {
        if (runToken.current !== token) return;
        setAction(next);
        setMinutes(parseMinutes(next.time) ?? DEFAULT_MINUTES);
        setGenerating(false);
      })
      .catch(() => {
        // adapter 已在失败时回落 mock，这里再兜一层：页面永不卡在「想一下…」
        if (runToken.current !== token) return;
        const next = getAction(text);
        setAction(next);
        setMinutes(parseMinutes(next.time) ?? DEFAULT_MINUTES);
        setGenerating(false);
      });
  };

  useEffect(() => {
    if (activeDO) {
      setAction(activeDO.action);
      setMinutes(parseMinutes(activeDO.action.time) ?? DEFAULT_MINUTES);
      setGenerating(false);
      return;
    }
    runGenerate(idea);
  }, [idea]); // settings 在页面生命周期内视为不变，不纳入依赖

  /** 真正离开：清掉临时状态回首页（收回动画播完后由 hook 调用） */
  const finalizeLeave = () => {
    dispatch({ type: 'setIdea', idea: '' });
    dispatch({ type: 'setActiveDO', id: null });
    dispatch({ type: 'goHome' });
  };
  const expand = useExpandTransition(finalizeLeave);
  const leave = expand.leave;

  const commit = (choice: { intent: DOIntent; status: DOStatus; parkedAt?: number }) => {
    if (!action) return;
    const { intent, status, parkedAt } = choice;
    // 时长的选择写在 action.time 上，与行动本身一起落库
    const finalAction: DOAction = { ...action, time: durationLabel(minutes) };
    if (activeDO) {
      dispatch({ type: 'updateDO', id: activeDO.id, patch: { intent, status, action: finalAction, ...(parkedAt === undefined ? {} : { parkedAt }) } });
    } else {
      dispatch({ type: 'addDO', thought: idea, action: finalAction, status, parkedAt, intent });
    }
    leave();
  };

  const disabled = !idea.trim() || generating || !action;

  return <motion.section
    className={`page action-page${expand.className}`}
    style={expand.clipPath ? { clipPath: expand.clipPath } : undefined}
    initial={expand.animated ? false : { x: '30%', opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={expand.animated || reduceMotion ? { duration: 0 } : SPRING_IN}
  >
    <NavBar
      left={<button className="icon-action" onClick={() => dispatch({ type: 'setScreen', screen: 'input', direction: 'back' })} aria-label="返回"><CaretLeft size={19} weight="bold" /></button>}
      title=""
      /* V2 稿右槽是「换一个建议」，2026-09-17 用户决定不复刻：保持「行动页不给换」的旧结论 */
      right={<span className="nav-spacer" />}
    />

    <div className="action-content">
      <motion.div {...riseIn(reduceMotion, 0, 20)}>
        <span className="kicker">为你挑的第一步</span>
        <h1 className="page-title action-headline">现在能做的，最小一步。</h1>
        <p className="action-idea">{idea}</p>
      </motion.div>

      <motion.div className="ink-card action-card" {...popIn(reduceMotion, 0.08, 30, 0.9)}>
        <span className="kicker">建议从这里开始</span>
        {action
          ? <>
              <p className="figure action-figure">
                {durationFigure(minutes)}<em>{durationUnit(minutes)}</em>
              </p>
              <div className="action-rule" />
              <p className="action-body">{action.title}</p>
              <p className="action-stop">{action.stop}</p>
            </>
          : <p className="action-pending thinking-pulse">想一下…</p>}
      </motion.div>

      <motion.div className="duration-row" {...riseIn(reduceMotion, 0.2, 24)}>
        {DURATION_OPTIONS.map((option) => <button
          key={option}
          className={`duration-option${option === minutes ? ' selected' : ''}`}
          aria-pressed={option === minutes}
          disabled={generating}
          onClick={() => setMinutes(option)}
        >
          <b className="figure">{durationFigure(option)}</b>
          <small>{durationUnit(option) === 'HR' ? '小时' : '分钟'}</small>
        </button>)}
      </motion.div>
    </div>

    <motion.div className="bottom-actions" {...riseIn(reduceMotion, 0.28, 34)}>
      <button className="primary-action" disabled={disabled} onClick={() => commit({ intent: '愿意去做', status: '待记录' })}>现在开始</button>
      <button className="secondary-action" disabled={disabled} onClick={() => commit({ intent: '暂不决定', status: '待定', parkedAt: Date.now() })}>先不做，改天再说</button>
      <button className="quiet-action" disabled={disabled} onClick={() => commit({ intent: '不想做了', status: '待定', parkedAt: Date.now() - PENDING_RECYCLE_MS - 60_000 })}>不想做了</button>
    </motion.div>
  </motion.section>;
}
