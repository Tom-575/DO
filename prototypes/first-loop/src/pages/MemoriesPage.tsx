import { UserCircle } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import MemoryItem from '../components/MemoryItem';
import './memories.css';

export default function MemoriesPage() {
  const { records } = useAppState();
  const dispatch = useDispatch();
  return <>
    <header className="large-header memories-header"><div><span>你的真实生活</span><h1>回忆</h1></div><button aria-label="外观设置" onClick={() => dispatch({ type: 'setAppearanceOpen', open: true })}><UserCircle size={32} weight="light" /></button></header>
    <main className="memory-stream">
      {records.length === 0
        ? <div className="memories-empty-state">
            <p className="memories-empty-title">还没有记录</p>
            <p className="memories-empty-hint">做过的事，回来写下就好。</p>
          </div>
        : records.map((record) => <MemoryItem key={record.id} record={record} />)}
    </main>
  </>;
}
