import { useRef, useState, type ChangeEvent } from 'react';
import { Download, Moon, Palette, Plus, Sun, UploadSimple, X } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { isAIConfigured, type AIClientConfig } from '../lib/ai';
import { exportBackup, importBackup } from '../lib/backup';
import './sheet-extras.css';

/**
 * 外观 Sheet(对外也是当前唯一的设置入口):
 * - 明暗 / 背景:原有分组;
 * - AI(#8 设置部分):baseURL / model / apiKey 三项,编辑即经 setSettings 写入 settings.ai,
 *   由既有链路存 localStorage;三项全非空才算已接入,留空自动回落离线演示;
 * - 数据(#12):导出全部 DO 与记录为 JSON,或从备份文件恢复(overwrite,先确认)。
 */

export default function AppearanceSheet() {
  const { dos, records, settings } = useAppState();
  const dispatch = useDispatch();
  const { theme, background } = settings;
  const ai = settings.ai;
  const aiReady = isAIConfigured(settings);
  const [busy, setBusy] = useState(false);
  const [exportNote, setExportNote] = useState('');
  const [importNote, setImportNote] = useState<{ text: string; alert?: boolean } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 编辑 AI 任一字段:始终保持三字段完整(空串 = 未填),isAIConfigured 据此判断 */
  function editAI(patch: Partial<AIClientConfig>) {
    const next: AIClientConfig = { baseURL: '', model: '', apiKey: '', ...ai, ...patch };
    dispatch({
      type: 'setSettings',
      settings: {
        ai: { baseURL: next.baseURL.trim(), model: next.model.trim(), apiKey: next.apiKey.trim() },
      },
    });
  }

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    setExportNote('正在导出…');
    try {
      const filename = await exportBackup(dos, records);
      setExportNote(`已导出 ${filename},包含图片,文件会比原图更大`);
    } catch {
      setExportNote('导出失败,请重试');
    } finally {
      setBusy(false);
    }
  }

  function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = ''; // 允许再次选择同一个文件
    if (!file) return;
    setImportNote(null);
    setPendingFile(file);
  }

  async function handleImportConfirm() {
    if (!pendingFile || busy) return;
    setBusy(true);
    try {
      const data = await importBackup(pendingFile);
      dispatch({ type: 'importData', dos: data.dos, records: data.records });
      setImportNote({ text: `已恢复 ${data.dos.length} 条 DO、${data.records.length} 条记录` });
      setPendingFile(null);
    } catch (err) {
      setImportNote({ text: err instanceof Error ? err.message : '恢复失败,请重试', alert: true });
    } finally {
      setBusy(false);
    }
  }

  const close = () => dispatch({ type: 'setAppearanceOpen', open: false });

  return (
    <div className="appearance-scrim" onClick={close}>
      <section className="appearance-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-heading">
          <div>
            <span>外观</span>
            <h2>让 DO 更像你的空间</h2>
          </div>
          <button aria-label="关闭" onClick={close}>
            <X size={20} />
          </button>
        </div>

        <div className="appearance-group">
          <span className="group-label">明暗</span>
          <div className="choice-row">
            <button className={theme === 'light' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { theme: 'light' } })}>
              <Sun size={18} />
              <span>白天</span>
            </button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { theme: 'dark' } })}>
              <Moon size={18} />
              <span>黑夜</span>
            </button>
            <button className={theme === 'system' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { theme: 'system' } })}>
              <Palette size={18} />
              <span>跟随系统</span>
            </button>
          </div>
        </div>

        <div className="appearance-group">
          <span className="group-label">背景</span>
          <div className="background-grid">
            <button className={background === 'none' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { background: 'none' } })}>
              <span className="background-swatch plain" />
              纯净
            </button>
            <button className={background === 'mist' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { background: 'mist' } })}>
              <span className="background-swatch mist" />
              薄雾
            </button>
            <button className={background === 'night' ? 'active' : ''} onClick={() => dispatch({ type: 'setSettings', settings: { background: 'night' } })}>
              <span className="background-swatch night" />
              夜色
            </button>
            <label className="background-upload">
              <span className="background-swatch upload">
                <Plus size={20} />
              </span>
              添加照片
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => dispatch({ type: 'setSettings', settings: { background: String(reader.result) } });
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="appearance-group">
          <span className="group-label">AI</span>
          <p className={`sheet-status${aiReady ? ' ready' : ''}`}>{aiReady ? '已接入,行动与整理将调用你的接口' : '未配置,使用离线演示'}</p>
          <label className="sheet-field">
            <span>接口地址</span>
            <input
              value={ai?.baseURL ?? ''}
              placeholder="https://xxx/v1"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => editAI({ baseURL: event.currentTarget.value })}
            />
          </label>
          <label className="sheet-field">
            <span>模型名</span>
            <input
              value={ai?.model ?? ''}
              placeholder="如 glm-4-flash"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => editAI({ model: event.currentTarget.value })}
            />
          </label>
          <label className="sheet-field">
            <span>API Key</span>
            <input
              type="password"
              value={ai?.apiKey ?? ''}
              placeholder="sk-…"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => editAI({ apiKey: event.currentTarget.value })}
            />
          </label>
          <p className="sheet-note">三项都填写后生效;密钥只保存在本机。</p>
        </div>

        <div className="appearance-group">
          <span className="group-label">数据</span>
          <div className="sheet-actions">
            <button className="sheet-action" disabled={busy} onClick={handleExport}>
              <Download size={16} />
              导出备份
            </button>
            <button className="sheet-action" disabled={busy} onClick={() => fileInputRef.current?.click()}>
              <UploadSimple size={16} />
              从文件恢复
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleFileChosen} />
          </div>
          {pendingFile ? (
            <div className="sheet-confirm">
              <p>恢复会覆盖当前全部数据:用「{pendingFile.name}」替换所有 DO 与记录。</p>
              <div className="sheet-confirm-actions">
                <button className="primary" disabled={busy} onClick={handleImportConfirm}>
                  {busy ? '恢复中…' : '确认恢复'}
                </button>
                <button onClick={() => setPendingFile(null)}>取消</button>
              </div>
            </div>
          ) : (
            <p className={importNote ? `sheet-note${importNote.alert ? ' alert' : ''}` : 'sheet-note'}>
              {importNote ? importNote.text : '恢复会覆盖当前全部数据;建议先导出一份备份。'}
            </p>
          )}
          {exportNote && <p className="sheet-note">{exportNote}</p>}
        </div>
      </section>
    </div>
  );
}
