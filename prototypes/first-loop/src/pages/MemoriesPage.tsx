import { UserCircle } from '@phosphor-icons/react';
import { useDispatch } from '../store/store';
import { memories } from '../lib/mock';
import MemoryItem from '../components/MemoryItem';

export default function MemoriesPage() {
  const dispatch = useDispatch();
  return <>
    <header className="large-header memories-header"><div><span>你的真实生活</span><h1>回忆</h1></div><button aria-label="外观设置" onClick={() => dispatch({ type: 'setAppearanceOpen', open: true })}><UserCircle size={32} weight="light" /></button></header>
    <main className="memory-stream">{memories.map((memory) => <MemoryItem key={memory.time} memory={memory} />)}</main>
  </>;
}
