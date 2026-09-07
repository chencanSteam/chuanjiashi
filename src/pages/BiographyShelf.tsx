import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Bookmark,
  ArrowLeft,
  Share2,
  User,
  Tag,
  Clock,
  Lock,
  Unlock,
  Flame,
} from 'lucide-react';
import { bookshelfApi } from '../api/bookshelf';
import Annotate from '../components/annotation/Annotate';
import Modal from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { industryOccupations, industryOptions } from '../data/occupations';
import type { PublicBook } from '../mocks/types';
import './BiographyShelf.css';

export default function BiographyShelf() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [book, setBook] = useState<PublicBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [activeIndustry, setActiveIndustry] = useState('');
  const [activeOccupation, setActiveOccupation] = useState('');
  const [activeChapter, setActiveChapter] = useState('');
  const [sort, setSort] = useState('default');
  const [activeTab, setActiveTab] = useState<'all' | 'collected' | 'purchased'>('all');
  const [unlocking, setUnlocking] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');

  useEffect(() => {
    if (id) {
      setLoading(true);
      bookshelfApi
        .get(id)
        .then(setBook)
        .catch(() => {
          setBook(null);
          addToast('传记不存在或已下架', 'error');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      bookshelfApi
        .list()
        .then(setBooks)
        .catch(() => setBooks([]))
        .finally(() => setLoading(false));
      setBook(null);
    }
  }, [id, addToast]);

  const filtered = useMemo(() => {
    let list = books;
    if (activeTab === 'collected') {
      list = list.filter((b) => b.collected);
    } else if (activeTab === 'purchased') {
      // 已购：付费且已解锁（免费书不算购买）
      list = list.filter((b) => !b.isFree && b.unlocked);
    }
    if (activeOccupation) {
      list = list.filter((b) => (b.occupationTags || []).includes(activeOccupation));
    } else if (activeIndustry) {
      const occupations = industryOccupations[activeIndustry] || [];
      list = list.filter((b) => (b.occupationTags || []).some((t) => occupations.includes(t)));
    }
    if (activeChapter) {
      list = list.filter((b) => (b.lifeStageTags || []).includes(activeChapter));
    }
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.intro.toLowerCase().includes(q)
      );
    }
    list = [...list];
    const sales = (book: PublicBook) => book.sales ?? book.likes ?? 0;
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    if (sort === 'sales-high') list.sort((a, b) => sales(b) - sales(a));
    if (sort === 'sales-low') list.sort((a, b) => sales(a) - sales(b));
    return list;
  }, [books, activeTab, activeIndustry, activeOccupation, activeChapter, keyword, sort]);

  const chapterOptions = useMemo(() => Array.from(new Set(books.flatMap((b) => b.lifeStageTags || []))), [books]);

  const handleCollect = async (bookId: string) => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    try {
      const updated = await bookshelfApi.collect(bookId);
      addToast(updated.collected ? '收藏成功' : '已取消收藏', 'success');
      if (id && book && book.id === bookId) {
        setBook(updated);
      } else {
        setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
      }
    } catch (err: any) {
      addToast(err.message || '收藏失败', 'error');
    }
  };

  const handleShare = async () => {
    if (!book) return;
    const url = `${window.location.origin}${window.location.pathname}#/biography-shelf/${book.id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast('链接已复制到剪贴板', 'success');
    } catch {
      addToast(`复制失败，请手动复制：${url}`, 'error');
    }
  };

  const hotBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => b.views + b.likes - (a.views + a.likes))
      .slice(0, 5);
  }, [books]);

  const handleUnlock = async () => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    if (!book) return;
    setShowPayModal(true);
  };

  const handleConfirmPay = async () => {
    if (!book) return;
    setUnlocking(true);
    try {
      // mock 演示：模拟支付耗时后完成解锁
      await new Promise((r) => setTimeout(r, 1200));
      const updated = await bookshelfApi.unlock(book.id);
      setBook(updated);
      setShowPayModal(false);
      addToast('支付成功，已解锁全本', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error && err.message ? err.message : '解锁失败', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  if (id) {
    if (loading) {
      return (
        <div className="biography-shelf-page">
          <div className="biography-shelf-loading">加载中…</div>
        </div>
      );
    }
    if (!book) {
      return (
        <div className="biography-shelf-page">
          <div className="biography-shelf-empty">
            <BookOpen size={48} color="#d1d5db" />
            <p>传记不存在或已下架</p>
            <button className="btn btn-primary" onClick={() => navigate('/biography-shelf')}>
              <ArrowLeft size={14} /> 返回书架
            </button>
          </div>
        </div>
      );
    }

    const canReadFull = book.isFree || book.price === 0 || !!book.unlocked;
    const readerText = (canReadFull ? book.fullContent || book.trialContent : book.trialContent) || book.intro;

    return (
      <div className="biography-shelf-page">
        <button className="biography-shelf-back" onClick={() => navigate('/biography-shelf')}>
          <ArrowLeft size={16} /> 返回书架
        </button>
        <div className="biography-shelf-detail">
          <div className="biography-shelf-cover">
            {book.cover ? <img src={book.cover} alt={book.title} /> : <BookOpen size={64} />}
          </div>
          <div className="biography-shelf-detail-info">
            <div className="biography-shelf-category">
              <Tag size={12} /> {book.category || '其他'}
            </div>
            <h1 className="biography-shelf-title">{book.title}</h1>
            <div className="biography-shelf-meta">
              <span><User size={12} /> {book.author || '匿名'}</span>
              <span><Clock size={12} /> {new Date(book.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="biography-shelf-intro">{book.intro}</p>
            <div className="biography-shelf-price">
              {book.isFree || book.price === 0 ? (
                <span className="biography-shelf-free">免费阅读</span>
              ) : (
                <span>¥{book.price.toFixed(2)}</span>
              )}
            </div>
            <Annotate id="biography-shelf.detail-actions" inline>
            <div className="biography-shelf-actions">
              <span className="biography-shelf-sold">已售 {book.sales ?? book.likes}</span>
              <button className="btn btn-outline" onClick={() => handleCollect(book.id)}>
                <Bookmark size={14} /> {book.collects}
              </button>
              <button className="btn btn-outline" onClick={handleShare}>
                <Share2 size={14} /> 分享
              </button>
            </div>
            </Annotate>
          </div>
        </div>

        <Annotate id="biography-shelf.reader-unlock">
        <div className="biography-shelf-content">
          <h2 className="biography-shelf-section-title">
            {canReadFull ? <Unlock size={16} /> : <Lock size={16} />}
            {canReadFull ? '全本阅读' : book.trialWords ? `前 ${book.trialWords} 字 · 免费试读` : '第一章 · 免费试读'}
          </h2>
          <div className="biography-shelf-reader">
            {readerText.split(/\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {!canReadFull && (
            <div className="biography-shelf-unlock-bar">
              <span>试读结束，解锁后可阅读全本</span>
              <button className="btn btn-primary" onClick={handleUnlock}>
                <Lock size={14} /> 付费解锁全本 ¥{book.price.toFixed(2)}
              </button>
            </div>
          )}
        </div>
        </Annotate>

        <Modal
          open={showPayModal}
          title="确认订单"
          onClose={() => !unlocking && setShowPayModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowPayModal(false)} disabled={unlocking}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleConfirmPay} disabled={unlocking}>
                {unlocking ? '支付中…' : `确认支付 ¥${book.price.toFixed(2)}`}
              </button>
            </>
          }
        >
          <div className="biography-shelf-pay">
            <div className="biography-shelf-pay-row">
              <span>商品名称</span>
              <span>{book.title}</span>
            </div>
            <div className="biography-shelf-pay-row">
              <span>商品类型</span>
              <span>电子传记（全本阅读）</span>
            </div>
            <div className="biography-shelf-pay-row">
              <span>订单金额</span>
              <span className="biography-shelf-pay-price">¥{book.price.toFixed(2)}</span>
            </div>
            <div className="biography-shelf-pay-methods">
              <div className="biography-shelf-pay-label">支付方式</div>
              <label className={`biography-shelf-pay-method ${payMethod === 'wechat' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payMethod"
                  checked={payMethod === 'wechat'}
                  onChange={() => setPayMethod('wechat')}
                />
                微信支付
              </label>
              <label className={`biography-shelf-pay-method ${payMethod === 'alipay' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payMethod"
                  checked={payMethod === 'alipay'}
                  onChange={() => setPayMethod('alipay')}
                />
                支付宝
              </label>
            </div>
            <p className="biography-shelf-pay-tip">演示环境为模拟支付，点击「确认支付」即视为支付成功。</p>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="biography-shelf-page">
      <header className="biography-shelf-header">
        <h1><BookOpen size={24} /> 传记书城</h1>
        <p>记录平凡生命中的不凡故事，致敬每一段值得被铭记的人生。</p>
      </header>

      <Annotate id="biography-shelf.search" inline>
      <div className="biography-shelf-toolbar">
        <div className="biography-shelf-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="搜索传记标题、作者、简介…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>
      </Annotate>

      <Annotate id="biography-shelf.categories" inline>
      <div className="biography-shelf-cascade">
        <select
          value={activeIndustry}
          onChange={(e) => { setActiveIndustry(e.target.value); setActiveOccupation(''); }}
        >
          <option value="">全部行业</option>
          {industryOptions.map((i) => (
            <option value={i} key={i}>{i}</option>
          ))}
        </select>
        <select
          value={activeOccupation}
          onChange={(e) => setActiveOccupation(e.target.value)}
          disabled={!activeIndustry}
        >
          <option value="">{activeIndustry ? '全部职业' : '请先选择行业'}</option>
          {(industryOccupations[activeIndustry] || []).map((o) => (
            <option value={o} key={o}>{o}</option>
          ))}
        </select>
        <select value={activeChapter} onChange={(e) => setActiveChapter(e.target.value)}>
          <option value="">全部章节</option>
          {chapterOptions.map((chapter) => <option value={chapter} key={chapter}>{chapter}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="排序方式">
          <option value="default">综合排序</option>
          <option value="newest">上架时间：最新</option>
          <option value="oldest">上架时间：最早</option>
          <option value="price-high">价格：从高到低</option>
          <option value="price-low">价格：从低到高</option>
          <option value="sales-high">销量：从高到低</option>
          <option value="sales-low">销量：从低到高</option>
        </select>
      </div>
      </Annotate>

      <div className="biography-shelf-tabs">
        {([
          { key: 'all', label: '全部传记' },
          { key: 'collected', label: '我的收藏' },
          { key: 'purchased', label: '已购传记' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            className={`biography-shelf-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'all' && !loading && hotBooks.length > 0 && (
        <Annotate id="biography-shelf.hot-rank">
        <section className="biography-shelf-rank">
          <h2 className="biography-shelf-rank-title"><Flame size={16} /> 热度榜单</h2>
          <div className="biography-shelf-rank-list">
            {hotBooks.map((b, i) => (
              <div
                className="biography-shelf-rank-item"
                key={b.id}
                onClick={() => navigate(`/biography-shelf/${b.id}`)}
              >
                <span className={`biography-shelf-rank-no rank-${i + 1}`}>{i + 1}</span>
                <div className="biography-shelf-rank-cover">
                  {b.cover ? <img src={b.cover} alt={b.title} /> : <BookOpen size={20} />}
                </div>
                <div className="biography-shelf-rank-info">
                  <div className="biography-shelf-rank-book">{b.title}</div>
                  <div className="biography-shelf-rank-author">{b.author || '匿名'} · {b.category || '其他'}</div>
                  <div className="biography-shelf-rank-meta">
                    <span>已售 {b.sales ?? b.likes}</span>
                    <span className="biography-shelf-rank-price">
                      {b.isFree || b.price === 0 ? '免费' : `¥${b.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        </Annotate>
      )}

      {loading ? (
        <div className="biography-shelf-loading">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="biography-shelf-empty">
          <BookOpen size={48} color="#d1d5db" />
          <p>
            {activeTab === 'collected'
              ? '还没有收藏任何传记，看到喜欢的就点收藏吧'
              : activeTab === 'purchased'
                ? '还没有购买传记，付费解锁后可在这里随时阅读'
                : '暂无符合条件的传记'}
          </p>
        </div>
      ) : (
        <Annotate id="biography-shelf.book-cards">
        <div className="biography-shelf-grid">
          {filtered.map((b) => (
            <div className="biography-shelf-card" key={b.id} onClick={() => navigate(`/biography-shelf/${b.id}`)}>
              <div className="biography-shelf-card-cover">
                {b.cover ? <img src={b.cover} alt={b.title} /> : <BookOpen size={32} />}
              </div>
              <div className="biography-shelf-card-body">
                <div className="biography-shelf-card-tags">
                  <span className="biography-shelf-card-category">{b.category || '其他'}</span>
                  {b.lifeStageTags?.map((tag) => (
                    <span className="biography-shelf-card-stage" key={tag}>{tag}</span>
                  ))}
                </div>
                <h3 className="biography-shelf-card-title">{b.title}</h3>
                <p className="biography-shelf-card-intro">{b.intro}</p>
                <div className="biography-shelf-card-meta">
                  <span>{b.author || '匿名'}</span>
                </div>
                <div className="biography-shelf-card-footer">
                  <span className="biography-shelf-card-price">
                    {b.isFree || b.price === 0 ? '免费' : `¥${b.price.toFixed(2)}`}
                  </span>
                  <div className="biography-shelf-card-actions">
                    <span className="biography-shelf-sold">已售 {b.sales ?? b.likes}</span>
                    <button
                      className={`biography-shelf-icon-btn ${b.collected ? 'collected' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleCollect(b.id); }}
                      title={b.collected ? '取消收藏' : '收藏'}
                    >
                      <Bookmark size={12} fill={b.collected ? 'currentColor' : 'none'} /> {b.collects}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </Annotate>
      )}
    </div>
  );
}
