import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { COLLAPSE_MS, fullClipPath, originClipPath, takeExpandOrigin, type ExpandOrigin } from './screen-origin';

export interface ExpandTransition {
  /** 是否走容器变换(有原点且未开 reduce-motion);否则调用方走自己的回退动效 */
  animated: boolean;
  /** 当前裁切值,放进元素的行内 style */
  clipPath: string | undefined;
  /** 追加到元素 class 上的过渡类(`bloom-in` / `bloom-out`) */
  className: string;
  /** 请求收回到原点:先播动画,时长走完再执行 finalize */
  leave: () => void;
}

/**
 * 容器变换:界面从被点的控件「长」出来,收回时按相反曲线缩回去。
 *
 * 两个刻意的选择:用内联 clip-path + CSS transition(自定义属性经动画库包装容易丢,
 * 丢了就是整屏闪现);收回用定时器驱动而不是退场动画机制(见 DESIGN §5)。
 */
export function useExpandTransition(finalizeLeave: () => void): ExpandTransition {
  const reduceMotion = useReducedMotion();
  // take 会清空暂存值,重复调用拿到 null;用 ref 兜住,渲染函数被重复调用也只取一次
  const originRef = useRef<ExpandOrigin | null | undefined>(undefined);
  if (originRef.current === undefined) originRef.current = takeExpandOrigin();
  const origin = originRef.current;
  const [animated] = useState(() => Boolean(origin) && !reduceMotion);
  /** 是否已经展开:初始 false 时首帧就是控件形状,不会先闪一下整屏 */
  const [open, setOpen] = useState(!animated);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);
  const finalizeRef = useRef(finalizeLeave);
  finalizeRef.current = finalizeLeave;

  // 首帧先落在控件形状,下一帧再展开,clip-path 由此产生过渡
  useEffect(() => {
    if (!animated || open) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [animated, open]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const leave = () => {
    if (!animated || leaving) {
      finalizeRef.current();
      return;
    }
    setLeaving(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      finalizeRef.current();
    }, COLLAPSE_MS);
  };

  return {
    animated,
    clipPath: animated && origin ? (leaving || !open ? originClipPath(origin) : fullClipPath(origin)) : undefined,
    className: animated ? (leaving ? ' bloom-out' : ' bloom-in') : '',
    leave,
  };
}
