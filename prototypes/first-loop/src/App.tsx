import { useEffect, useRef, type CSSProperties } from 'react';
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

/** `?debug=swipe` 时挂上横滑诊断面板（headless 验不了触摸，只能把事件流画在屏幕上） */
const SWIPE_DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'swipe';

/** 点 Tab 的程序化滚动期间忽略落点判定的时长:这段滚动会掠过对侧页,跟着判定会把用户按回去 */
const PROGRAMMATIC_GUARD_MS = 600;

export default function App() {
  const { screen, tab, settings } = useAppState();
  const dispatch = useDispatch();
  const { theme, background } = settings;
  const reduceMotion = useReducedMotion();
  const pagerRef = useRef<HTMLDivElement>(null);
  /** 记录「已按当前分页定位过的节点」:换节点时直接落位,不做平滑滚动 */
  const positionedNode = useRef<HTMLDivElement | null>(null);
  /** 单页宽度缓存:滚动回调里不再读 clientWidth,避免每帧触发布局 */
  const pageWidthRef = useRef(0);
  /** 程序化滚动守卫的截止时间戳;在此之前不做落点判定 */
  const guardedUntil = useRef(0);
  /** 这次 tab 变化是否由手势(拖拽 / 惯性)驱动:是则只让状态跟上,绝不介入滚动位置 */
  const tabFromGesture = useRef(false);
  /** 上一次滚动位置:用来算每次事件的位移量(喂养标题的惯性甩出) */
  const lastScrollLeft = useRef(0);
  /** 大标题的横向惯性甩出:静止永远在原位,只有动的时候才甩 */
  const { lag: titleLag, report: reportSwipe, reset: resetSwipe } = useSwipeLag(reduceMotion);
  /** 最新 tab 的镜像,供滚动回调读取(回调可能晚于一次渲染) */
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const tabIndex = Math.max(0, TABS.indexOf(tab));
  // 内置渐变直接用;图片地址则叠一层 --backdrop 蒙层,保证任意照片上的文字对比度
  const builtinBackground = background === 'mist' || background === 'night' ? BUILTIN_BACKGROUNDS[background] : null;
  const backgroundStyle: CSSProperties =
    background === 'none'
      ? {}
      : { backgroundImage: builtinBackground ?? `linear-gradient(var(--backdrop),var(--backdrop)),url(${background})` };

  // tab 状态 → 分页位置:点 Tab、保存记录后跳痕迹页都走这里;首次挂载直接落位,不闪一下。
  // 手势驱动的 tab 变化只对账、不动滚动位置——拖拽期间调用程序化滚动会打断触摸滚动,
  // 真机上就是「滑一下就弹回」(#43)。
  useEffect(() => {
    const fromGesture = tabFromGesture.current;
    tabFromGesture.current = false; // 先消费,任何早退分支都不会把标记留到下一次
    const pager = pagerRef.current;
    if (!pager) return;
    const firstForThisNode = positionedNode.current !== pager;
    positionedNode.current = pager;
    pageWidthRef.current = pager.clientWidth;
    if (fromGesture) {
      // 位置正由手指推进:状态跟上就够了,位置交给滚动本身
      lastScrollLeft.current = pager.scrollLeft;
      return;
    }
    const left = tabIndex * pager.clientWidth;
    if (Math.abs(pager.scrollLeft - left) < 2) return;
    // 位移基准要先对齐到起点,否则程序化滚动发出的第一个事件会被算成一次巨大位移
    lastScrollLeft.current = pager.scrollLeft;
    guardedUntil.current = Date.now() + PROGRAMMATIC_GUARD_MS;
    pager.scrollTo({ left, behavior: firstForThisNode || reduceMotion ? 'auto' : 'smooth' });
  }, [tabIndex, reduceMotion]);

  // 视口尺寸变化(桌面缩放窗口 / 手机横竖屏)后重新对齐当前页,避免停在半页
  useEffect(() => {
    const onResize = () => {
      const pager = pagerRef.current;
      if (!pager) return;
      pageWidthRef.current = pager.clientWidth;
      guardedUntil.current = Date.now() + PROGRAMMATIC_GUARD_MS;
      pager.scrollLeft = tabIndex * pager.clientWidth;
      lastScrollLeft.current = pager.scrollLeft;
      resetSwipe();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [tabIndex, resetSwipe]);

  /**
   * 滑动 → tab 状态:越过中点立刻翻,让指示胶囊在手指松开前就跟着走(等停稳再翻手感是断的)。
   * 程序化滚动期间走守卫窗口,用户一按下接管手势守卫即失效。
   */
  const syncTabFromScroll = () => {
    const pager = pagerRef.current;
    const width = pageWidthRef.current;
    if (!pager || width === 0) return;
    const x = pager.scrollLeft;
    const delta = x - lastScrollLeft.current;
    lastScrollLeft.current = x;
    // 标题的惯性甩出要先喂:点 Tab 的程序化滚动也该有同样的物理,不受下面守卫影响
    if (delta !== 0) reportSwipe(delta);

    if (Date.now() < guardedUntil.current) return;
    const landed = Math.round(x / width);
    const nextTab = TABS[Math.max(0, Math.min(TABS.length - 1, landed))];
    if (nextTab !== tabRef.current) {
      // 打上「这次是手势引起的」:状态跟手,位置继续交给手指
      tabFromGesture.current = true;
      dispatch({ type: 'setTab', tab: nextTab });
    }
  };

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
          {/* 一页一张的横滑分页器:两页各自保留纵向滚动位置,未激活的一页 inert */}
          <div
            className="tab-pager"
            ref={pagerRef}
            onScroll={syncTabFromScroll}
            /* 手一碰就作废程序化守卫:接下来是用户在滑,判定要立刻生效 */
            onPointerDown={() => { guardedUntil.current = 0; }}
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
