import { motion, useReducedMotion } from 'motion/react';
import { CaretRight } from '@phosphor-icons/react';
import { PRESS_SCALE, SPRING_TAP, riseIn } from '../lib/motion';
import { captureExpandOrigin } from '../lib/screen-origin';

interface PreviousRowProps {
  text: string;
  onClick: () => void;
  className?: string;
  /** 回收的待定 DO:弱化显示,不引入新的状态色 */
  muted?: boolean;
  /** 列表错峰进入的延迟(秒);缺省即立即进入 */
  enterDelay?: number;
}

/**
 * inset 列表行,同时是行动页的动效原点。
 * 按下缩放必须用 whileTap:动画残留的内联 transform 会盖住 CSS `:active { transform }`。
 */
export default function PreviousRow({ text, onClick, className, muted, enterDelay = 0 }: PreviousRowProps) {
  const reduceMotion = useReducedMotion();
  const classes = ['previous-row', muted ? 'recycled' : '', className ?? ''].filter(Boolean).join(' ');
  return <motion.button
    className={classes}
    onClick={(event) => {
      captureExpandOrigin(event.currentTarget);
      onClick();
    }}
    whileTap={reduceMotion ? undefined : { scale: PRESS_SCALE, transition: SPRING_TAP }}
    {...riseIn(reduceMotion, enterDelay, 22)}
  >
    <span>{text}</span><CaretRight size={19} />
  </motion.button>;
}
