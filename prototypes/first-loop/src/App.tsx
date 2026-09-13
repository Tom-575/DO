import type { CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAppState } from './store/store';
import TodayPage from './pages/TodayPage';
import MemoriesPage from './pages/MemoriesPage';
import InputPage from './pages/InputPage';
import ActionPage from './pages/ActionPage';
import RecordPage from './pages/RecordPage';
import TabBar from './components/TabBar';
import AppearanceSheet from './components/AppearanceSheet';

/** 外观 Sheet 的内置背景值;渐变取色与 styles.css 的 .background-swatch 保持一致 */
const BUILTIN_BACKGROUNDS: Record<'mist' | 'night', string> = {
  mist: 'linear-gradient(135deg, #d8e1e8, #f6f1ec)',
  night: 'linear-gradient(135deg, #182334, #5d6b78)',
};

export default function App() {
  const { screen, tab, appearanceOpen, settings } = useAppState();
  const { theme, background } = settings;
  const reduceMotion = useReducedMotion();
  // 'mist' / 'night' 是内置渐变,直接作为 backgroundImage;其余非 'none' 值按图片地址处理,
  // 并叠一层 --backdrop 蒙层保证任意照片上的文字对比度(内置渐变取色已定,不再叠加蒙层)。
  const builtinBackground = background === 'mist' || background === 'night' ? BUILTIN_BACKGROUNDS[background] : null;
  const backgroundStyle: CSSProperties =
    background === 'none'
      ? {}
      : { backgroundImage: builtinBackground ?? `linear-gradient(var(--backdrop),var(--backdrop)),url(${background})` };
  return <div className={`prototype-frame theme-${theme}`}>
    <div className={`phone-app ${background !== 'none' ? 'has-background' : ''}`} style={backgroundStyle}>
      <AnimatePresence mode="wait" initial={false}>
        {screen === 'input' && <InputPage key="input" />}
        {screen === 'action' && <ActionPage key="action" />}
        {screen === 'record' && <RecordPage key="record" />}
        {screen === 'home' && <motion.section className="page main-page" key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
          <div className="app-scroll">
            {tab === 'today' ? <TodayPage /> : <MemoriesPage />}
          </div>
          <TabBar />
          {appearanceOpen && <AppearanceSheet />}
        </motion.section>}
      </AnimatePresence>
    </div>
  </div>;
}
