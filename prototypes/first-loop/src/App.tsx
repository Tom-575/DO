import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useAppState, useDispatch } from './store/store';
import type { Tab } from './store/types';
import TodayPage from './pages/TodayPage';
import TracesPage from './pages/TracesPage';
import InputPage from './pages/InputPage';
import ActionPage from './pages/ActionPage';
import RecordPage from './pages/RecordPage';
import StartPage from './pages/StartPage';
import TabBar from './components/TabBar';
import AppearancePanel from './components/AppearancePanel';
import SwipeDebug from './components/SwipeDebug';
import { useSwipeLag } from './lib/use-swipe-lag';

/** 「我的」里的内置背景值;渐变取色与 components/appearance.css 的 .background-swatch 保持一致（CSS 读不到这里的常量，改一处要同步另一处） */
const BUILTIN_BACKGROUNDS: Record<'mist' | 'night', string> = {
  mist: 'linear-gradient(135deg, #e2dcd4, #faf7f3)',
  night: 'linear-gradient(135deg, #1b1a18, #4d4740)',
};

/** 底部两个分页 Tab 的顺序,与 .tab-pager 里的 slide 顺序一致 */
const TABS: Tab[] = ['today', 'traces'];

/** `?debug=swipe` 时挂上横滑诊断面板（把事件流画在屏幕上，见 components/SwipeDebug.tsx） */
const SWIPE_DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'swipe';

/** 锁定为横向手势所需的最小位移:小于它之前先不动,把纵向手势留给页内的滚动容器 */
const AXIS_LOCK_PX = 8;
/** 翻页阈值:与页宽取较大者,免得短屏上过于灵敏 */
const SWIPE_MIN_PX = 40;
const SWIPE_RATIO = 0.22;
/** 首尾页继续往外拖时的阻尼 */
const EDGE_RESISTANCE = 0.32;

