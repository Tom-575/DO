import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowUp, CaretDown, CaretRight, ClockCounterClockwise, House, UserCircle, Sun, Moon, Palette, Plus, X } from '@phosphor-icons/react';
import './styles.css';

const memories = [
  { day: '今天', time: '08:40', text: '把阳台上的薄荷换到了更大的盆里。泥撒了一点，但它终于有地方继续长了。' },
  { day: '昨天', time: '19:10', text: '傍晚沿着山路走了一小段。风很大，照片拍得不太清楚。', image: '/assets/mountain-walk.jpg', alt: '傍晚经过的山路' },
];

const earlierIdeas = ['想找个地方散散步', '想重新拿起相机', '想试着烤一次面包'];

function getAction(idea) {
  if (idea.includes('运动')) return { title: '换上运动鞋，到楼下走 10 分钟。', stop: '走到小区门口，就可以回来。', time: '大约 10 分钟' };
  if (idea.includes('做饭') || idea.includes('菜')) return { title: '打开冰箱，选出今天最想用掉的一样食材。', stop: '选好食材，就可以停下来。', time: '大约 2 分钟' };
  return { title: `先花 10 分钟，开始“${idea}”。`, stop: '时间到了，就可以停下来。', time: '大约 10 分钟' };
}

function App() {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState('today');
  const [screen, setScreen] = useState('home');
  const [idea, setIdea] = useState('');
  const [lastIdea, setLastIdea] = useState('想学会做一道简单的菜');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [theme, setTheme] = useState('system');
  const [background, setBackground] = useState('/assets/mountain-walk.jpg');
  const action = getAction(idea || lastIdea);
  const transition = reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 };

  const goHome = () => { setScreen('home'); setTab('today'); };

  const backgroundStyle = background === 'none' ? {} : { backgroundImage: `linear-gradient(var(--backdrop),var(--backdrop)),url(${background})` };
  return <div className={`prototype-frame theme-${theme}`}>
    <div className={`phone-app ${background !== 'none' ? 'has-background' : ''}`} style={backgroundStyle}>
      <AnimatePresence mode="wait" initial={false}>
        {screen === 'input' && <motion.section className="page input-page" key="input" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '18%', opacity: 0 }} transition={transition}>
          <header className="nav-bar"><button className="nav-action" onClick={goHome}><ArrowLeft size={21} />今天</button><span>新的 DO</span><button className="nav-action strong" disabled={!idea.trim()} onClick={() => setScreen('action')}>继续</button></header>
          <div className="input-content"><label htmlFor="idea">现在想做什么？</label><textarea id="idea" autoFocus value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="想到什么，就写什么" /><p>不用先想清楚目标或计划。</p></div>
          <button className="keyboard-action" disabled={!idea.trim()} onClick={() => setScreen('action')} aria-label="继续"><ArrowUp weight="bold" size={21} /></button>
        </motion.section>}

        {screen === 'action' && <motion.section className="page action-page" key="action" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '18%', opacity: 0 }} transition={transition}>
          <header className="nav-bar"><button className="icon-action" onClick={() => setScreen('input')} aria-label="返回"><ArrowLeft size={23} /></button><span>现在的一步</span><span className="nav-spacer" /></header>
          <div className="action-content"><p className="source-idea">{idea}</p><h1>{action.title}</h1><div className="action-meta"><span>{action.time}</span><span>{action.stop}</span></div></div>
          <div className="bottom-actions"><button className="primary-action" onClick={() => { setLastIdea(idea); goHome(); }}>现在开始</button><button className="secondary-action" onClick={goHome}>先放着</button></div>
        </motion.section>}

        {screen === 'home' && <motion.section className="page main-page" key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
          <div className="app-scroll">
          {tab === 'today' ? <>
            <header className="large-header"><div><span>9月12日 星期六</span><h1>今天</h1></div><button aria-label="外观设置" onClick={() => setAppearanceOpen(true)}><UserCircle size={32} weight="light" /></button></header>
            <main className="today-content">
              <section className="do-intro"><h2>现在想做什么？</h2><p>先写下来。DO 会把它变成可以开始的一步。</p><button className="do-button" onClick={() => { setIdea(''); setScreen('input'); }}><span>DO</span><small>写下一个念头</small><CaretRight size={22} weight="bold" /></button></section>
              <section className="previous-section">
                <div className="previous-heading"><h3>上一条 DO</h3><button onClick={() => setHistoryOpen((value) => !value)} aria-label={historyOpen ? '收起更多 DO' : '展开更多 DO'} aria-expanded={historyOpen}><CaretDown className={historyOpen ? 'rotated' : ''} size={16} weight="bold" /></button></div>
                <div className="do-history"><button className="previous-row" onClick={() => { setIdea(lastIdea); setScreen('action'); }}><span>{lastIdea}</span><CaretRight size={19} /></button>
                  <AnimatePresence initial={false}>{historyOpen && <motion.div className="earlier-dos" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .22 }}>{earlierIdeas.map((item) => <button className="previous-row earlier-row" key={item} onClick={() => { setIdea(item); setScreen('action'); }}><span>{item}</span><CaretRight size={19} /></button>)}</motion.div>}</AnimatePresence>
                </div>
              </section>
            </main>
          </> : <>
              <header className="large-header memories-header"><div><span>你的真实生活</span><h1>回忆</h1></div><button aria-label="外观设置" onClick={() => setAppearanceOpen(true)}><UserCircle size={32} weight="light" /></button></header>
            <main className="memory-stream">{memories.map((memory) => <article className={`memory ${memory.image ? 'with-image' : 'text-only'}`} key={memory.time}><div className="memory-time"><strong>{memory.day}</strong><span>{memory.time}</span></div>{memory.image && <img src={memory.image} alt={memory.alt} />}<p>{memory.text}</p><button>生成分享内容</button></article>)}</main>
          </>}
          </div>
          <nav className="tab-bar"><button className={tab === 'today' ? 'selected' : ''} onClick={() => setTab('today')}><House size={23} weight={tab === 'today' ? 'fill' : 'regular'} /><span>今天</span></button><button className={tab === 'memories' ? 'selected' : ''} onClick={() => setTab('memories')}><ClockCounterClockwise size={24} weight={tab === 'memories' ? 'fill' : 'regular'} /><span>回忆</span></button></nav>
          {appearanceOpen && <div className="appearance-scrim" onClick={() => setAppearanceOpen(false)}><section className="appearance-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-heading"><div><span>外观</span><h2>让 DO 更像你的空间</h2></div><button aria-label="关闭" onClick={() => setAppearanceOpen(false)}><X size={20} /></button></div><div className="appearance-group"><span className="group-label">明暗</span><div className="choice-row"><button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={18} /><span>白天</span></button><button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={18} /><span>黑夜</span></button><button className={theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}><Palette size={18} /><span>跟随系统</span></button></div></div><div className="appearance-group"><span className="group-label">背景</span><div className="background-grid"><button className={background === 'none' ? 'active' : ''} onClick={() => setBackground('none')}><span className="background-swatch plain" />纯净</button><button className={background === 'mist' ? 'active' : ''} onClick={() => setBackground('mist')}><span className="background-swatch mist" />薄雾</button><button className={background === 'night' ? 'active' : ''} onClick={() => setBackground('night')}><span className="background-swatch night" />夜色</button><label className="background-upload"><span className="background-swatch upload"><Plus size={20} /></span>添加照片<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => setBackground(String(reader.result)); reader.readAsDataURL(file); } }} /></label></div></div></section></div>}
        </motion.section>}
      </AnimatePresence>
    </div>
  </div>;
}

createRoot(document.getElementById('app')).render(<App />);
