import { useEffect, useState } from 'react';
import { X, BookOpen, Tag, DollarSign, FileText, User } from 'lucide-react';
import { bookshelfApi } from '../api/bookshelf';
import { dictionaryApi } from '../api/dictionary';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { PublicBook } from '../mocks/types';
import './PublishBookModal.css';

interface Archive {
  id: string;
  name: string;
  birthYear?: string;
  origin?: string;
  occupation?: string;
}

interface PublishBookModalProps {
  archive: Archive;
  onClose: () => void;
  onPublished?: () => void;
}

export default function PublishBookModal({ archive, onClose, onPublished }: PublishBookModalProps) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<PublicBook | null>(null);
  const [occupationOptions, setOccupationOptions] = useState<string[]>([]);
  const [lifeStageOptions, setLifeStageOptions] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: `${archive.name}的传记`,
    author: user?.name || '本人/家属整理',
    intro: '',
    occupationTags: [] as string[],
    lifeStageTags: [] as string[],
    isFree: true,
    price: '',
    trialWords: 1000,
  });

  useEffect(() => {
    dictionaryApi.list('book_occupation')
      .then((list) => setOccupationOptions(list.map((item) => item.label)))
      .catch(() => setOccupationOptions([]));
    dictionaryApi.list('book_life_stage')
      .then((list) => setLifeStageOptions(list.map((item) => item.label)))
      .catch(() => setLifeStageOptions([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    bookshelfApi
      .myList()
      .then((list) => {
        const found = list.find((b) => b.archiveId === archive.id);
        if (found) {
          setExisting(found);
          setForm({
            title: found.title,
            author: found.author,
            intro: found.intro,
            occupationTags: found.occupationTags?.length ? found.occupationTags : [found.category],
            lifeStageTags: found.lifeStageTags || [],
            isFree: found.isFree,
            price: found.isFree ? '' : found.price.toString(),
            trialWords: found.trialWords || 1000,
          });
        }
      })
      .catch(() => setExisting(null))
      .finally(() => setLoading(false));
  }, [archive.id]);

  const toggleTag = (key: 'occupationTags' | 'lifeStageTags', tag: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(tag) ? prev[key].filter((t) => t !== tag) : [...prev[key], tag],
    }));
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
    if (!form.isFree) {
      const priceNum = parseFloat(form.price);
      if (isNaN(priceNum) || priceNum < 0) {
        addToast('请填写正确的价格', 'error');
        return;
      }
    }

    try {
      const bookId = existing?.id || `book_${archive.id}_${Date.now()}`;
      await bookshelfApi.publish(bookId, {
        archiveId: archive.id,
        title: form.title,
        author: form.author,
        intro: form.intro,
        // category 保留用于书架筛选兼容，取第一个职业标签
        category: form.occupationTags[0] || '其他',
        occupationTags: form.occupationTags,
        lifeStageTags: form.lifeStageTags,
        isFree: form.isFree,
        price: form.isFree ? 0 : parseFloat(form.price),
        trialWords: form.trialWords,
      });
      addToast(existing ? '已重新提交审核' : '上架申请已提交，等待平台审核', 'success');
      onPublished?.();
      onClose();
    } catch (err: any) {
      addToast(err.message || '提交失败', 'error');
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
                <label><BookOpen size={14} /> 传记标题</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="给传记起个标题"
                />
              </div>

              <div className="form-row">
                <label><User size={14} /> 作者署名</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="作者署名"
                />
              </div>

              <div className="form-row">
                <label><Tag size={14} /> 职业标签（可多选，选填）</label>
                <div className="publish-book-tags">
                  {occupationOptions.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`publish-book-tag ${form.occupationTags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleTag('occupationTags', tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label><Tag size={14} /> 人生阶段标签（可多选，选填）</label>
                <div className="publish-book-tags">
                  {lifeStageOptions.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`publish-book-tag publish-book-tag-stage ${form.lifeStageTags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleTag('lifeStageTags', tag)}
                    >
                      {tag}
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
                <button className="btn btn-primary" onClick={handleSubmit}>
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