export default function App() {
  const { screen, tab, settings } = useAppState();
  const dispatch = useDispatch();
  const { theme, background } = settings;
  const reduceMotion = useReducedMotion();
  const pagerRef = useRef<HTMLDivElement>(null);
  /** 大标题的横向惯性甩出:静止永远在原位,只有动的时候才甩 */
  const { lag: titleLag, report: reportSwipe, reset: resetSwipe } = useSwipeLag(reduceMotion);
  const tabIndex = Math.max(0, TABS.indexOf(tab));

  /**
   * 横滑 = **pointer 事件自己跟手**，不用原生 `overflow-x` 滚动（#43）。
   *
   * 为什么换掉原生方案：这个分页器内部每页还要各自纵向滚动，于是成了「外层横向滚动容器 +
   * 内层纵向滚动容器」的嵌套。这种结构在移动端的手势竞争极不可靠——线上真机反复报
   * 「手指左右滑完全不动」，而本机又无法用 CDP 合成滚动来复现（连临时插入的最简
   * `overflow-x:auto` 容器也推不动，所以证明不了任何事）。
   *
   * 换成 pointer 之后：真机上走的是标准 DOM 事件，不受嵌套滚动规则摆布；桌面上也能用
   * 鼠标拖拽真实验证（CDP 派发得了 pointer，派发不了滚动）。
   * 代价：失去原生惯性，翻页动画由 CSS transition 承担（参数见 §5.2）。
   */
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(0);
  const gesture = useRef({ active: false, axis: null as null | 'x' | 'y', startX: 0, startY: 0, lastX: 0 });

  const setDrag = (next: number) => {
    dragRef.current = next;
    setDragX(next);
  };

  const onPagerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // 指针捕获:手指移出容器也不会丢事件
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { active: true, axis: null, startX: event.clientX, startY: event.clientY, lastX: event.clientX };
    setDragging(true);
  };

  const onPagerPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g.active) return;
    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;
    if (!g.axis) {
      // 还没定向:位移太小先不动,别把一次轻点变成抖动
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'y') return; // 纵向手势交给页内的滚动容器,本层不接管
    }
    if (g.axis !== 'x') return;
    // 首尾页继续往外拖时给阻尼,避免「拖了却什么都没有」的空感
    const atEdge = (tabIndex === 0 && dx > 0) || (tabIndex === TABS.length - 1 && dx < 0);
    setDrag(atEdge ? dx * EDGE_RESISTANCE : dx);
    // 大标题的惯性甩出:喂的是「这次新增的位移」,方向与从前的 scrollLeft 增量保持一致
    reportSwipe(g.lastX - event.clientX);
    g.lastX = event.clientX;
  };

  const finishGesture = () => {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    setDragging(false);
    const moved = dragRef.current;
    setDrag(0);
    if (g.axis !== 'x') return;
    const width = pagerRef.current?.clientWidth ?? 0;
    const threshold = Math.max(SWIPE_MIN_PX, width * SWIPE_RATIO);
    if (moved < -threshold && tabIndex < TABS.length - 1) dispatch({ type: 'setTab', tab: TABS[tabIndex + 1] });
    else if (moved > threshold && tabIndex > 0) dispatch({ type: 'setTab', tab: TABS[tabIndex - 1] });
  };

  // 视口尺寸变化(桌面缩放窗口 / 手机横竖屏)后清掉惯性甩出的偏移
  useEffect(() => {
    const onResize = () => resetSwipe();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [resetSwipe]);

  // 内置渐变直接用;图片地址则叠一层 --backdrop 蒙层,保证任意照片上的文字对比度
  const builtinBackground = background === 'mist' || background === 'night' ? BUILTIN_BACKGROUNDS[background] : null;
  const backgroundStyle: CSSProperties =
    background === 'none'
      ? {}
      : { backgroundImage: builtinBackground ?? `linear-gradient(var(--backdrop),var(--backdrop)),url(${background})` };

  return <div className={`prototype-frame theme-${theme}`}>
    <div className={`phone-app ${background !== 'none' ? 'has-background' : ''}`} style={backgroundStyle}>
      {/* 出发页（V2）：冷启动一次性引导，看过即进首页 */}
      {settings.onboarded === false ? <StartPage /> : <>
        {/* 首页常驻在底层:push 屏做容器变换时,外面露出来的必须是真实的上一屏而不是空白底 */}
        <motion.section
          className={`page main-page${screen === 'home' ? '' : ' receded'}`}
          inert={screen !== 'home'}
          aria-hidden={screen !== 'home'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          {/* 分页器:两页各自保留纵向滚动位置,未激活的一页 inert;位移由 pointer 手势驱动 */}
          <div
            className={`tab-pager${dragging ? ' dragging' : ''}`}
            ref={pagerRef}
            style={{ transform: `translateX(calc(${-tabIndex * 100}% + ${dragX}px))` }}
            onPointerDown={onPagerPointerDown}
            onPointerMove={onPagerPointerMove}
            onPointerUp={finishGesture}
            onPointerCancel={finishGesture}
          >
            <div className="tab-slide" inert={tab !== 'today'}>
              <div className="app-scroll"><TodayPage titleLag={titleLag} /></div>
            </div>
            <div className="tab-slide" inert={tab !== 'traces'}>
              <div className="app-scroll"><TracesPage titleLag={titleLag} /></div>
            </div>
          </div>
          <TabBar />
        </motion.section>
        {/* 只在有 push 屏时才渲染这一层:空的绝对定位层会盖住整屏、把首页的点击全吃掉 */}
        {screen !== 'home' && <div className="push-layer">
          {screen === 'input' && <InputPage key="input" />}
          {screen === 'action' && <ActionPage key="action" />}
          {screen === 'record' && <RecordPage key="record" />}
          {screen === 'appearance' && <AppearancePanel key="appearance" />}
        </div>}
      </>}
    </div>
    {SWIPE_DEBUG && <SwipeDebug />}
  </div>;
}
