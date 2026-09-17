import { useEffect, useRef, useState } from 'react';
import { X, BookOpen, DollarSign, FileText, Image, User, Briefcase, UploadCloud } from 'lucide-react';
import { bookshelfApi } from '../api/bookshelf';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { industryOccupations, industryOptions } from '../data/occupations';
import type { PublicBook } from '../mocks/types';
import './PublishBookModal.css';

interface Archive {
  id: string;
  name: string;
  birthYear?: string;
  origin?: string;
  occupation?: string;
  industry?: string;
}

function loadBiography(archiveId: string): { title?: string; author?: string } {
  try {
    return JSON.parse(localStorage.getItem(`cj_biography_${archiveId}`) || '{}') || {};
  } catch {
    return {};
  }
}

// 本地生成三款位图封面，沿用现有 cover 字段，无需上传服务。
function createDefaultCovers() {
  return [
    { name: '青绿典藏', background: '#214e43', ink: '#efe4c8' },
    { name: '朱红纪年', background: '#883f43', ink: '#f9e9cf' },
    { name: '素白书简', background: '#f3f1ea', ink: '#384940' },
  ].map(({ name, background, ink }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 360, 480);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 312, 432);
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.font = '32px serif';
    ctx.fillText('人生传记', 180, 180);
    ctx.fillRect(150, 213, 60, 2);
    ctx.font = '16px serif';
    ctx.fillText('珍藏岁月 · 留存家风', 180, 260);
    ctx.font = '14px serif';
    ctx.fillText('传家世', 180, 416);
    return { name, cover: canvas.toDataURL('image/png') };
  });
}

interface PublishBookModalProps {
  archive: Archive;
  onClose: () => void;
  onPublished?: () => void;
}

function findIndustryForOccupation(occupation?: string): string {
  if (!occupation) return '';
  return industryOptions.find((industry) =>
    industryOccupations[industry].some((item) => occupation === item || occupation.includes(item))
  ) || '';
}

