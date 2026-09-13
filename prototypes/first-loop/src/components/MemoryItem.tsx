import { formatDate } from '../lib/date';
import type { MemoryRecord } from '../types';

interface MemoryItemProps {
  record: MemoryRecord;
}

export default function MemoryItem({ record }: MemoryItemProps) {
  const date = new Date(record.createdAt);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return <article className={`memory ${record.images.length > 0 ? 'with-image' : 'text-only'}`}>
    <div className="memory-time"><strong>{formatDate(date)}</strong><span>{time}</span></div>
    {record.images.filter((image): image is string => typeof image === 'string').map((image, index) => <img key={index} src={image} alt="" />)}
    <p>{record.text}</p>
    <button>生成分享内容</button>
  </article>;
}
