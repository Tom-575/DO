import type { MemorySeed } from '../lib/mock';

interface MemoryItemProps {
  memory: MemorySeed;
}

export default function MemoryItem({ memory }: MemoryItemProps) {
  return <article className={`memory ${memory.image ? 'with-image' : 'text-only'}`}>
    <div className="memory-time"><strong>{memory.day}</strong><span>{memory.time}</span></div>
    {memory.image && <img src={memory.image} alt={memory.alt} />}
    <p>{memory.text}</p>
    <button>生成分享内容</button>
  </article>;
}
