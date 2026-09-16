import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DownloadSimple, ImageBroken, Images } from '@phosphor-icons/react';
import { formatClock, memoryDayLabel } from '../lib/memories-date';
import { useImageUrls } from '../lib/image-urls';
import { PRESS_SCALE, SPRING_TAP, riseIn } from '../lib/motion';
import { captureExpandOrigin } from '../lib/screen-origin';
import type { MemoryRecord } from '../types';

interface MemoryItemProps {
  record: MemoryRecord;
  /** 在列表中的位置:用于错峰进入,新增的记录(第 0 条)最先落位 */
  index: number;
  onEdit: (record: MemoryRecord) => void;
  onExport: (record: MemoryRecord) => void;
  onView: (urls: string[], index: number) => void;
}

/**
 * 回忆条目(#18):列表只展示首图缩略(4:3 裁切,原比例在查看器看),多图右下角标提示总张数;
 * 点封面进全屏查看器横滑全部,点文字/其余进编辑。Blob 加载失败不静默:占位块明示。
 */
export default function MemoryItem({ record, index, onEdit, onExport, onView }: MemoryItemProps) {
  const reduceMotion = useReducedMotion();
  const urls = useImageUrls(record.images);
  const withImage = record.images.length > 0;
  const [coverFailed, setCoverFailed] = useState(false);
  return <motion.article className={`memory ${withImage ? 'with-image' : 'text-only'}`}
    onClick={(event) => {
      captureExpandOrigin(event.currentTarget);
      onEdit(record);
    }}
    whileTap={reduceMotion ? undefined : { scale: PRESS_SCALE, transition: SPRING_TAP }}
    {...riseIn(reduceMotion, Math.min(index, 6) * 0.09, 28)}>
    <button className="memory-export" aria-label="导出卡片" onClick={(event) => { event.stopPropagation(); onExport(record); }}><DownloadSimple size={16} weight="bold" /></button>
    <div className="memory-time"><strong>{memoryDayLabel(record.createdAt)}</strong><span>{formatClock(record.createdAt)}</span></div>
    {urls.length > 0 && (
      <div className="memory-images">
        {coverFailed
          ? <div className="memory-image-failed"><ImageBroken size={20} /><span>图片加载失败</span></div>
          : <img className="media-in" src={urls[0]} alt="" loading="lazy" onClick={(event) => {
              // 这张缩略图是全屏查看器的动效原点:查看器从它扩开
              event.stopPropagation();
              captureExpandOrigin(event.currentTarget);
              onView(urls, 0);
            }} onError={() => setCoverFailed(true)} />}
        {urls.length > 1 && <span className="memory-image-count"><Images size={12} weight="bold" />{urls.length}</span>}
      </div>
    )}
    <p>{record.text}</p>
  </motion.article>;
}
