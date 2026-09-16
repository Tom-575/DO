import { useRef, useState } from 'react';
import { motion, useReducedMotion, type MotionValue } from 'motion/react';
import { useAppState, useDispatch } from '../store/store';
import { riseIn } from '../lib/motion';
import AppearanceButton from '../components/AppearanceButton';
import MemoryItem from '../components/MemoryItem';
import ImageViewer from '../components/ImageViewer';
import RecordCard from '../components/RecordCard';
import type { MemoryRecord } from '../types';
import './memories.css';

/** 全屏看图(#17)的打开状态:条目 + objectURL 列表 + 起始页 */
interface Viewing {
  record: MemoryRecord;
  urls: string[];
  index: number;
}

interface MemoriesPageProps {
  /** 大标题的横向惯性甩出(来自 App 的 useSwipeLag);静止时恒为 0,即原位 */
  titleLag: MotionValue<number>;
}

export default function MemoriesPage({ titleLag }: MemoriesPageProps) {
  const { records, dos } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  /* 卡片预览与导出(#14):预览即所见即所得,导出失败行内提示 */
  const [cardRecord, setCardRecord] = useState<MemoryRecord | null>(null);
  const [exportError, setExportError] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  /* 全屏看图(#17):点图片区进入;编辑入口关闭查看器后走 openEdit */
  const [viewing, setViewing] = useState<Viewing | null>(null);

  const openEdit = (record: MemoryRecord) => {
    dispatch({ type: 'setActiveRecordId', id: record.id });
    dispatch({ type: 'setScreen', screen: 'record' });
  };

  const exportCard = async () => {
    // 预览 canvas 即导出物:直接 toBlob,不再做 DOM 序列化(#14)
    const canvas = cardRef.current?.querySelector('canvas');
    if (!canvas) return;
    setExportError(false);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('toBlob returned null');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `DO卡片-${cardRecord ? new Date(cardRecord.createdAt).toISOString().slice(0, 10).replaceAll('-', '') : ''}.png`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setExportError(true);
    }
  };

  return <>
    {/* 顶栏:位移交给原生横滑,只有大标题跟着惯性甩一下,手停即回原位(见 TodayPage 的说明) */}
    <header className="large-header memories-header">
      <motion.div style={{ x: titleLag }}>
        <span>你的真实生活</span>
        <h1>回忆</h1>
      </motion.div>
      <AppearanceButton />
    </header>
    <main className="memory-stream">
      {records.length === 0
        ? <motion.div className="memories-empty-state" {...riseIn(reduceMotion, .1, 30)}>
            <p className="memories-empty-title">还没有记录</p>
            <p className="memories-empty-hint">做过的事，回来写下就好。</p>
          </motion.div>
        : records.map((record, index) => <MemoryItem key={record.id} record={record} index={index} onEdit={openEdit} onExport={setCardRecord} onView={(urls, i) => setViewing({ record, urls, index: i })} />)}
    </main>
    {viewing && <ImageViewer
      urls={viewing.urls}
      initialIndex={viewing.index}
      onClose={() => setViewing(null)}
      onEdit={() => { setViewing(null); openEdit(viewing.record); }}
    />}
    {cardRecord && <div className="card-overlay" onClick={() => setCardRecord(null)}>
      <div className="card-panel" onClick={(event) => event.stopPropagation()}>
        <div ref={cardRef}><RecordCard record={cardRecord} dos={dos} /></div>
        {exportError && <p className="card-error">卡片生成没成功，再试一次。</p>}
        <div className="card-actions">
          <button onClick={() => setCardRecord(null)}>关闭</button>
          <button className="card-save" onClick={() => void exportCard()}>保存图片</button>
        </div>
      </div>
    </div>}
  </>;
}
