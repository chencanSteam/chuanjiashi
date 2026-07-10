import { useEffect, useRef, useState } from 'react';

import {
  Upload,
  Download,
  Save,
  Image as ImageIcon,
  Sparkles,
  ZoomIn,
  Eraser,
  Palette,
  History,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './PhotoRestore.css';

type RestoreMode = 'enhance' | 'scratch' | 'colorize' | 'upscale';

interface RestoreRecord {
  id: string;
  original: string;
  restored: string;
  mode: RestoreMode;
  createdAt: string;
  fileName: string;
}

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

interface MediaItem {
  id: string;
  title: string;
  date: string;
  type: 'image' | 'video' | 'audio' | 'doc';
  stage?: string;
}

interface StoredTimelineEvent {
  year: string;
  endYear?: string;
  title: string;
  desc: string;
  icon?: string;
  color?: string;
  bg?: string;
  tags?: { label: string; color: string; bg: string }[];
}

const modes: { id: RestoreMode; label: string; desc: string; icon: typeof Sparkles }[] = [
  { id: 'enhance', label: '智能增强', desc: '提升清晰度、亮度与色彩', icon: Sparkles },
  { id: 'scratch', label: '去划痕', desc: '修复破损、折痕与污渍', icon: Eraser },
  { id: 'colorize', label: '黑白上色', desc: '为黑白老照片智能着色', icon: Palette },
  { id: 'upscale', label: '超清放大', desc: '分辨率提升 2 倍', icon: ZoomIn },
];

const modeLabels: Record<RestoreMode, string> = {
  enhance: '智能增强',
  scratch: '去划痕',
  colorize: '黑白上色',
  upscale: '超清放大',
};

const STORAGE_KEY = 'cj_photo_restore_records';

function loadRecords(): RestoreRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveRecords(records: RestoreRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 20)));
  } catch {
    // ignore
  }
}

function loadArchives(): Archive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw) as Archive[];
  } catch {
    // ignore
  }
  return [];
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadStages(archiveId: string): string[] {
  try {
    const raw = localStorage.getItem(`cj_events_${archiveId}`);
    if (!raw) return [];
    const events: StoredTimelineEvent[] = JSON.parse(raw);
    return events
      .filter((e) => e.year && e.title)
      .map((e) => `${e.year}·${e.title}`)
      .sort();
  } catch {
    return [];
  }
}

const defaultStages = ['童年', '求学', '工作', '婚姻', '养育子女', '创业', '退休', '其他'];

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function processImage(originalUrl: string, mode: RestoreMode): Promise<string> {
  const img = await loadImage(originalUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return originalUrl;

  const maxSide = 1200;
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (mode === 'upscale') {
    width *= 2;
    height *= 2;
  }

  if (width > maxSide || height > maxSide) {
    const ratio = Math.min(maxSide / width, maxSide / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  // 绘制原图
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  switch (mode) {
    case 'enhance':
      applyEnhance(data, width, height);
      break;
    case 'scratch':
      applyScratchRepair(data, width, height);
      break;
    case 'colorize':
      applyColorize(data, width, height);
      break;
    case 'upscale':
      applyUpscaleSharpen(data, width, height);
      break;
  }

  ctx.putImageData(imageData, 0, 0);

  // 叠加一层轻微纹理，让修复效果更真实
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(255, 248, 230, 0.06)';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  return canvas.toDataURL('image/jpeg', 0.92);
}

function applyEnhance(data: Uint8ClampedArray, _width: number, _height: number) {
  const contrast = 1.15;
  const brightness = 12;
  const saturation = 1.2;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // brightness & contrast
    r = (r - 128) * contrast + 128 + brightness;
    g = (g - 128) * contrast + 128 + brightness;
    b = (b - 128) * contrast + 128 + brightness;

    // saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
}

function applyScratchRepair(data: Uint8ClampedArray, width: number, height: number) {
  // 轻微模糊 + 去噪：对每一个像素取 3x3 邻域平均，但保留边缘
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          r += copy[nIdx];
          g += copy[nIdx + 1];
          b += copy[nIdx + 2];
          count++;
        }
      }
      data[idx] = clamp(r / count * 1.02);
      data[idx + 1] = clamp(g / count * 1.02);
      data[idx + 2] = clamp(b / count * 1.02);
    }
  }
  applyEnhance(data, width, height);
}

