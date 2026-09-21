import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CaretLeft, PencilSimple } from '@phosphor-icons/react';
import { PENDING_RECYCLE_MS, useAppState, useDispatch } from '../store/store';
import { generateAction } from '../lib/ai';
import { getAction } from '../lib/mock';
import { useExpandTransition } from '../lib/use-expand-transition';
import { CUSTOM_MINUTES_MAX, CUSTOM_MINUTES_MIN, DURATION_OPTIONS, clampCustomMinutes, durationLabel, parseMinutes, snapToOption } from '../lib/duration';
import { EASE_OUT, popIn, riseIn, SPRING_IN } from '../lib/motion';
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
  // AI 给的时长只决定初始落在哪一档（吸附到最近档位），从不作为显示值出现（#48）
  const [minutes, setMinutes] = useState(() => snapToOption(parseMinutes(activeDO?.action.time)));
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  /** 用户有没有亲手动过时长。没动过就不写 action.time——别把 AI 的原话「大约 10 分钟」改成吸附后的 15 */
  const [timeTouched, setTimeTouched] = useState(false);
  // 生成令牌：只让最新一次 generateAction 的响应生效（StrictMode 双挂载时防串）
  const runToken = useRef(0);

  const runGenerate = (text: string) => {
    const token = ++runToken.current;
    setGenerating(true);
    generateAction(text, settings)
      .then((next) => {
        if (runToken.current !== token) return;
        setAction(next);
        setMinutes(snapToOption(parseMinutes(next.time)));
        setGenerating(false);
      })
      .catch(() => {
        // adapter 已在失败时回落 mock，这里再兜一层：页面永不卡在「想一下…」
        if (runToken.current !== token) return;
        const next = getAction(text);
        setAction(next);
        setMinutes(snapToOption(parseMinutes(next.time)));
        setGenerating(false);
      });
  };

  useEffect(() => {
    if (activeDO) {
      setAction(activeDO.action);
      setMinutes(snapToOption(parseMinutes(activeDO.action.time)));
      setGenerating(false);
      return;
    }
    runGenerate(idea);
  }, [idea]); // settings 在页面生命周期内视为不变，不纳入依赖

  /**
   * 真正离开：清掉临时状态回首页（收回动画播完后由 hook 调用）。
   * 返回与提交共用这一条出口：提交前已把 DO 落库，返回则什么都没写。
   */
  const finalizeLeave = () => {
    dispatch({ type: 'setIdea', idea: '' });
    dispatch({ type: 'setActiveDO', id: null });
    dispatch({ type: 'goHome' });
  };
  const expand = useExpandTransition(finalizeLeave);
  const leave = expand.leave;

  /** 已经不在固定档位上的分钟数 = 当前用的是自定义值 */
  const isCustom = !(DURATION_OPTIONS as readonly number[]).includes(minutes);

  /**
   * 自定义输入落定：夹到 1–90。
   * 空着或不是数字时**只是收起**，不替用户做决定——`clampCustomMinutes` 的「回落默认档」
   * 是给初始化用的，在这里用它会把一次手滑变成"时长被改成 5 分钟"。
   */
  const applyCustom = () => {
    const value = Number(customDraft);
    if (!customDraft.trim() || !Number.isFinite(value)) {
      setCustomOpen(false);
      return;
    }
    setMinutes(clampCustomMinutes(value));
    setTimeTouched(true);
    setCustomOpen(false);
  };

  const commit = (choice: { intent: DOIntent; status: DOStatus; parkedAt?: number }) => {
    if (!action) return;
    const { intent, status, parkedAt } = choice;
    // 只有用户亲手动过时长才改写 action.time（否则保留 AI 给的原话，见 design 行为契约 4）
    const finalAction: DOAction = { ...action, time: timeTouched ? durationLabel(minutes) : action.time };
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
      /* 返回 = 放弃这一步回首页。此前回对话页,而对话页挂载即重发念头、落定后又推回本页,
         形成「返回 → 弹回」循环(带 key 时每轮还夹一次真实请求) */
      left={<button className="icon-action" onClick={leave} aria-label="返回"><CaretLeft size={19} weight="bold" /></button>}
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
                {minutes}<em>MIN</em>
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
          onClick={() => {
            setMinutes(option);
            setTimeTouched(true);
            setCustomOpen(false);
          }}
        >
          <b className="figure">{option}</b>
          <small>分钟</small>
        </button>)}
        {/* 自定义是第三档：展开一个输入，而不是再来一颗预设胶囊 */}
        <button
          className={`duration-option duration-option-custom${isCustom ? ' selected' : ''}`}
          aria-pressed={isCustom}
          disabled={generating}
          onClick={() => {
            setCustomDraft(isCustom ? String(minutes) : '');
            setCustomOpen((open) => !open);
          }}
        >
          {isCustom
            ? <><b className="figure">{minutes}</b><small>分钟</small></>
            : <><PencilSimple size={20} /><small>自定义</small></>}
        </button>
      </motion.div>

      {/* 就地展开：按 §5.3「圆形 disclosure → 容器高度展开 / 收起，不做位移动效」，
          这里只做高度 + 透明度，不用带位移的 popIn */}
      {customOpen && <motion.div
        className="duration-custom"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
      >
        <label className="duration-custom-field">
          <input
            type="number"
            inputMode="numeric"
            min={CUSTOM_MINUTES_MIN}
            max={CUSTOM_MINUTES_MAX}
            value={customDraft}
            autoFocus
            placeholder={`${CUSTOM_MINUTES_MIN}–${CUSTOM_MINUTES_MAX}`}
            aria-label={`自定义时长（${CUSTOM_MINUTES_MIN}–${CUSTOM_MINUTES_MAX} 分钟）`}
            onChange={(event) => setCustomDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') applyCustom(); }}
          />
          <span>分钟</span>
        </label>
        <button className="duration-custom-confirm" onClick={applyCustom}>确定</button>
        <button className="duration-custom-cancel" onClick={() => setCustomOpen(false)}>取消</button>
      </motion.div>}
    </div>

    <motion.div className="bottom-actions" {...riseIn(reduceMotion, 0.28, 34)}>
      <button className="primary-action" disabled={disabled} onClick={() => commit({ intent: '愿意去做', status: '待记录' })}>现在开始</button>
      <button className="secondary-action" disabled={disabled} onClick={() => commit({ intent: '暂不决定', status: '待定', parkedAt: Date.now() })}>先不做，改天再说</button>
      <button className="quiet-action" disabled={disabled} onClick={() => commit({ intent: '不想做了', status: '待定', parkedAt: Date.now() - PENDING_RECYCLE_MS - 60_000 })}>不想做了</button>
    </motion.div>
  </motion.section>;
}
