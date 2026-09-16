import { motion, useReducedMotion } from 'motion/react';
import { CaretRight } from '@phosphor-icons/react';
import { PRESS_SCALE, SPRING_TAP, popIn } from '../lib/motion';
import { captureExpandOrigin } from '../lib/screen-origin';

interface DOButtonProps {
  onClick: () => void;
}

/**
 * 首页主 CTA。它也是输入页的**动效原点**——按下时先同步量下自己的矩形,
 * 输入页会从这个矩形「长」满整屏,而不是自己从右边滑进来。
 */
export default function DOButton({ onClick }: DOButtonProps) {
  const reduceMotion = useReducedMotion();
  return <motion.button
    className="do-button"
    onClick={(event) => {
      captureExpandOrigin(event.currentTarget);
      onClick();
    }}
    whileTap={reduceMotion ? undefined : { scale: PRESS_SCALE, transition: SPRING_TAP }}
    whileHover={reduceMotion ? undefined : { scale: 1.025, transition: SPRING_TAP }}
    {...popIn(reduceMotion, .18, 26, 0.86)}
  >
    <span>DO</span><small>写下一个念头</small><CaretRight size={22} weight="bold" />
  </motion.button>;
}
