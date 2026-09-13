import type { CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAppState } from './store/store';
import TodayPage from './pages/TodayPage';
import MemoriesPage from './pages/MemoriesPage';
import InputPage from './pages/InputPage';
import ActionPage from './pages/ActionPage';
import TabBar from './components/TabBar';
import AppearanceSheet from './components/AppearanceSheet';

export default function App() {
  const { screen, tab, appearanceOpen, settings } = useAppState();
  const { theme, background } = settings;
  const reduceMotion = useReducedMotion();
  const backgroundStyle: CSSProperties = background === 'none' ? {} : { backgroundImage: `linear-gradient(var(--backdrop),var(--backdrop)),url(${background})` };
  return <div className={`prototype-frame theme-${theme}`}>
    <div className={`phone-app ${background !== 'none' ? 'has-background' : ''}`} style={backgroundStyle}>
      <AnimatePresence mode="wait" initial={false}>
        {screen === 'input' && <InputPage key="input" />}
        {screen === 'action' && <ActionPage key="action" />}
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
