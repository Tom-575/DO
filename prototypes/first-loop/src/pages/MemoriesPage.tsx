import { UserCircle } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import MemoryItem from '../components/MemoryItem';

export default function MemoriesPage() {
  const { records } = useAppState();
  const dispatch = useDispatch();
  return <>
    <header className="large-header memories-header"><div><span>你的真实生活</span><h1>回忆</h1></div><button aria-label="外观设置" onClick={() => dispatch({ type: 'setAppearanceOpen', open: true })}><UserCircle size={32} weight="light" /></button></header>
    <main className="memory-stream">
      {records.length === 0
        ? <p className="memories-empty">还没有记录</p>
        : records.map((record) => <MemoryItem key={record.id} record={record} />)}
    </main>
  </>;
}
