import { useRef, useState } from 'react';
import { Image, Upload, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import './MobilePhotoRestore.css';

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
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [restoredUrl, setRestoredUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

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

    // mock 修复：进度条走完后直接复用原图作为「修复后」效果
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setRestoredUrl(originalUrl);
      setProcessing(false);
      addToast('修复完成，已保存到修复记录', 'success');
    }, 2600);
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
        <div
          className="mobile-photo-restore-empty clickable"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={40} color="#ccc" />
          <p>暂无修复记录</p>
          <span>点击上传照片即可开始修复</span>
        </div>
      ) : (
        <div className="mobile-photo-restore-panel">
          {restoredUrl ? (
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

          <div className="mobile-photo-actions">
            {!restoredUrl ? (
              <button
                className="mobile-photo-btn primary"
                onClick={startRestore}
                disabled={processing}
              >
                <Sparkles size={16} />
                {processing ? '修复中…' : '开始修复'}
              </button>
            ) : (
              <button className="mobile-photo-btn primary" onClick={() => addToast('修复结果已保存', 'success')}>
                保存修复结果
              </button>
            )}
            <button className="mobile-photo-btn" onClick={reset} disabled={processing}>
              重新上传
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
