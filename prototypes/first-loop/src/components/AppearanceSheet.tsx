import { Moon, Palette, Plus, Sun, X } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';

export default function AppearanceSheet() {
  const { settings } = useAppState();
  const dispatch = useDispatch();
  const { theme, background } = settings;
  return <div className="appearance-scrim" onClick={() => dispatch({ type: 'setAppearanceOpen', open: false })}>
    <section className="appearance-sheet" onClick={(event) => event.stopPropagation()}>
      <div className="sheet-heading"><div><span>外观</span><h2>让 DO 更像你的空间</h2></div><button aria-label="关闭" onClick={() => dispatch({ type: 'setAppearanceOpen', open: false })}><X size={20} /></button></div>
      <div className="appearance-group"><span className="group-label">明暗</span><div className="choice-row"><button className={theme === 'light' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { theme: 'light' } })}><Sun size={18} /><span>白天</span></button><button className={theme === 'dark' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { theme: 'dark' } })}><Moon size={18} /><span>黑夜</span></button><button className={theme === 'system' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { theme: 'system' } })}><Palette size={18} /><span>跟随系统</span></button></div></div>
      <div className="appearance-group"><span className="group-label">背景</span><div className="background-grid"><button className={background === 'none' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { background: 'none' } })}><span className="background-swatch plain" />纯净</button><button className={background === 'mist' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { background: 'mist' } })}><span className="background-swatch mist" />薄雾</button><button className={background === 'night' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { background: 'night' } })}><span className="background-swatch night" />夜色</button><label className="background-upload"><span className="background-swatch upload"><Plus size={20} /></span>添加照片<input type="file" accept="image/*" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => dispatch({ type: 'setSettings', settings: { background: String(reader.result) } }); reader.readAsDataURL(file); } }} /></label></div></div>
    </section>
  </div>;
}