export default function PublishBookModal({ archive, onClose, onPublished }: PublishBookModalProps) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<PublicBook | null>(null);
  const [defaultCovers] = useState(createDefaultCovers);
  const [readingCover, setReadingCover] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => {
    const biography = loadBiography(archive.id);
    return {
      title: biography.title || `${archive.name}的传记`,
      author: biography.author || archive.name || user?.name || '本人/家属整理',
      industry: archive.industry || findIndustryForOccupation(archive.occupation),
      occupation: archive.occupation || '',
      intro: '',
      cover: defaultCovers[0].cover,
      isFree: true,
      price: '',
      trialWords: 1000,
    };
  });
  const industrySelectOptions = form.industry && !industryOptions.includes(form.industry)
    ? [form.industry, ...industryOptions]
    : industryOptions;
  const occupations = industryOccupations[form.industry] || [];
  const occupationSelectOptions = form.occupation && !occupations.includes(form.occupation)
    ? [form.occupation, ...occupations]
    : occupations;

  useEffect(() => {
    let active = true;
    bookshelfApi
      .myList()
      .then((list) => {
        const found = list.find((b) => b.archiveId === archive.id);
        if (active && found) {
          setExisting(found);
          setForm((prev) => ({
            ...prev,
            title: found.title || prev.title,
            author: found.author || prev.author,
            industry: found.occupationTags?.[0] && found.occupationTags[0] !== prev.occupation
              ? findIndustryForOccupation(found.occupationTags[0])
              : prev.industry || findIndustryForOccupation(found.occupationTags?.[0]),
            occupation: found.occupationTags?.[0] || prev.occupation,
            intro: found.intro,
            cover: found.cover || prev.cover,
            isFree: found.isFree,
            price: found.isFree ? '' : found.price.toString(),
            trialWords: found.trialWords || 1000,
          }));
        }
      })
      .catch(() => { if (active) setExisting(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [archive.id]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('请选择图片文件', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('封面图片不能超过 2 MB', 'error');
      return;
    }
    setReadingCover(true);
    const reader = new FileReader();
    reader.onload = () => {
      const cover = String(reader.result || '');
      const image = new window.Image();
      image.onload = () => {
        setForm((prev) => ({ ...prev, cover }));
        setReadingCover(false);
      };
      image.onerror = () => {
        addToast('图片无法预览，请选择其他图片', 'error');
        setReadingCover(false);
      };
      image.src = cover;
    };
    reader.onerror = () => {
      addToast('图片读取失败，请重试', 'error');
      setReadingCover(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      addToast('请填写传记标题', 'error');
      return;
    }
    if (!form.intro.trim()) {
      addToast('请填写简介', 'error');
      return;
    }
    if (!form.industry) {
      addToast('请选择行业', 'error');
      return;
    }
    if (!form.occupation) {
      addToast('请选择职业', 'error');
      return;
    }
    if (!form.isFree) {
      const priceNum = parseFloat(form.price);
      if (isNaN(priceNum) || priceNum < 0) {
        addToast('请填写正确的价格', 'error');
        return;
      }
    }

    try {
      const bookId = existing?.id || `book_${archive.id}_${Date.now()}`;
      const published = await bookshelfApi.publish(bookId, {
        archiveId: archive.id,
        title: form.title,
        author: form.author,
        intro: form.intro,
        cover: form.cover || undefined,
        category: '其他',
        occupationTags: [form.occupation],
        isFree: form.isFree,
        price: form.isFree ? 0 : parseFloat(form.price),
        trialWords: form.trialWords,
      });
      if (published.restricted) {
        addToast('已提交，但内容包含需复核的词汇，审核期间仅自己可见', 'info');
      } else {
        addToast(existing ? '已重新提交审核' : '上架申请已提交，等待平台审核', 'success');
      }
      onPublished?.();
      onClose();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : '提交失败', 'error');
    }
  };

  const statusLabel: Record<string, string> = {
    pending: '审核中',
    approved: '已通过',
    rejected: '已拒绝',
    off_shelf: '已下架',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content publish-book-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4><BookOpen size={16} /> {existing ? '重新提交上架' : '上架传记'}</h4>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body publish-book-body">
          {loading ? (
            <div className="publish-book-loading">加载中…</div>
          ) : (
            <>
              {existing && (
                <div className={`publish-book-status publish-book-status-${existing.status}`}>
                  当前状态：{statusLabel[existing.status] || existing.status}
                </div>
              )}

              <div className="form-row">
                <label htmlFor="publish-book-title"><BookOpen size={14} /> 专辑标题</label>
                <input
                  id="publish-book-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="给传记起个标题"
                />
              </div>

              <div className="form-row">
                <label htmlFor="publish-book-author"><User size={14} /> 作者署名</label>
                <input
                  id="publish-book-author"
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="作者署名"
                />
              </div>

              <div className="form-row">
                <label htmlFor="publish-book-industry"><Briefcase size={14} /> 行业</label>
                <select
                  id="publish-book-industry"
                  value={form.industry}
                  onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value, occupation: '' }))}
                >
                  <option value="">请选择行业</option>
                  {industrySelectOptions.map((industry) => (
                    <option value={industry} key={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="publish-book-occupation"><User size={14} /> 职业</label>
                <select
                  id="publish-book-occupation"
                  value={form.occupation}
                  onChange={(e) => setForm((prev) => ({ ...prev, occupation: e.target.value }))}
                  disabled={!form.industry}
                >
                  <option value="">{form.industry ? '请选择职业' : '请先选择行业'}</option>
                  {occupationSelectOptions.map((occupation) => (
                    <option value={occupation} key={occupation}>{occupation}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label><Image size={14} /> 专辑封面</label>
                <div className="publish-book-cover-row">
                  <div className="publish-book-cover-preview">
                    {form.cover ? (
                      <img src={form.cover} alt="书籍封面" />
                    ) : (
                      <BookOpen size={28} />
                    )}
                  </div>
                  <div className="publish-book-cover-actions">
                    <button type="button" className="btn btn-outline btn-sm" disabled={readingCover} onClick={() => uploadInput.current?.click()}>
                      <UploadCloud size={14} /> {readingCover ? '读取中…' : '上传封面'}
                    </button>
                    <input ref={uploadInput} type="file" hidden accept="image/*" onChange={handleCoverChange} />
                    {!defaultCovers.some((item) => item.cover === form.cover) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={readingCover}
                        onClick={() => setForm((prev) => ({ ...prev, cover: defaultCovers[0].cover }))}
                      >
                        移除上传封面
                      </button>
                    )}
                    <span className="publish-book-field-hint">图片不超过 2 MB</span>
                  </div>
                </div>
                <div className="publish-book-default-covers" role="group" aria-label="默认封面">
                  {defaultCovers.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      className="publish-book-cover-option"
                      aria-pressed={form.cover === item.cover}
                      disabled={readingCover}
                      onClick={() => setForm((prev) => ({ ...prev, cover: item.cover }))}
                    >
                      <img src={item.cover} alt="" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label><FileText size={14} /> 简介</label>
                <textarea
                  value={form.intro}
                  onChange={(e) => setForm((prev) => ({ ...prev, intro: e.target.value }))}
                  placeholder="简单介绍这本传记的内容亮点"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <label><DollarSign size={14} /> 定价</label>
                <div className="publish-book-price-row">
                  <label className="publish-book-radio">
                    <input
                      type="radio"
                      checked={form.isFree}
                      onChange={() => setForm((prev) => ({ ...prev, isFree: true, price: '' }))}
                    />
                    免费公开
                  </label>
                  <label className="publish-book-radio">
                    <input
                      type="radio"
                      checked={!form.isFree}
                      onChange={() => setForm((prev) => ({ ...prev, isFree: false, price: prev.price || '9.9' }))}
                    />
                    付费阅读
                  </label>
                </div>
                {!form.isFree && (
                  <div className="publish-book-price-input">
                    <span>¥</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="售价"
                    />
                  </div>
                )}
              </div>

              {!form.isFree && (
                <div className="form-row">
                  <label><FileText size={14} /> 试看字数</label>
                  <select value={form.trialWords} onChange={(e) => setForm((prev) => ({ ...prev, trialWords: Number(e.target.value) }))}>
                    {[500, 1000, 2000, 5000].map((value) => <option key={value} value={value}>{value} 字</option>)}
                  </select>
                  <span className="publish-book-field-hint">读者可免费阅读前 N 字，付费后解锁全本。</span>
                </div>
              )}
              <div className="publish-book-hint">
                上架申请仅对已完成传记开放，提交后平台将在 1-3 个工作日内完成审核。
              </div>

              <div className="publish-book-actions">
                <button className="btn btn-outline" onClick={onClose}>取消</button>
                <button className="btn btn-primary" disabled={readingCover} onClick={handleSubmit}>
                  {existing ? '重新提交审核' : '提交上架申请'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