function applyColorize(data: Uint8ClampedArray, width: number, height: number) {
  // 简单模拟上色：根据亮度映射到暖色调（肤色/棕褐/蓝）
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const t = gray / 255;

    // 暗部偏暖褐，亮部偏淡黄，中间偏肤色
    let r, g, b;
    if (t < 0.35) {
      r = 60 + t * 120;
      g = 40 + t * 80;
      b = 30 + t * 50;
    } else if (t < 0.7) {
      r = 160 + (t - 0.35) * 60;
      g = 110 + (t - 0.35) * 80;
      b = 80 + (t - 0.35) * 60;
    } else {
      r = 230 + (t - 0.7) * 25;
      g = 210 + (t - 0.7) * 35;
      b = 180 + (t - 0.7) * 45;
    }

    // 与原图亮度混合，保留部分细节
    const blend = 0.75;
    data[i] = clamp(r * blend + gray * (1 - blend));
    data[i + 1] = clamp(g * blend + gray * (1 - blend));
    data[i + 2] = clamp(b * blend + gray * (1 - blend));
  }
  applyEnhance(data, width, height);
}

function applyUpscaleSharpen(data: Uint8ClampedArray, width: number, height: number) {
  const copy = new Uint8ClampedArray(data);
  const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let r = 0, g = 0, b = 0;
      let ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          r += copy[nIdx] * kernel[ki];
          g += copy[nIdx + 1] * kernel[ki];
          b += copy[nIdx + 2] * kernel[ki];
          ki++;
        }
      }
      data[idx] = clamp(r);
      data[idx + 1] = clamp(g);
      data[idx + 2] = clamp(b);
    }
  }
  applyEnhance(data, width, height);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export default function PhotoRestore() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [restoredUrl, setRestoredUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<RestoreMode>('enhance');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [records, setRecords] = useState<RestoreRecord[]>(() => loadRecords());
  const [selectedRecord, setSelectedRecord] = useState<RestoreRecord | null>(null);
  const [archives] = useState<Archive[]>(() => loadArchives());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>(() => {
    try {
      return localStorage.getItem('cj_current_archive_id') || (loadArchives()[0]?.id ?? '');
    } catch {
      return '';
    }
  });
  const [saveFileName, setSaveFileName] = useState(`修复照片_${new Date().toLocaleDateString()}.jpg`);
  const [saveStage, setSaveStage] = useState('其他');
  const [customStage, setCustomStage] = useState('');
  const [stageOptions, setStageOptions] = useState<string[]>([]);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    if (showSaveModal && selectedArchiveId) {
      const stages = loadStages(selectedArchiveId);
      const options = stages.length > 0 ? stages : defaultStages;
      setStageOptions(options);
      setSaveStage(options[0] || '其他');
      setCustomStage('');
    }
  }, [showSaveModal, selectedArchiveId]);

  const handleFiles = async (files: FileList | null) => {
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
    setSelectedRecord(null);
    addToast('图片上传成功', 'success');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const startRestore = async () => {
    if (!originalUrl) {
      addToast('请先上传老照片', 'error');
      return;
    }
    setProcessing(true);
    setProgress(0);
    setRestoredUrl(null);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + Math.random() * 12;
      });
    }, 300);

    try {
      const result = await processImage(originalUrl, mode);
      clearInterval(progressInterval);
      setProgress(100);
      setRestoredUrl(result);

      const newRecord: RestoreRecord = {
        id: Date.now().toString(),
        original: originalUrl,
        restored: result,
        mode,
        createdAt: new Date().toISOString(),
        fileName: `修复照片_${Date.now()}.jpg`,
      };
      setRecords((prev) => [newRecord, ...prev]);
      setSelectedRecord(newRecord);
      addToast('老照片修复完成', 'success');
    } catch (err) {
      addToast('修复失败，请重试', 'error');
    } finally {
      clearInterval(progressInterval);
      setProcessing(false);
    }
  };

  const downloadRestored = (url?: string, fileName?: string) => {
    const target = url || restoredUrl;
    if (!target) return;
    const a = document.createElement('a');
    a.href = target;
    a.download = fileName || '修复后的老照片.jpg';
    a.click();
    addToast('已开始下载', 'success');
  };

  const saveToArchive = () => {
    if (!restoredUrl) return;
    if (archives.length === 0) {
      addToast('暂无可选档案，请先创建人生档案', 'error');
      return;
    }
    setShowSaveModal(true);
    setSaveFileName(`修复照片_${new Date().toLocaleDateString()}.jpg`);
    setCustomStage('');
  };

  const confirmSaveToArchive = () => {
    if (!restoredUrl || !selectedArchiveId) return;
    try {
      const finalStage = saveStage === '自定义' ? customStage.trim() || '其他' : saveStage;

      // 保存修复后的图片数据
      const restoredKey = `cj_restored_photos_${selectedArchiveId}`;
      const restoredList: string[] = loadJson(restoredKey, []);
      restoredList.unshift(restoredUrl);
      saveJson(restoredKey, restoredList.slice(0, 50));

      // 在媒体库中添加记录
      const mediaKey = `cj_media_${selectedArchiveId}`;
      const mediaList: MediaItem[] = loadJson(mediaKey, []);
      mediaList.unshift({
        id: `restored_${Date.now()}`,
        title: saveFileName || '修复后的老照片.jpg',
        date: new Date().toISOString().slice(0, 10),
        type: 'image',
        stage: finalStage,
      });
      saveJson(mediaKey, mediaList);

      setShowSaveModal(false);
      addToast(`已保存到选定人生档案 · 阶段：${finalStage}`, 'success');
    } catch {
      addToast('保存失败', 'error');
    }
  };

  const deleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
      setOriginalUrl(null);
      setRestoredUrl(null);
    }
    addToast('已删除记录', 'info');
  };

  const useRecord = (record: RestoreRecord) => {
    setSelectedRecord(record);
    setOriginalUrl(record.original);
    setRestoredUrl(record.restored);
    setMode(record.mode);
  };

  const clearCurrent = () => {
    setOriginalUrl(null);
    setRestoredUrl(null);
    setSelectedRecord(null);
    setProgress(0);
  };

  const displayOriginal = selectedRecord?.original || originalUrl;
  const displayRestored = selectedRecord?.restored || restoredUrl;

  return (
    <div className="detail-page photo-restore-page">
      <header className="page-header">
        <h1 className="page-title">老照片修复</h1>
      </header>

      <div className="photo-restore-grid">
        <div className="photo-restore-main">
          {/* 上传区域 */}
          {!displayOriginal ? (
            <div
              className={`card photo-restore-upload ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="card-body">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="upload-placeholder">
                  <div className="upload-icon-wrap">
                    <Upload size={36} />
                  </div>
                  <h3>点击或拖拽上传老照片</h3>
                  <p>支持 JPG、PNG、WebP 格式，单张不超过 20MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card photo-restore-preview">
              <div className="card-header">
                <h3 className="card-title">修复预览</h3>
                <button className="btn btn-ghost btn-sm" onClick={clearCurrent}>
                  <X size={14} /> 重新上传
                </button>
              </div>
              <div className="card-body">
                {displayRestored ? (
                  <div
                    className="compare-wrap"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      setComparePosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                    }}
                  >
                    <img src={displayRestored} alt="修复后" className="compare-image" />
                    <div
                      className="compare-before"
                      style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
                    >
                      <img src={displayOriginal} alt="修复前" className="compare-image" />
                    </div>
                    <div className="compare-slider" style={{ left: `${comparePosition}%` }}>
                      <div className="compare-handle" />
                    </div>
                    <span className="compare-label before">修复前</span>
                    <span className="compare-label after">修复后</span>
                  </div>
                ) : (
                  <div className="preview-single">
                    <img src={displayOriginal} alt="待修复" />
                  </div>
                )}

                {processing && (
                  <div className="progress-block">
                    <div className="progress-header">
                      <span>AI 正在修复中…</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                    <div className="progress-steps">
                      {['上传图片', '分析损伤', '智能修复', '优化细节'].map((step, idx) => (
                        <span
                          key={step}
                          className={`progress-step ${progress > (idx + 1) * 22 ? 'active' : ''}`}
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 修复模式 */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">选择修复模式</h3>
            </div>
            <div className="card-body">
              <div className="restore-modes">
                {modes.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      className={`restore-mode ${mode === m.id ? 'active' : ''} ${processing ? 'disabled' : ''}`}
                      onClick={() => !processing && setMode(m.id)}
                    >
                      <Icon size={22} />
                      <div className="restore-mode-info">
                        <strong>{m.label}</strong>
                        <span>{m.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="restore-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={startRestore}
                  disabled={processing || !displayOriginal}
                >
                  {processing ? (
                    <><Sparkles size={16} className="spin" /> 修复中…</>
                  ) : (
                    <><Sparkles size={16} /> 开始修复</>
                  )}
                </button>

                {displayRestored && (
                  <>
                    <button className="btn btn-outline" onClick={() => downloadRestored()}>
                      <Download size={16} /> 下载修复图
                    </button>
                    <button className="btn btn-accent" onClick={saveToArchive}>
                      <Save size={16} /> 保存到档案
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 侧边栏：最近记录 */}
        <div className="photo-restore-sidebar">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><History size={16} /> 修复记录</h3>
            </div>
            <div className="card-body">
              {records.length === 0 ? (
                <div className="restore-empty">
                  <ImageIcon size={32} />
                  <p>暂无修复记录</p>
                </div>
              ) : (
                <div className="restore-records">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className={`restore-record ${selectedRecord?.id === record.id ? 'active' : ''}`}
                      onClick={() => useRecord(record)}
                    >
                      <img src={record.original} alt="缩略图" />
                      <div className="restore-record-info">
                        <strong>{modeLabels[record.mode]}</strong>
                        <span>{new Date(record.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="restore-record-actions">
                        <button
                          className="icon-btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadRestored(record.restored, record.fileName);
                          }}
                          title="下载"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="icon-btn-sm danger"
                          onClick={(e) => deleteRecord(record.id, e)}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {selectedRecord?.id === record.id && (
                        <CheckCircle2 size={14} className="record-check" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content photo-save-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>保存到人生档案</h3>
              <button className="modal-close" onClick={() => setShowSaveModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {archives.length === 0 ? (
                <div className="save-archive-empty">暂无可选档案，请先创建人生档案。</div>
              ) : (
                <>
                  <div className="form-row">
                    <label>选择档案</label>
                    <select
                      value={selectedArchiveId}
                      onChange={(e) => setSelectedArchiveId(e.target.value)}
                    >
                      {archives.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {a.origin} · {a.birthYear}年生
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>阶段</label>
                    <select
                      value={saveStage}
                      onChange={(e) => setSaveStage(e.target.value)}
                    >
                      {stageOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="自定义">自定义</option>
                    </select>
                  </div>
                  {saveStage === '自定义' && (
                    <div className="form-row">
                      <label>自定义阶段</label>
                      <input
                        type="text"
                        value={customStage}
                        onChange={(e) => setCustomStage(e.target.value)}
                        placeholder="如：1988年结婚"
                      />
                    </div>
                  )}
                  <div className="form-row">
                    <label>文件名</label>
                    <input
                      type="text"
                      value={saveFileName}
                      onChange={(e) => setSaveFileName(e.target.value)}
                      placeholder="修复后的老照片.jpg"
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setShowSaveModal(false)}>取消</button>
                    <button
                      className="btn btn-primary"
                      onClick={confirmSaveToArchive}
                      disabled={!selectedArchiveId || !saveFileName.trim()}
                    >
                      <Save size={14} /> 确认保存
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
