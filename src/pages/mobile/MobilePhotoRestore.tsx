import { useEffect, useRef, useState } from 'react';
import { Image, Upload, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Annotate from '../../components/annotation/Annotate';
import './MobilePhotoRestore.css';

// 与 Web 端一致：修复记录存 cj_photo_restore_records（最多 20 条），两端互通
type RestoreMode = 'enhance' | 'scratch' | 'colorize' | 'upscale';

interface RestoreRecord {
  id: string;
  original: string;
  restored: string;
  mode: RestoreMode;
  createdAt: string;
  fileName: string;
}

interface MediaItem {
  id: string;
  title: string;
  date: string;
  type: 'image' | 'video' | 'audio' | 'doc';
  stage?: string;
}

const STORAGE_KEY = 'cj_photo_restore_records';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function loadRecords(): RestoreRecord[] {
  return loadJson<RestoreRecord[]>(STORAGE_KEY, []);
}

function saveRecords(records: RestoreRecord[]) {
  saveJson(STORAGE_KEY, records.slice(0, 20));
}

function loadArchives(): { id: string; name: string }[] {
  return loadJson<{ id: string; name: string }[]>('cj_archives', []);
}

// 与 Web 端一致：默认保存到当前档案，无当前档案时取第一个
function resolveSaveArchiveId(): string {
  return localStorage.getItem('cj_current_archive_id') || loadArchives()[0]?.id || '';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MobilePhotoRestore() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<RestoreRecord[]>(() => loadRecords());
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [restoredUrl, setRestoredUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('请上传图片文件', 'error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      addToast('图片大小不能超过 20MB', 'error');
      return;
    }
    const url = await fileToDataUrl(file);
    setOriginalUrl(url);
    setRestoredUrl(null);
    addToast('图片上传成功', 'success');
  };

  const startRestore = () => {
    if (!originalUrl) {
      addToast('请先上传老照片', 'error');
      return;
    }
    setProcessing(true);
    setProgress(0);
    setRestoredUrl(null);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(90, p + Math.random() * 15));
    }, 250);

    // mock 修复：进度条走完后直接复用原图作为「修复后」效果（与 Web 端同一 mock 策略）
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setRestoredUrl(originalUrl);
      setProcessing(false);
      // 与 Web 端一致：修复完成写入修复记录
      const newRecord: RestoreRecord = {
        id: Date.now().toString(),
        original: originalUrl,
        restored: originalUrl,
        mode: 'enhance',
        createdAt: new Date().toISOString(),
        fileName: `修复照片_${Date.now()}.jpg`,
      };
      setRecords((prev) => [newRecord, ...prev]);
      addToast('修复完成，已保存到修复记录', 'success');
    }, 2600);
  };

  // 与 Web 端一致：保存到当前人生档案（修复图 + 媒体库条目）
  const saveToArchive = () => {
    if (!restoredUrl) return;
    const archiveId = resolveSaveArchiveId();
    if (!archiveId) {
      addToast('暂无可选档案，请先创建人生档案', 'error');
      return;
    }
    try {
      const restoredKey = `cj_restored_photos_${archiveId}`;
      const restoredList: string[] = loadJson(restoredKey, []);
      restoredList.unshift(restoredUrl);
      saveJson(restoredKey, restoredList.slice(0, 50));

      const mediaKey = `cj_media_${archiveId}`;
      const mediaList: MediaItem[] = loadJson(mediaKey, []);
      mediaList.unshift({
        id: `restored_${Date.now()}`,
        title: `修复照片_${new Date().toLocaleDateString()}.jpg`,
        date: new Date().toISOString().slice(0, 10),
        type: 'image',
        stage: '其他',
      });
      saveJson(mediaKey, mediaList);
      addToast('已保存到人生档案', 'success');
    } catch {
      addToast('保存失败', 'error');
    }
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const openRecord = (record: RestoreRecord) => {
    setOriginalUrl(record.original);
    setRestoredUrl(record.restored);
    setProgress(100);
  };

  const reset = () => {
    setOriginalUrl(null);
    setRestoredUrl(null);
    setProgress(0);
  };

  return (
    <div className="mobile-photo-restore">
      <div className="mobile-photo-restore-hero">
        <Image size={48} color="#fff" />
        <h2>老照片修复</h2>
        <p>AI 修复破损、泛黄的老照片，还原珍贵记忆</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="mobile-photo-restore-input"
        onChange={(e) => {
          handleFile(e.target.files);
          e.target.value = '';
        }}
      />

      {!originalUrl ? (
        <>
          <Annotate id="mobile-photo-restore.upload">
          <div
            className="mobile-photo-restore-empty clickable"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={40} color="#ccc" />
            <p>{records.length === 0 ? '暂无修复记录' : '点击上传照片开始修复'}</p>
            <span>{records.length === 0 ? '点击上传照片即可开始修复' : '或从下方修复记录中查看'}</span>
          </div>
          </Annotate>

          {records.length > 0 && (
            <div className="mobile-photo-history">
              <h3 className="mobile-photo-history-title">修复记录</h3>
              <div className="mobile-photo-history-list">
                {records.map((r) => (
                  <div key={r.id} className="mobile-photo-history-item" onClick={() => openRecord(r)}>
                    <img src={r.restored} alt={r.fileName} />
                    <div className="mobile-photo-history-meta">
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      <button
                        className="mobile-photo-history-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecord(r.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mobile-photo-restore-panel">
          {restoredUrl ? (
            <Annotate id="mobile-photo-restore.compare">
            <div className="mobile-photo-compare">
              <div className="mobile-photo-compare-item">
                <img src={originalUrl} alt="修复前" />
                <span>修复前</span>
              </div>
              <div className="mobile-photo-compare-item">
                <img src={restoredUrl} alt="修复后" />
                <span>修复后</span>
              </div>
            </div>
            </Annotate>
          ) : (
            <div className="mobile-photo-preview">
              <img src={originalUrl} alt="待修复" />
            </div>
          )}

          {processing && (
            <div className="mobile-photo-progress">
              <div className="mobile-photo-progress-header">
                <span>AI 正在修复中…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mobile-photo-progress-bar">
                <div className="mobile-photo-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <Annotate id="mobile-photo-restore.result-actions">
          <div className="mobile-photo-actions">
            {!restoredUrl ? (
              <Annotate id="mobile-photo-restore.start-restore" inline>
              <button
                className="mobile-photo-btn primary"
                onClick={startRestore}
                disabled={processing}
              >
                <Sparkles size={16} />
                {processing ? '修复中…' : '开始修复'}
              </button>
              </Annotate>
            ) : (
              <button className="mobile-photo-btn primary" onClick={saveToArchive}>
                保存到人生档案
              </button>
            )}
            <button className="mobile-photo-btn" onClick={reset} disabled={processing}>
              重新上传
            </button>
          </div>
          </Annotate>
        </div>
      )}
    </div>
  );
}
