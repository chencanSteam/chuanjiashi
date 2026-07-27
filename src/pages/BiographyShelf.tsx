import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Eye,
  Heart,
  Bookmark,
  ArrowLeft,
  Share2,
  User,
  Tag,
  Clock,
  Lock,
  Unlock,
  MessageSquare,
  Flame,
  Send,
} from 'lucide-react';
import { bookshelfApi } from '../api/bookshelf';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { PublicBook, BookComment } from '../mocks/types';
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
  const [activeCategory, setActiveCategory] = useState('全部');
  const [comments, setComments] = useState<BookComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    bookshelfApi
      .comments(id)
      .then(setComments)
      .catch(() => setComments([]));
  }, [id]);

  const categories = useMemo(() => {
    const set = new Set(books.map((b) => b.category).filter(Boolean));
    return ['全部', ...Array.from(set)];
  }, [books]);

  const filtered = useMemo(() => {
    let list = books;
    if (activeCategory !== '全部') {
      list = list.filter((b) => b.category === activeCategory);
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
    return list;
  }, [books, activeCategory, keyword]);

  const handleLike = async (bookId: string) => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    try {
      const updated = await bookshelfApi.like(bookId);
      addToast('点赞成功', 'success');
      if (id && book && book.id === bookId) {
        setBook(updated);
      } else {
        setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
      }
    } catch (err: any) {
      addToast(err.message || '点赞失败', 'error');
    }
  };

  const handleCollect = async (bookId: string) => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    try {
      const updated = await bookshelfApi.collect(bookId);
      addToast('收藏成功', 'success');
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
    setUnlocking(true);
    try {
      const updated = await bookshelfApi.unlock(book.id);
      setBook(updated);
      addToast('支付成功，已解锁全本', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error && err.message ? err.message : '解锁失败', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    if (!id) return;
    const content = commentInput.trim();
    if (!content) {
      addToast('请输入评论内容', 'error');
      return;
    }
    setCommentSubmitting(true);
    try {
      const comment = await bookshelfApi.postComment(id, content);
      setComments((prev) => [comment, ...prev]);
      setCommentInput('');
      addToast('评论发表成功', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error && err.message ? err.message : '评论失败', 'error');
    } finally {
      setCommentSubmitting(false);
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
            <BookOpen size={64} />
          </div>
          <div className="biography-shelf-detail-info">
            <div className="biography-shelf-category">
              <Tag size={12} /> {book.category || '其他'}
            </div>
            <h1 className="biography-shelf-title">{book.title}</h1>
            <div className="biography-shelf-meta">
              <span><User size={12} /> {book.author || '匿名'}</span>
              <span><Eye size={12} /> {book.views} 阅读</span>
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
            <div className="biography-shelf-actions">
              <button className="btn btn-outline" onClick={() => handleLike(book.id)}>
                <Heart size={14} /> {book.likes}
              </button>
              <button className="btn btn-outline" onClick={() => handleCollect(book.id)}>
                <Bookmark size={14} /> {book.collects}
              </button>
              <button className="btn btn-outline" onClick={handleShare}>
                <Share2 size={14} /> 分享
              </button>
            </div>
          </div>
        </div>

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
              <button className="btn btn-primary" onClick={handleUnlock} disabled={unlocking}>
                <Lock size={14} /> {unlocking ? '支付中…' : `付费解锁全本 ¥${book.price.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>

        <div className="biography-shelf-comments">
          <h2 className="biography-shelf-section-title">
            <MessageSquare size={16} /> 读者评论（{comments.length}）
          </h2>
          <div className="biography-shelf-comment-form">
            <textarea
              rows={3}
              placeholder="写下您的读后感…"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handlePostComment}
              disabled={commentSubmitting || !commentInput.trim()}
            >
              <Send size={14} /> {commentSubmitting ? '发表中…' : '发表评论'}
            </button>
          </div>
          {comments.length === 0 ? (
            <div className="biography-shelf-comment-empty">暂无评论，来发表第一条评论吧</div>
          ) : (
            <div className="biography-shelf-comment-list">
              {comments.map((c) => (
                <div className="biography-shelf-comment" key={c.id}>
                  <div className="biography-shelf-comment-head">
                    <span className="biography-shelf-comment-user">{c.userNickname}</span>
                    <span className="biography-shelf-comment-time">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="biography-shelf-comment-text">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="biography-shelf-page">
      <header className="biography-shelf-header">
        <h1><BookOpen size={24} /> 名人传记 / 传记书架</h1>
        <p>记录平凡生命中的不凡故事，致敬每一段值得被铭记的人生。</p>
      </header>

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

      <div className="biography-shelf-categories">
        {categories.map((c) => (
          <button
            key={c}
            className={`biography-shelf-category-chip ${activeCategory === c ? 'active' : ''}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {!loading && hotBooks.length > 0 && (
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
                <span className="biography-shelf-rank-book">{b.title}</span>
                <span className="biography-shelf-rank-meta">
                  <Eye size={12} /> {b.views}
                  <Heart size={12} /> {b.likes}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="biography-shelf-loading">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="biography-shelf-empty">
          <BookOpen size={48} color="#d1d5db" />
          <p>暂无符合条件的传记</p>
        </div>
      ) : (
        <div className="biography-shelf-grid">
          {filtered.map((b) => (
            <div className="biography-shelf-card" key={b.id} onClick={() => navigate(`/biography-shelf/${b.id}`)}>
              <div className="biography-shelf-card-cover">
                <BookOpen size={32} />
              </div>
              <div className="biography-shelf-card-body">
                <div className="biography-shelf-card-category">{b.category || '其他'}</div>
                <h3 className="biography-shelf-card-title">{b.title}</h3>
                <p className="biography-shelf-card-intro">{b.intro}</p>
                <div className="biography-shelf-card-meta">
                  <span>{b.author || '匿名'}</span>
                  <span><Eye size={12} /> {b.views}</span>
                </div>
                <div className="biography-shelf-card-footer">
                  <span className="biography-shelf-card-price">
                    {b.isFree || b.price === 0 ? '免费' : `¥${b.price.toFixed(2)}`}
                  </span>
                  <div className="biography-shelf-card-actions">
                    <button
                      className="biography-shelf-icon-btn"
                      onClick={(e) => { e.stopPropagation(); handleLike(b.id); }}
                      title="点赞"
                    >
                      <Heart size={12} /> {b.likes}
                    </button>
                    <button
                      className="biography-shelf-icon-btn"
                      onClick={(e) => { e.stopPropagation(); handleCollect(b.id); }}
                      title="收藏"
                    >
                      <Bookmark size={12} /> {b.collects}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
