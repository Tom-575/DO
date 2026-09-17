import { motion, useReducedMotion } from 'motion/react';
import { Asterisk } from '@phosphor-icons/react';
import { useDispatch, useAppState } from '../store/store';
import { START_PHOTO } from '../lib/storage';
import { SPRING_IN, riseIn } from '../lib/motion';
import './start.css';

/**
 * 出发页（V2 设计稿 01）：冷启动时的一整屏满幅摄影 + 一句立场。
 * 只出现一次（settings.onboarded），点「开始」写回并进入今天页；
 * 底图是固定资源，不走「背景」设置——首页才是用户可定制的空间。
 */
export default function StartPage() {
  const dispatch = useDispatch();
  const { settings } = useAppState();
  const reduceMotion = useReducedMotion();
  // 用户自己上传过背景就用他自己的照片当出发底图，否则用内置摄影
  const photo = settings.background.startsWith('data:') || settings.background.startsWith('http') ? settings.background : START_PHOTO;

  return <motion.section
    className="start-page"
    initial={reduceMotion ? false : { opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={reduceMotion ? { duration: 0 } : { duration: 0.4 }}
  >
    <div className="start-photo" style={{ backgroundImage: `url(${photo})` }} aria-hidden="true" />
    <div className="start-scrim" aria-hidden="true" />
    <div className="start-content">
      <motion.span className="start-logo" {...riseIn(reduceMotion, 0, 18)}>
        <Asterisk size={22} weight="bold" />
      </motion.span>
      <motion.p className="start-wordmark" initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={reduceMotion ? { duration: 0 } : { ...SPRING_IN, delay: 0.08 }}>DO</motion.p>
      <div className="start-copy">
        <motion.span className="kicker" {...riseIn(reduceMotion, 0.16, 16)}>欢迎来到 DO</motion.span>
        <motion.h1 {...riseIn(reduceMotion, 0.22, 20)}>不完美，也可以出发。</motion.h1>
        <motion.p {...riseIn(reduceMotion, 0.28, 20)}>想到就去试一次。做十分钟、走出门、拍一张照片，都算开始。</motion.p>
      </div>
      <motion.div className="start-actions" {...riseIn(reduceMotion, 0.34, 24)}>
        <button className="start-go" onClick={() => dispatch({ type: 'setSettings', settings: { onboarded: true } })}>开始</button>
        <span className="start-hint">不需要计划，先做一点点</span>
      </motion.div>
    </div>
  </motion.section>;
}
