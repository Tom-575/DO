import { useState } from 'react';
import { motion, useReducedMotion, type MotionValue } from 'motion/react';
import { useAppState, useDispatch } from '../store/store';
import { riseIn } from '../lib/motion';
import { traceStats } from '../lib/traces';
import type { MemoryRecord } from '../types';
import TraceItem from '../components/TraceItem';
import ImageViewer from '../components/ImageViewer';
import ShareCard from '../components/ShareCard';
import './traces.css';

/** 全屏看图的打开状态：条目 + objectURL 列表 + 起始页 */
interface Viewing {
  record: MemoryRecord;
  urls: string[];
  index: number;
}

interface TracesPageProps {
  /** 大标题的横向惯性甩出（来自 App 的 useSwipeLag）；静止时恒为 0，即原位 */
  titleLag: MotionValue<number>;
}

/**
 * 痕迹页（V2 稿 05）：统计 + 时间线。
 * 稿里的分类筛选行按 2026-09-17 用户决定移除（分类推导的实现也已删）。
 */
export default function TracesPage({ titleLag }: TracesPageProps) {
  const { records, dos } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [sharing, setSharing] = useState<MemoryRecord | null>(null);

  const stats = traceStats(records);
  const ideaOf = (linkedDOId?: string) => dos.find((item) => item.id === linkedDOId)?.thought ?? null;

  const openEdit = (record: MemoryRecord) => {
    dispatch({ type: 'setActiveRecordId', id: record.id });
    dispatch({ type: 'setScreen', screen: 'record' });
  };

  return <>
    {/* 顶栏居中：位移交给原生横滑，只有标题跟着惯性甩一下，手停即回原位 */}
    <header className="traces-header">
      <motion.div style={{ x: titleLag }}>
        <span className="kicker centered">YOUR TRACES</span>
        <h1 className="page-title">痕迹</h1>
      </motion.div>
    </header>

    <main className="traces-content">
      {records.length === 0
        ? <motion.div className="traces-empty" {...riseIn(reduceMotion, 0.1, 30)}>
            <p className="traces-empty-title">还没有痕迹</p>
            <p className="traces-empty-hint">做过的事，回来写下就好。</p>
          </motion.div>
        : <>
            <motion.div className="card trace-stats" {...riseIn(reduceMotion, 0, 24)}>
              <div><b className="figure">{stats.total}</b><small>次真实尝试</small></div>
              <div><b className="figure">{stats.done}</b><small>做完了</small></div>
              <div><b className="figure accent">{stats.stopped}</b><small>中途停下</small></div>
            </motion.div>

            <div className="trace-feed">
              {records.map((record, index) => <TraceItem
                key={record.id}
                record={record}
                idea={ideaOf(record.linkedDOId)}
                index={index}
                onEdit={openEdit}
                onShare={(target) => setSharing(target)}
                onView={(urls, i) => setViewing({ record, urls, index: i })}
              />)}
            </div>
          </>}
    </main>

    {viewing && <ImageViewer
      urls={viewing.urls}
      initialIndex={viewing.index}
      onClose={() => setViewing(null)}
      onEdit={() => { setViewing(null); openEdit(viewing.record); }}
    />}

    {sharing && <ShareCard
      record={sharing}
      dos={dos}
      records={records}
      reduceMotion={Boolean(reduceMotion)}
      onClose={() => setSharing(null)}
    />}
  </>;
}
