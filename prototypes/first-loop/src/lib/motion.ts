import type { TargetAndTransition, Transition } from 'motion/react';

/**
 * 动效工具箱:所有幅度/时长/弹簧集中在这里,整体调档只改本文件。
 * 三条原则(原点 / 方向与跟手 / 物理)见 DESIGN §5.0。
 */

export const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

/** 整页/分区进入:过冲约 16% */
export const SPRING_IN: Transition = { type: 'spring', stiffness: 170, damping: 13, mass: 1 };
/** 小元素弹入(气泡、chip、缩略图):过冲约 28% */
export const SPRING_BOUNCE: Transition = { type: 'spring', stiffness: 380, damping: 14, mass: 0.9 };
/** 按下回弹:紧一些,归属感明确 */
export const SPRING_TAP: Transition = { type: 'spring', stiffness: 520, damping: 22, mass: 0.7 };

/** 统一按下缩放 */
export const PRESS_SCALE = 0.94;

export interface EnterProps {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
}

/** 列表错峰:每项 0.06~0.09s,超过 9 项不再累加 */
export function stagger(index: number, step = 0.075, max = 9): number {
  return Math.min(Math.max(index, 0), max) * step;
}

/** 上浮进入:淡入 + 上移。只用于「页面内首次出现」的区块,不用于切页 */
export function riseIn(reduceMotion: boolean | null, delay = 0, distance = 26): EnterProps {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { ...SPRING_IN, delay },
  };
}

/** 弹入:缩小 + 下移 → 回正,带回弹 */
export function popIn(reduceMotion: boolean | null, delay = 0, distance = 20, fromScale = 0.8): EnterProps {
  return {
    initial: { opacity: 0, y: distance, scale: fromScale },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: reduceMotion ? { duration: 0 } : { ...SPRING_BOUNCE, delay },
  };
}

/** 从一侧推入:direction 1 = 从右来(用户气泡),-1 = 从左来(AI 气泡) */
export function slideIn(reduceMotion: boolean | null, direction: 1 | -1, delay = 0, distance = 52): EnterProps {
  return {
    initial: { opacity: 0, x: direction * distance, scale: 0.88 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: reduceMotion ? { duration: 0 } : { ...SPRING_BOUNCE, delay },
  };
}

