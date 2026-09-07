import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { sensitiveWordsApi } from '../api/sensitiveWords';
import type { SensitiveHit, SensitiveHitSourceType, SensitiveHitStatus, SensitiveWordCategory } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './SensitiveHits.css';

const categoryMap: Record<SensitiveWordCategory, { label: string; className: string }> = {
  politics: { label: '政治敏感', className: 'sh-badge cat-politics' },
  porn: { label: '色情低俗', className: 'sh-badge cat-porn' },
  violence: { label: '暴力恐怖', className: 'sh-badge cat-violence' },
  ads: { label: '广告营销', className: 'sh-badge cat-ads' },
  abuse: { label: '人身攻击', className: 'sh-badge cat-abuse' },
  custom: { label: '自定义', className: 'sh-badge cat-custom' },
};

const sourceTypeMap: Record<SensitiveHitSourceType, string> = {
  biography_chapter: '传记章节',
  museum_message: '数字馆留言',
  interview_text: '采访转写',
  comment: '用户评论',
};

const statusMap: Record<SensitiveHitStatus, { label: string; className: string }> = {
  pending: { label: '待复核', className: 'sh-status pending' },
  blocked: { label: '已拦截', className: 'sh-status blocked' },
  released: { label: '已放行', className: 'sh-status released' },
};

const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { hour12: false });

/** 把上下文里的命中词用 <mark> 高亮 */
function highlightContext(context: string, word: string): ReactNode {
  if (!word || !context.includes(word)) return context;
  const parts = context.split(word);
  return parts.flatMap((part, i) =>
    i === 0 ? [part] : [<mark key={i}>{word}</mark>, part],
  );
}

export default function SensitiveHits() {
  const { addToast } = useToast();
  const [hits, setHits] = useState<SensitiveHit[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | SensitiveHitStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | SensitiveHitSourceType>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    sensitiveWordsApi
      .hitList()
      .then((list) => setHits(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => setHits([]));
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return hits.filter((h) => {
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && h.sourceType !== sourceFilter) return false;
      if (kw && !h.word.includes(kw) && !h.sourceTitle.includes(kw) && !h.context.includes(kw)) return false;
      return true;
    });
  }, [hits, statusFilter, sourceFilter, keyword]);

  const handleProcess = async (hit: SensitiveHit, status: 'blocked' | 'released') => {
    const actionLabel = status === 'blocked' ? '拦截' : '放行';
    if (!window.confirm(`确定要${actionLabel}该条命中内容吗？`)) return;
    try {
      const updated = await sensitiveWordsApi.processHit(hit.id, status);
      setHits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      addToast(status === 'blocked' ? '内容已拦截' : '内容已放行', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  return (
    <div className="sensitive-hits-page">
      <header className="page-header">
        <h1 className="page-title">敏感词命中</h1>
      </header>

      <div className="card sh-list-card">
        <div className="card-header sh-list-header">
          <Annotate id="sensitive-hits.filter">
          <div className="sh-filters">
            <div className="sh-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索命中词、来源、上下文…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">全部状态</option>
              <option value="pending">待复核</option>
              <option value="blocked">已拦截</option>
              <option value="released">已放行</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}>
              <option value="all">全部来源</option>
              {(Object.keys(sourceTypeMap) as SensitiveHitSourceType[]).map((key) => (
                <option value={key} key={key}>{sourceTypeMap[key]}</option>
              ))}
            </select>
          </div>
          </Annotate>
        </div>
        <div className="card-body sh-list-body">
          {filtered.length === 0 ? (
            <div className="admin-table-empty">暂无命中记录</div>
          ) : (
            <Annotate id="sensitive-hits.table">
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>命中词</th>
                  <th>分类</th>
                  <th>来源类型</th>
                  <th>来源内容</th>
                  <th>命中上下文</th>
                  <th>提交用户</th>
                  <th>命中时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {filtered.map((hit) => (
                <tr key={hit.id}>
                  <td><span className="sh-word"><ShieldAlert size={12} />{hit.word}</span></td>
                  <td><span className={categoryMap[hit.category].className}>{categoryMap[hit.category].label}</span></td>
                  <td>{sourceTypeMap[hit.sourceType]}</td>
                  <td className="admin-table-text-left sh-source">{hit.sourceTitle}</td>
                  <td className="admin-table-text-left sh-context">{highlightContext(hit.context, hit.word)}</td>
                  <td>{hit.userName}</td>
                  <td>{formatTime(hit.createdAt)}</td>
                  <td><span className={statusMap[hit.status].className}>{statusMap[hit.status].label}</span></td>
                  <td>
                    {hit.status === 'pending' ? (
                      <>
                        <button className="admin-table-link" onClick={() => handleProcess(hit, 'released')}>放行</button>
                        <button className="admin-table-link danger" onClick={() => handleProcess(hit, 'blocked')}>拦截</button>
                      </>
                    ) : (
                      <span className="admin-table-muted">已处理</span>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
            </div>
            </Annotate>
          )}
        </div>
      </div>
    </div>
  );
}
