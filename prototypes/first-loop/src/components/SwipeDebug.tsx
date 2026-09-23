import { useEffect, useState } from 'react';

/**
 * 横滑诊断面板（只在 URL 带 `?debug=swipe` 时挂载）。
 *
 * 为什么需要它：`#43 横滑` 是本项目**唯一一处无法在本机验证**的交互——headless Chrome 的输入
 * 管线驱动不了 `.tab-pager` 的横向滚动（滚轮 / 合成手势 / 触摸模拟全试过，见
 * `scripts/probe-swipe.mjs`），真机事件流又拿不到。于是把「事件到底走到哪一步」直接画在屏幕上：
 * 用户一滑，屏幕上就有机器可读的答案，不必靠复述现象。
 *
 * 它回答三个问题：
 *   ① 输入事件有没有到？（touchstart / touchmove / wheel 计数与 target）
 *   ② 到了之后容器有没有动？（`scrollLeft` 实时值）
 *   ③ 没动的话，是被谁挡的？（命中元素的 `touch-action` / `overflow` / 祖先链）
 */
const MAX_LINES = 14;

function describe(target: EventTarget | null): string {
  if (!(target instanceof Element)) return String(target);
  const cls = target.className && typeof target.className === 'string' ? `.${target.className.trim().split(/\s+/)[0]}` : '';
  return `${target.tagName.toLowerCase()}${cls}`;
}

/** 从命中元素向上找第一个「真的能滚」的祖先，报告它的横向能力 */
function scrollChain(target: EventTarget | null): string {
  if (!(target instanceof Element)) return '-';
  const chain: string[] = [];
  let node: Element | null = target;
  while (node && chain.length < 6) {
    const cs = getComputedStyle(node);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      chain.push(`${describe(node)}[ox:${cs.overflowX},oy:${cs.overflowY},sw:${(node as HTMLElement).scrollWidth},cw:${(node as HTMLElement).clientWidth}]`);
    }
    node = node.parentElement;
  }
  return chain.join(' ← ') || '无滚动容器';
}

export default function SwipeDebug() {
  const [lines, setLines] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState('');

  useEffect(() => {
    const pager = () => document.querySelector('.tab-pager') as HTMLElement | null;
    const push = (line: string) => setLines((prev) => [...prev.slice(-(MAX_LINES - 1)), line]);

    const refreshSnapshot = () => {
      const p = pager();
      if (!p) return;
      const cs = getComputedStyle(p);
      setSnapshot(
        `scrollLeft=${Math.round(p.scrollLeft)} / scrollWidth=${p.scrollWidth} clientWidth=${p.clientWidth}` +
          ` | touch-action=${cs.touchAction} overflow-x=${cs.overflowX} snap=${cs.scrollSnapType}` +
          ` | 视口=${window.innerWidth}×${Math.round(window.innerHeight)} dpr=${window.devicePixelRatio}`,
      );
    };
    refreshSnapshot();
    const ticker = window.setInterval(refreshSnapshot, 400);

    let touchStarts = 0;
    let touchMoves = 0;
    let wheels = 0;
    let lastMoveTarget: EventTarget | null = null;

    const onTouchStart = (event: TouchEvent) => {
      touchStarts += 1;
      lastMoveTarget = event.target;
      const el = event.target;
      const ta = el instanceof Element ? getComputedStyle(el).touchAction : '?';
      push(`touchstart #${touchStarts} @ ${describe(el)} touch-action=${ta}`);
      push(`   链: ${scrollChain(el)}`);
    };
    const onTouchMove = (event: TouchEvent) => {
      touchMoves += 1;
      lastMoveTarget = event.target;
      if (touchMoves <= 3 || touchMoves % 8 === 0) {
        const p = pager();
        push(`touchmove #${touchMoves} @ ${describe(event.target)} → scrollLeft=${p ? Math.round(p.scrollLeft) : '?'}`);
      }
    };
    const onTouchEnd = () => {
      const p = pager();
      push(`touchend → scrollLeft=${p ? Math.round(p.scrollLeft) : '?'}（move 共 ${touchMoves} 次）`);
    };
    const onWheel = (event: WheelEvent) => {
      wheels += 1;
      if (wheels <= 3 || wheels % 8 === 0) {
        const p = pager();
        push(`wheel #${wheels} dx=${Math.round(event.deltaX)} dy=${Math.round(event.deltaY)} → scrollLeft=${p ? Math.round(p.scrollLeft) : '?'}`);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      push(`pointerdown @ ${describe(event.target)} pointerType=${event.pointerType}`);
    };

    // capture 阶段挂：先于 React 的处理器，能看出事件有没有被 upstream 吃掉
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    document.addEventListener('wheel', onWheel, { capture: true, passive: true });
    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    return () => {
      window.clearInterval(ticker);
      document.removeEventListener('touchstart', onTouchStart, { capture: true });
      document.removeEventListener('touchmove', onTouchMove, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('wheel', onWheel, { capture: true });
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      void lastMoveTarget;
    };
  }, []);

  return <div className="swipe-debug" role="status" aria-live="polite">
    <strong>横滑诊断（?debug=swipe）</strong>
    <p className="swipe-debug-snapshot">{snapshot}</p>
    <div className="swipe-debug-log">
      {lines.length === 0
        ? <span className="swipe-debug-hint">在首页左右滑一下（手指／触控板）；鼠标拖拽不会产生任何事件，这是浏览器标准行为。</span>
        : lines.map((line, index) => <span key={index}>{line}</span>)}
    </div>
  </div>;
}
