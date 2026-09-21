import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CaretLeft, CaretRight, Camera, Check, Clock, Link as LinkIcon, Sparkle, X } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { refineRecord } from '../lib/ai';
import { clearRecordDraft, loadRecordDraft, saveRecordDraft } from '../lib/storage';
import { useImageUrls } from '../lib/image-urls';
import { useExpandTransition } from '../lib/use-expand-transition';
import { growTextarea } from '../lib/textarea';
import { formatDuration, parseMinutes } from '../lib/duration';
import { formatRelative } from '../lib/date';
import { PRESS_SCALE, SPRING_IN, SPRING_TAP, popIn, riseIn, stagger } from '../lib/motion';
import type { MemoryRecord, RecordImage, RecordOutcome } from '../types';
import NavBar from '../components/NavBar';
import './record.css';

const MAX_IMAGES = 9;
/** 结果四选（V2 稿 04）：都是事实描述，可跳过、可取消选中 */
const OUTCOMES: RecordOutcome[] = ['做完了', '做了一部分', '中途停下来了', '发现不太适合我'];
/** 压缩阈值：原图 ≤300KB 直接保留；超过则长边压到 1600px、JPEG 0.85 */
const COMPRESS_THRESHOLD = 300_000;
const COMPRESS_EDGE = 1600;

