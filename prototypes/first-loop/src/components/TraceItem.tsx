import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Export, ImageBroken, Images } from '@phosphor-icons/react';
import { formatClock, memoryDayLabel } from '../lib/memories-date';
import { useImageUrls } from '../lib/image-urls';
import { outcomeTone } from '../lib/traces';
import { PRESS_SCALE, SPRING_TAP, riseIn } from '../lib/motion';
import { captureExpandOrigin } from '../lib/screen-origin';
import type { MemoryRecord } from '../types';

interface TraceItemProps {
  record: MemoryRecord;
  /** 关联 DO 的念头：没有结果标签时用它补一行上下文 */
  idea?: string | null;
  /** 在列表中的位置：用于错峰进入，新增的记录（第 0 条）最先落位 */
  index: number;
  onEdit: (record: MemoryRecord) => void;
  onShare: (record: MemoryRecord) => void;
  onView: (urls: string[], index: number) => void;
}

/**
 * 痕迹条目（V2 稿 05）：有图 = 满宽封面 + 白卡正文；无图 = 米色纯文字卡。
 * 分区响应不变：点封面进全屏查看器，点正文进编辑态；右下角小按钮进分享卡。
 */
export default function TraceItem({ record, idea, index, onEdit, onShare, onView }: TraceItemProps) {
  const reduceMotion = useReducedMotion();
  const urls = useImageUrls(record.images);
  const [coverFailed, setCoverFailed] = useState(false);
  const withImage = urls.length > 0;
  const meta = [memoryDayLabel(record.createdAt), record.outcome ?? idea ?? formatClock(record.createdAt)].filter(Boolean).join(' · ');

  return <motion.article
    className={`trace-card${withImage ? '' : ' text-only'} tone-${outcomeTone(record.outcome)}`}
    onClick={(event) => {
      captureExpandOrigin(event.currentTarget);
      onEdit(record);
    }}
    whileTap={reduceMotion ? undefined : { scale: PRESS_SCALE, transition: SPRING_TAP }}
    {...riseIn(reduceMotion, Math.min(index, 6) * 0.09, 28)}
  >
    {withImage && (coverFailed
      ? <div className="trace-cover-failed"><ImageBroken size={20} /><span>图片加载失败</span></div>
      : <div className="trace-cover">
          <img className="media-in" src={urls[0]} alt="" loading="lazy" onClick={(event) => {
            // 这张封面是全屏查看器的动效原点：查看器从它扩开
            event.stopPropagation();
            captureExpandOrigin(event.currentTarget);
            onView(urls, 0);
          }} onError={() => setCoverFailed(true)} />
          {urls.length > 1 && <span className="trace-cover-count"><Images size={12} weight="bold" />{urls.length}</span>}
        </div>)}
    <div className="trace-body">
      <p className="trace-text">{record.refined || record.text}</p>
      <div className="trace-meta">
        <span>{meta}</span>
        <button aria-label="分享这张痕迹" onClick={(event) => { event.stopPropagation(); onShare(record); }}><Export size={15} weight="bold" /></button>
      </div>
    </div>
  </motion.article>;
}
