import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'motion/react';

/**
 * 大标题的「惯性甩出」:标题比页面轻,页面被横向拖动时它跟不上,于是相对页面甩出去,
 * 手一停再弹回原位。
 *
 * 两条必须守住的规则:
 * 1. **静止态永远在原位**——偏移只能是运动过程中的瞬态。写成静止态(非激活就偏移 46px)
 *    等于「拉着不放、松手才弹回」,和手指脱钩。
 * 2. **偏移量跟速度走**,不跟位置走;手指按住不动时速度为零,所以有「静默 90ms 即收回」兜底。
 *
 * 弹簧的欠阻尼在目标归零时过冲一次,那一下就是「弹回来」。
 */

/** 每次滚动事件的位移乘这个系数得到偏移量 */
const LAG_PER_PIXEL = 1.8;
/** 偏移上限:再快也不把标题甩出画面 */
const LAG_MAX = 46;
/** 滚动静默多久判定手停了,把偏移收回原位 */
const IDLE_MS = 90;

export interface SwipeLag {
  /** 放进 motion 元素的 style={{ x }} */
  lag: MotionValue<number>;
  /** 滚动回调里喂入本次事件的位移量(px,可为负) */
  report: (deltaX: number) => void;
  /** 重新对齐分页位置时清空偏移 */
  reset: () => void;
}

export function useSwipeLag(reduceMotion: boolean | null): SwipeLag {
  const target = useMotionValue(0);
  // 欠阻尼(ζ≈0.46),目标归零时过冲一次
  const lag = useSpring(target, { stiffness: 300, damping: 15, mass: 0.9 });
  const idleTimer = useRef<number | null>(null);

  const clearIdle = useCallback(() => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const report = useCallback((deltaX: number) => {
    if (reduceMotion) return;
    // scrollLeft 变大 = 内容往左走 = 标题跟不上、落在它该在的位置右边,所以取正
    const next = deltaX * LAG_PER_PIXEL;
    target.set(Math.max(-LAG_MAX, Math.min(LAG_MAX, next)));
    clearIdle();
    idleTimer.current = window.setTimeout(() => {
      idleTimer.current = null;
      target.set(0);
    }, IDLE_MS);
  }, [clearIdle, reduceMotion, target]);

  const reset = useCallback(() => {
    clearIdle();
    target.set(0);
  }, [clearIdle, target]);

  useEffect(() => clearIdle, [clearIdle]);

  return { lag, report, reset };
}
