import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { motion, useReducedMotion, type MotionValue } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { selectHomeQueue, useAppState, useDispatch } from '../store/store';
import { isAIConfigured } from '../lib/ai';
import { formatKicker } from '../lib/date';
import { memoryDayLabel } from '../lib/memories-date';
import { formatDuration, parseMinutes } from '../lib/duration';
import { attemptCount, latestCover, outcomeTone } from '../lib/traces';
import { useImageUrls } from '../lib/image-urls';
import { EASE_OUT, riseIn, stagger } from '../lib/motion';
import { growTextarea } from '../lib/textarea';
import { captureExpandOrigin } from '../lib/screen-origin';
import type { DO } from '../types';
import AppearanceButton from '../components/AppearanceButton';
import PreviousRow from '../components/PreviousRow';
import './today.css';

interface TodayPageProps {
  /**
   * 大标题的横向惯性甩出(来自 App 的 useSwipeLag)。
   * 注意它**只在运动过程中**有值,静止时恒为 0——所以静止时标题永远在原位。
   */
  titleLag: MotionValue<number>;
}

/**
 * 今天页（V2 稿 02）：墨黑念头卡（写一句 → 帮我找到第一步）+ 正在进行 + 最近的痕迹。
 * 念头存在 store.idea（与对话规划页同一份），切页不丢。
 */