/** 大图压缩：canvas 重采样；任何一步失败都回退原图，压缩不能阻塞保存 */
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size <= COMPRESS_THRESHOLD) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COMPRESS_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** timestamp → datetime-local 的本地值 */
function toLocalInput(ts: number): string {
  const date = new Date(ts);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 记录页（V2 稿 04）：这次怎么样？→ 选一个结果（可跳过）→ 写一句原话 → 生成我的记录。
 * 新建态草稿自动暂存 IndexedDB；编辑态由痕迹页进入，保存走 updateRecord。
 */
export default function RecordPage() {
  const { dos, records, settings, activeRecordId } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const activeRecord = activeRecordId ? records.find((item) => item.id === activeRecordId) : undefined;
  const editing = Boolean(activeRecord);

  const [text, setText] = useState(() => activeRecord?.text ?? '');
  const [images, setImages] = useState<RecordImage[]>(() => activeRecord?.images ?? []);
  const [outcome, setOutcome] = useState<RecordOutcome | undefined>(() => activeRecord?.outcome);
  const [createdAt, setCreatedAt] = useState(() => activeRecord?.createdAt ?? Date.now());
  const previews = useImageUrls(images);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  /* 整理版：生成后是普通可编辑草稿，再点一次按钮会用当前输入重新生成 */
  const [refined, setRefined] = useState(() => activeRecord?.refined ?? '');
  const [hasRefined, setHasRefined] = useState(() => Boolean(activeRecord?.refined));
  const [refining, setRefining] = useState(false);
  const [refineFailed, setRefineFailed] = useState(false);

  /* 关联 DO：新建默认推荐最新「待记录」DO；编辑态以记录既有关联为准 */
  const pending = dos.filter((item) => item.status === '待定' || item.status === '待记录');
  const recommended = pending.find((item) => item.status === '待记录');
  const [linkedId, setLinkedId] = useState<string | null>(() => activeRecord?.linkedDOId ?? null);
  const [recommendDismissed, setRecommendDismissed] = useState(() => Boolean(activeRecord));
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    if (!recommendDismissed && recommended) setLinkedId((current) => current ?? recommended.id);
  }, [recommendDismissed, recommended]);
  const selected = linkedId ? dos.find((item) => item.id === linkedId) : undefined;
  // 编辑态候选：当前已关联的 DO（可能已是「已记录」）必须留在列表里，否则既看不到也取消不了
  const linkCandidates = selected && !pending.some((item) => item.id === selected.id) ? [selected, ...pending] : pending;
  const unlink = () => {
    setLinkedId(null);
    setRecommendDismissed(true);
  };

  /* 草稿：仅新建态；恢复完成前不写入，防止空态覆盖已存草稿 */
  const [draftReady, setDraftReady] = useState(editing);
  const [draftHint, setDraftHint] = useState(false);
  useEffect(() => {
    if (editing) return;
    void loadRecordDraft().then((draft) => {
      if (draft && (draft.text.trim() || draft.refined.trim() || draft.images.length > 0)) {
        setText(draft.text);
        if (draft.refined) {
          setRefined(draft.refined);
          setHasRefined(true);
        }
        if (draft.images.length > 0) setImages(draft.images);
        if (draft.linkedDOId) setLinkedId(draft.linkedDOId);
        setDraftHint(true);
      }
      setDraftReady(true);
    });
  }, []); // 挂载时一次；editing 在本页生命周期内不变
  useEffect(() => {
    if (editing || !draftReady) return;
    if (!text.trim() && !refined.trim() && images.length === 0) {
      void clearRecordDraft();
      return;
    }
    saveRecordDraft({ text, refined: hasRefined ? refined : '', images: images.filter((image): image is Blob => image instanceof Blob), linkedDOId: linkedId, savedAt: Date.now() });
  }, [text, refined, hasRefined, images, linkedId, editing, draftReady]);

  const addImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // FileList 是实时引用：调用方随后会清空 input.value，必须先同步快照
    const picked = Array.from(files);
    void (async () => {
      const processed = await Promise.all(picked.map(compressImage));
      setImages((current) => [...current, ...processed.slice(0, MAX_IMAGES - current.length)]);
    })();
  };

  const refine = async () => {
    if (refining || !text.trim()) return;
    setRefining(true);
    setRefineFailed(false);
    try {
      // 草稿态对象：此刻还没有记录 id，text/images 就是当前输入的原话与素材
      const draft: MemoryRecord = { id: '', text, images, createdAt };
      const result = await refineRecord(draft, settings);
      setRefined(result);
      setHasRefined(true);
    } catch {
      setRefineFailed(true);
    } finally {
      setRefining(false);
    }
  };

  const canSave = text.trim().length > 0 || images.length > 0;
  const save = () => {
    if (!canSave) return;
    if (activeRecord) {
      // 编辑态：linkedDOId 必传，reducer 依据新旧差异联动 DO 状态；refined 清空即移除
      dispatch({
        type: 'updateRecord',
        id: activeRecord.id,
        patch: {
          text: text.trim(),
          images,
          createdAt,
          outcome,
          linkedDOId: linkedId,
          ...(refined.trim() ? { refined: refined.trim() } : {}),
        },
      });
      dispatch({ type: 'setActiveRecordId', id: null });
    } else {
      dispatch({
        type: 'addRecord',
        text: text.trim(),
        images,
        createdAt,
        ...(outcome === undefined ? {} : { outcome }),
        ...(refined.trim() ? { refined: refined.trim() } : {}),
        ...(selected ? { linkedDOId: selected.id } : {}),
      });
      void clearRecordDraft();
    }
    // 痕迹页按时间倒序，保存后切过去让用户看到记录已经留下
    dispatch({ type: 'setTab', tab: 'traces' });
    dispatch({ type: 'setScreen', screen: 'home' });
  };

  /** 真正离开：收尾 dispatch（容器的收回动画播完后由 hook 调用） */
  const finalizeLeave = () => {
    if (editing) dispatch({ type: 'setActiveRecordId', id: null });
    dispatch({ type: 'goHome' });
  };
  const expand = useExpandTransition(finalizeLeave);
  const leave = expand.leave;

  const eyebrow = useMemo(() => {
    const parts = [formatRelative(createdAt)];
    if (selected) parts.push(selected.thought);
    const minutes = selected ? parseMinutes(selected.action.time) : null;
    if (minutes) parts.push(formatDuration(minutes));
    return parts.join(' · ');
  }, [createdAt, selected]);

  return <motion.section
    className={`page record-page${expand.className}`}
    style={expand.clipPath ? { clipPath: expand.clipPath } : undefined}
    initial={expand.animated ? false : { x: '30%', opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={expand.animated || reduceMotion ? { duration: 0 } : SPRING_IN}
  >
    <NavBar
      left={<button className="icon-action" onClick={leave} aria-label="返回"><CaretLeft size={19} weight="bold" /></button>}
      title={editing ? '编辑记录' : ''}
      right={<button className="nav-text" onClick={leave}>{editing ? '放弃修改' : '跳过这一步'}</button>}
    />

    <div className="record-content">
      <div className="record-head">
        <span className="kicker">{eyebrow}</span>
        <h1 className="page-title">{editing ? '改成什么样？' : '这次怎么样？'}</h1>
      </div>
      {draftHint && <motion.p className="record-draft-hint" {...popIn(reduceMotion)}>已恢复上次未保存的草稿</motion.p>}

      <div className="outcome-list" role="radiogroup" aria-label="这次的结果">
        {OUTCOMES.map((item, index) => <motion.button
          key={item}
          className={`outcome-row${outcome === item ? ' selected' : ''}`}
          role="radio"
          aria-checked={outcome === item}
          whileTap={reduceMotion ? undefined : { scale: PRESS_SCALE, transition: SPRING_TAP }}
          {...riseIn(reduceMotion, stagger(index, 0.05), 18)}
          onClick={() => setOutcome((current) => (current === item ? undefined : item))}
        >
          <span className="outcome-mark" aria-hidden="true">{outcome === item && <Check size={13} weight="bold" />}</span>
          {item}
        </motion.button>)}
      </div>

      <div className="card record-text-card">
        <textarea
          ref={textareaRef}
          className="record-text"
          aria-label="记录内容"
          value={text}
          placeholder="想说什么就说什么，不用写好。"
          onChange={(event) => {
            setText(event.target.value);
            growTextarea(event.target);
          }}
        />
      </div>

      <div className="record-chips">
        <label className="chip record-chip">
          <Camera size={15} />
          加一张照片
          <input type="file" multiple accept="image/*" onChange={(event) => { addImages(event.target.files); event.target.value = ''; }} />
        </label>
        <button className="chip record-chip" onClick={() => {
          const input = timeInputRef.current;
          if (!input) return;
          // showPicker 在部分 webview 不存在，退回 click 打开原生选择器
          if (typeof input.showPicker === 'function') input.showPicker();
          else input.click();
        }}>
          <Clock size={15} />
          {formatRelative(createdAt) === '刚刚' ? '记录时间' : formatRelative(createdAt)}
        </button>
        <input
          ref={timeInputRef}
          className="record-time-input"
          type="datetime-local"
          value={toLocalInput(createdAt)}
          onChange={(event) => {
            const next = new Date(event.target.value).getTime();
            if (Number.isFinite(next)) setCreatedAt(next);
          }}
        />
        <button className="chip record-chip" disabled={!text.trim() || refining} onClick={() => void refine()}>
          <Sparkle size={15} />
          {refining ? '整理中…' : hasRefined ? '重新整理' : '帮我整理'}
        </button>
      </div>

      {/* 关联从工具行里拿出来单独成行（#47）：它是这一页唯一带语义的动作（决定记录归属哪个 DO、
          联动 DO 状态），和「加照片 / 记录时间 / 帮我整理」并排时优先级最低，关联后的念头还会被挤成省略号 */}
      <button className={`record-link${selected ? ' linked' : ''}`} aria-expanded={pickerOpen} onClick={() => setPickerOpen((open) => !open)}>
        <LinkIcon size={15} />
        <span>{selected ? selected.thought : '关联一个念头'}</span>
        <CaretRight size={14} weight="bold" />
      </button>

      {/* 候选列表紧跟入口就地展开：此前它挂在页面最底部，点开关联后还得往下找 */}
      {pickerOpen && <motion.div className="card record-picker" {...riseIn(reduceMotion, 0, 20)}>
        {linkCandidates.length === 0 && <p className="record-note">还没有可以关联的 DO。</p>}
        {linkCandidates.map((item, index) => <motion.button
          key={item.id}
          className={`record-picker-row${item.id === linkedId ? ' selected' : ''}`}
          whileTap={reduceMotion ? undefined : { scale: PRESS_SCALE, transition: SPRING_TAP }}
          {...popIn(reduceMotion, stagger(index, 0.05, 5), 16, 0.88)}
          onClick={() => (item.id === linkedId ? unlink() : setLinkedId(item.id))}
        >
          <span>{item.thought}</span>
          {item.id === linkedId && <Check size={15} weight="bold" />}
        </motion.button>)}
        {selected && <button className="text-action record-picker-clear" onClick={unlink}>不关联</button>}
      </motion.div>}
      {refineFailed && <motion.p className="record-note" {...popIn(reduceMotion)}>整理没成功，稍后再试。</motion.p>}

      {images.length > 0 && <div className="record-images">
        {previews.map((url, index) => <motion.div className="record-image" key={url} {...popIn(reduceMotion, stagger(index, 0.06), 24, 0.7)}>
          <img className="media-in" src={url} alt="" />
          <button aria-label={`移除第 ${index + 1} 张图片`} onClick={() => setImages((current) => current.filter((_, i) => i !== index))}><X size={12} weight="bold" /></button>
        </motion.div>)}
        {images.length < MAX_IMAGES && <motion.label className="record-add" {...popIn(reduceMotion, stagger(previews.length, 0.06), 24, 0.7)}>
          <input type="file" multiple accept="image/*" onChange={(event) => { addImages(event.target.files); event.target.value = ''; }} />
          <span>{images.length}/{MAX_IMAGES}</span>
        </motion.label>}
      </div>}

      {hasRefined && <motion.section className="card record-refined" {...popIn(reduceMotion, 0, 30, 0.9)}>
        <span className="kicker">整理版</span>
        <textarea aria-label="整理版" value={refined} onChange={(event) => { setRefined(event.target.value); growTextarea(event.target); }} />
        <p className="record-note">可以直接改，原话仍会保留。</p>
      </motion.section>}

    </div>

    <motion.div className="bottom-actions" {...riseIn(reduceMotion, 0.12, 30)}>
      <button className="primary-action" disabled={!canSave} onClick={save}>{editing ? '保存修改' : '生成我的记录'}</button>
      <button className="quiet-action" onClick={leave}>不记录，直接返回</button>
    </motion.div>
  </motion.section>;
}
