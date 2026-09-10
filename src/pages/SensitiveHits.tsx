import { useMemo, useState, type ReactNode } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { useToast } from '../hooks/useToast';
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
  biography_chapter: '上架传记',
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

const mockHits: SensitiveHit[] = [
  { id: 'hit-001', wordId: 'word-001', word: '加微信', category: 'ads', action: 'review', sourceType: 'biography_chapter', sourceTitle: '传记《张明远：一位苏州企业家的六十年》第2章', context: '那几年生意刚有起色，来找我的人渐渐多了。有位年轻人递给我一张名片，说以后有事可以加微信联系，我当时还不太会用智能手机，只好请女儿教了我半天。', userId: 'u_demo_001', userName: '张明远', status: 'pending', createdAt: '2026-09-08T13:04:12' },
  { id: 'hit-002', wordId: 'word-002', word: '颠覆国家政权', category: 'politics', action: 'block', sourceType: 'biography_chapter', sourceTitle: '传记《我的母亲周秀英》第4章', context: '母亲年轻时在村里的黑板报上抄过一段旧文章，里面有“颠覆国家政权”几个字。她不明白其中的意思，只记得那天回家很晚，外祖父一直站在门口等她。', userId: 'u_demo_004', userName: '周国强', status: 'blocked', processorId: 'admin_demo', processedAt: '2026-09-08T12:02:35', createdAt: '2026-09-08T11:04:12' },
  { id: 'hit-003', wordId: 'word-003', category: 'violence', word: '暴力', action: 'review', sourceType: 'biography_chapter', sourceTitle: '传记《铁血芳华：老兵陈建国》第3章', context: '那场冲突来得突然，街角传来一阵喧闹，我第一次真正见识到暴力带给人的恐惧。后来我们把受伤的乡亲抬回屋里，整整一夜没有人敢点灯。', userId: 'u_demo_005', userName: '陈志远', status: 'pending', createdAt: '2026-09-08T08:04:12' },
  { id: 'hit-004', wordId: 'word-004', word: '微商代理', category: 'ads', action: 'review', sourceType: 'biography_chapter', sourceTitle: '传记《匠心五十年：木匠徐长顺》第1章', context: '女儿毕业后没有进厂，先跟朋友做了一段时间微商代理。她每天对着手机发图片，我嘴上说不懂，心里却替她担心，怕这条路走得太辛苦。', userId: 'u_demo_006', userName: '徐晓东', status: 'pending', createdAt: '2026-09-07T16:04:12' },
  { id: 'hit-005', wordId: 'word-005', word: '老不死', category: 'abuse', action: 'block', sourceType: 'biography_chapter', sourceTitle: '传记《医者仁心：李华亭回忆录》第5章', context: '病房里，一个年轻人因为父亲不肯配合治疗，脱口骂了一句“老不死”。我把他叫到门外，告诉他老人家听得见，也最怕听见的就是这句话。', userId: 'u_demo_003', userName: '李文静', status: 'blocked', processorId: 'admin_demo', processedAt: '2026-09-07T15:21:40', createdAt: '2026-09-07T14:04:12' },
  { id: 'hit-006', wordId: 'word-006', word: '自杀', category: 'violence', action: 'review', sourceType: 'biography_chapter', sourceTitle: '传记《山村教师王桂芬》第3章', context: '最难的那几年，我曾经动过自杀的念头。是讲台上那几十双眼睛把我留了下来，他们等着我把课讲完，也等着我陪他们走出大山。', userId: 'u_demo_002', userName: '王建华', status: 'released', processorId: 'admin_demo', processedAt: '2026-09-07T12:30:16', createdAt: '2026-09-06T16:04:12' },
  { id: 'hit-007', wordId: 'word-007', word: '代办信用卡', category: 'ads', action: 'block', sourceType: 'biography_chapter', sourceTitle: '传记《南海沉浮：民营企业家吴国栋》第6章', context: '厂子资金最紧张的时候，门口贴满了“代办信用卡”的小广告。那张纸被海风吹得卷了边，我看了很久，最后还是把它撕下来扔进了垃圾桶。', userId: 'u_demo_010', userName: '吴晓波', status: 'blocked', processorId: 'admin_demo', processedAt: '2026-09-06T17:12:05', createdAt: '2026-09-06T16:04:12' },
  { id: 'hit-008', wordId: 'word-008', word: '台独', category: 'politics', action: 'review', sourceType: 'biography_chapter', sourceTitle: '传记《退伍老兵访谈录》第2章', context: '电视里谈到两岸关系时，老班长拍了拍桌子，说自己这一辈子最不能接受的，就是有人拿“台独”来割裂一家人的感情。', userId: 'u_demo_005', userName: '陈志远', status: 'released', processorId: 'admin_demo', processedAt: '2026-09-05T16:20:14', createdAt: '2026-09-04T16:04:12' },
  { id: 'hit-009', wordId: 'word-009', word: '色情视频', category: 'porn', action: 'block', sourceType: 'biography_chapter', sourceTitle: '传记《我的母亲周秀英》第7章', context: '那时村里刚装上网络，几个孩子偷偷围在网吧角落看色情视频。母亲发现后没有打骂，只把他们一个个叫回家，讲了整整一晚做人的道理。', userId: 'u_demo_004', userName: '周国强', status: 'blocked', processorId: 'admin_demo', processedAt: '2026-09-03T10:12:50', createdAt: '2026-09-02T16:04:12' },
];

function highlightHitWord(context: string, word: string): ReactNode {
  if (!word || !context.includes(word)) return context;
  const parts = context.split(word);
  return parts.flatMap((part, index) => index === 0 ? [part] : [<mark key={`${word}-${index}`}>{word}</mark>, part]);
}

export default function SensitiveHits() {
  const { addToast } = useToast();
  const [hits, setHits] = useState<SensitiveHit[]>(mockHits);
  const [statusFilter, setStatusFilter] = useState<'all' | SensitiveHitStatus>('all');
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return hits.filter((h) => {
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (kw && !h.word.includes(kw) && !h.sourceTitle.includes(kw) && !h.context.includes(kw)) return false;
      return true;
    });
  }, [hits, statusFilter, keyword]);

  const handleProcess = async (hit: SensitiveHit, status: 'blocked' | 'released') => {
    const actionLabel = status === 'blocked' ? '拦截' : '放行';
    if (!window.confirm(`确定要${actionLabel}该条命中内容吗？`)) return;
    const updated = { ...hit, status, processorId: 'admin_demo', processedAt: new Date().toISOString() };
    setHits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    addToast(status === 'blocked' ? '内容已拦截' : '内容已放行', 'success');
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
                  <td className="admin-table-text-left sh-context">{highlightHitWord(hit.context, hit.word)}</td>
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