export default function TodayPage({ titleLag }: TodayPageProps) {
  const { dos, records, idea, historyOpen, settings } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  // 回收在渲染时按 now 计算，每分钟校准一次，跨过回收线的 DO 会自动下沉
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { main, alternate, extra, recycled } = selectHomeQueue(dos, now);
  const moreRows: DO[] = [...(alternate ? [alternate] : []), ...extra];
  const canExpand = Boolean(main) && moreRows.length + recycled.length > 0;

  /* 正在进行卡：尝试次数 = 关联到它的记录条数；封面 = 最近一条带图的关联记录 */
  const cover = main ? latestCover(records, main.id) : undefined;
  const coverList = useMemo(() => (cover ? [cover] : []), [cover]);
  const coverUrl = useImageUrls(coverList)[0];
  const attempts = main ? attemptCount(records, main.id) : 0;
  const maxMinutes = main ? parseMinutes(main.action.time) : null;

  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const recent = records.slice(0, 2);
  const ideaOf = (linkedDOId?: string) => dos.find((item) => item.id === linkedDOId)?.thought;

  const goPlan = (event: MouseEvent<HTMLButtonElement>) => {
    // 新屏幕从这颗按钮「长」出来：两种去向共用同一个原点，量取必须在卸载前同步完成
    captureExpandOrigin(event.currentTarget);
    dispatch({ type: 'setActiveDO', id: null });
    // 没配 AI 时对话页只会跑 mock 的关键词提问（"想在哪儿动一动？"），价值低还多一步：
    // 直接进第一步页（#46）。行动仍由 lib/mock 的关键词模板生成，与对话落定后同一个函数。
    dispatch({ type: 'setScreen', screen: isAIConfigured(settings) ? 'input' : 'action' });
  };

  const openAction = (event: MouseEvent<HTMLButtonElement>, item: DO) => {
    captureExpandOrigin(event.currentTarget);
    dispatch({ type: 'setActiveDO', id: item.id });
    dispatch({ type: 'setIdea', idea: item.thought });
    dispatch({ type: 'setScreen', screen: 'action' });
  };

  return <>
    {/* 页面位移交给原生横滑；只有大标题跟着惯性甩一下，手停即回原位 */}
    <header className="today-header">
      <motion.div style={{ x: titleLag }}>
        <span className="kicker">{formatKicker(new Date(now))}</span>
        <h1 className="page-title">今天</h1>
      </motion.div>
      <AppearanceButton />
    </header>

    <main className="today-content">
      <motion.section className="ink-card idea-card" {...riseIn(reduceMotion, 0, 30)}>
        <span className="kicker">一个模糊的念头</span>
        <textarea
          ref={ideaRef}
          className="idea-input"
          rows={1}
          value={idea}
          placeholder="想做什么，写一句就行。"
          aria-label="一个模糊的念头"
          onChange={(event) => {
            dispatch({ type: 'setIdea', idea: event.target.value });
            growTextarea(event.target, 96);
          }}
        />
        {/* 不给示例 chip（2026-09-19 用户决定）：推荐词会把「模糊的念头」收窄成三个固定答案 */}
        {/* 念头为空时不做「灰掉的按钮」（那会读成这个按钮坏了）：保持蜜桃色，点了把光标送进输入框 */}
        <button className="pill pill-peach idea-go" aria-label="交给 DO，找到第一步" onClick={(event) => {
          if (!idea.trim()) {
            ideaRef.current?.focus();
            return;
          }
          goPlan(event);
        }}>
          DO
          <ArrowRight size={17} weight="bold" />
        </button>
      </motion.section>

      <motion.section className="today-section" {...riseIn(reduceMotion, 0.12, 30)}>
        <div className="section-head">
          <h2 className="section-title">正在进行</h2>
          {canExpand && <button className="text-action" onClick={() => dispatch({ type: 'toggleHistory' })} aria-expanded={historyOpen}>
            {historyOpen ? '收起' : '全部'}
          </button>}
        </div>
        {main ? <>
          <button className="card do-card" onClick={(event) => openAction(event, main)}>
            <span className="do-cover">
              {coverUrl
                ? <img className="media-in" src={coverUrl} alt="" loading="lazy" />
                : <span className="do-cover-fallback" aria-hidden="true" />}
            </span>
            <span className="do-main">
              <strong>{main.thought}</strong>
              <small>{attempts > 0
                ? `已经试了 ${attempts} 次${maxMinutes ? ` · 最长 ${formatDuration(maxMinutes)}` : ''}`
                : '还没动手，随时可以走第一步'}</small>
            </span>
            <span className="do-count">
              <b className="figure">{attempts}</b>
              <small>次尝试</small>
            </span>
          </button>
        </> : <p className="today-empty">上面写一句，就会有一条 DO 在这里等你。</p>}

        {/* 展开区常驻挂载，靠 height/opacity 开合；收起时 inert */}
        {canExpand && <div className="do-earlier" inert={!historyOpen} aria-hidden={!historyOpen}>
          <motion.div className="do-earlier-body" initial={false}
            animate={{ height: historyOpen ? 'auto' : 0, opacity: historyOpen ? 1 : 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT }}>
            {moreRows.map((item, index) => <PreviousRow key={item.id} className="earlier-row" text={item.thought} enterDelay={stagger(index, 0.09, 5)} onClick={() => {
              dispatch({ type: 'setActiveDO', id: item.id });
              dispatch({ type: 'setIdea', idea: item.thought });
              dispatch({ type: 'setScreen', screen: 'action' });
            }} />)}
            {recycled.length > 0 && <p className="recycled-label">放了超过一天</p>}
            {recycled.map((item, index) => <PreviousRow className="earlier-row" key={item.id} muted text={item.thought} enterDelay={stagger(moreRows.length + index, 0.09, 5)} onClick={() => {
              dispatch({ type: 'setActiveDO', id: item.id });
              dispatch({ type: 'setIdea', idea: item.thought });
              dispatch({ type: 'setScreen', screen: 'action' });
            }} />)}
          </motion.div>
        </div>}
      </motion.section>

      <motion.section className="today-section" {...riseIn(reduceMotion, 0.2, 30)}>
        <div className="section-head">
          <h2 className="section-title">最近的痕迹</h2>
          {records.length > 0 && <button className="text-action" onClick={() => dispatch({ type: 'setTab', tab: 'traces' })}>看全部</button>}
        </div>
        {recent.length === 0
          ? <p className="today-empty">还没有痕迹。做完一件事，回来写一句。</p>
          : <div className="card trace-mini">
              {recent.map((record, index) => <div className={`trace-mini-row${index > 0 ? ' divided' : ''}`} key={record.id}>
                <span className={`trace-bar tone-${outcomeTone(record.outcome)}`} aria-hidden="true" />
                <span className="trace-mini-text">
                  <strong>{record.refined || record.text}</strong>
                  <small>{memoryDayLabel(record.createdAt)}{record.outcome ? ` · ${record.outcome}` : ''}{ideaOf(record.linkedDOId) ? ` · ${ideaOf(record.linkedDOId)}` : ''}</small>
                </span>
              </div>)}
            </div>}
      </motion.section>
    </main>
  </>;
}
