import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  Circle,
  X,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { biographerApi } from '../api/biographer';
import { loadJson, saveJson } from '../data/aiMock';
import type { BiographerOrder } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './BiographerWorks.css';

interface WorkChapter {
  id: string;
  title: string;
  content: string;
  /** done = 已完成（手动标记）；有内容未标记 = 撰写中；无内容 = 未撰写 */
  done: boolean;
  updatedAt: string | null;
}

type ChapterStatus = 'empty' | 'draft' | 'done';

const chapterStatusMap: Record<ChapterStatus, { label: string; className: string }> = {
  empty: { label: '未撰写', className: 'work-chapter-status empty' },
  draft: { label: '撰写中', className: 'work-chapter-status draft' },
  done: { label: '已完成', className: 'work-chapter-status done' },
};

const sampleChapterTitles = ['故里童年 · 初心萌芽', '求学成长 · 岁月积淀', '择业入行 · 缘起初心', '深耕岁月 · 历练成长', '风雨磨砺 · 破局成长', '行业感悟 · 职业修为', '家风人生 · 温情生活', '人生回望 · 未来愿景'];

const sampleParagraphs: Record<string, string> = {
  '故里童年 · 初心萌芽': '主人公出生于江南水乡的一个普通家庭，家中兄妹五人，他排行老三。\n\n童年的记忆里，最深刻的是村口的那棵大樟树。夏天傍晚，父亲收工回来，总会在树下给他讲旧时的故事。母亲则在灶间忙碌，饭菜的香气混着蝉鸣，成为他一生难忘的画面。\n\n家境虽不富裕，父母却坚持让几个孩子都念书。"再穷不能穷教育"，这是父亲常挂在嘴边的话。',
  '求学成长 · 岁月积淀': '恢复高考那年，他正在镇上的中学读书。\n\n每天清晨五点起床，点着煤油灯复习功课。冬天手脚生满冻疮，笔尖冻得握不住，就搓一搓继续写。两年后，他如愿考上了省城的大学，成为全村第一个大学生。\n\n离家那天，母亲往他的行李里塞了一包炒米和十个煮鸡蛋，送他到村口，一句话也没说。',
  '择业入行 · 缘起初心': '毕业分配时，他放弃了去机关的机会，主动要求到工厂一线。\n\n"机器不会骗人"，这是他入行时师傅教的第一句话，也成了他此后几十年的职业信条。',
};

function chapterStatus(c: WorkChapter): ChapterStatus {
  if (c.done) return 'done';
  return c.content.trim() ? 'draft' : 'empty';
}

function workStorageKey(orderId: string) {
  return `cj_biographer_work_${orderId}`;
}

function genId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedChapters(): WorkChapter[] {
  return sampleChapterTitles.map((title, i) => ({
    id: genId(),
    title,
    content: sampleParagraphs[title] || '',
    done: false,
    updatedAt: sampleParagraphs[title] ? new Date(Date.now() - (i + 1) * 86400000).toISOString() : null,
  }));
}

/** 演示用 AI 润色：对正文做一组保守的文字替换 */
function mockPolish(text: string): string {
  const replacements: [RegExp, string][] = [
    [/非常/g, '十分'],
    [/特别/g, '格外'],
    [/很多/g, '诸多'],
    [/时候/g, '时刻'],
  ];
  let result = text;
  replacements.forEach(([pattern, to]) => {
    result = result.replace(pattern, to);
  });
  return result;
}

export default function BiographerWorks() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<BiographerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState('');
  const [chapters, setChapters] = useState<WorkChapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState('');
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [renaming, setRenaming] = useState<WorkChapter | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<WorkChapter | null>(null);

  // 加载某订单的传记章节（无则按模板初始化）
  const selectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    const loaded = loadJson<WorkChapter[]>(workStorageKey(orderId), seedChapters());
    setChapters(loaded);
    setActiveChapterId(loaded[0]?.id || '');
  };

  useEffect(() => {
    biographerApi
      .myOrders()
      .then((list) => {
        // 进行中的订单才有传记可修改
        const editable = list.filter((o) => !['completed', 'after_sales'].includes(o.status));
        setOrders(editable);
        if (editable.length > 0) selectOrder(editable[0].id);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const activeOrder = orders.find((o) => o.id === activeOrderId);
  const activeChapter = chapters.find((c) => c.id === activeChapterId) || null;
  const totalWords = useMemo(
    () => chapters.reduce((sum, c) => sum + c.content.replace(/\s/g, '').length, 0),
    [chapters],
  );

  const persist = (next: WorkChapter[]) => {
    setChapters(next);
    saveJson(workStorageKey(activeOrderId), next);
  };

  const updateChapter = (id: string, patch: Partial<WorkChapter>) => {
    persist(chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const handleSave = () => {
    if (!activeChapter) return;
    setSaving(true);
    updateChapter(activeChapter.id, { updatedAt: new Date().toISOString() });
    window.setTimeout(() => {
      setSaving(false);
      addToast('已保存', 'success');
    }, 300);
  };

  const handlePolish = () => {
    if (!activeChapter || !activeChapter.content.trim()) {
      addToast('请先撰写正文内容', 'error');
      return;
    }
    setPolishing(true);
    window.setTimeout(() => {
      updateChapter(activeChapter.id, {
        content: mockPolish(activeChapter.content),
        updatedAt: new Date().toISOString(),
      });
      setPolishing(false);
      addToast('AI 润色完成，已更新正文（演示环境为模拟润色）', 'success');
    }, 1200);
  };

  const addChapter = () => {
    const chapter: WorkChapter = { id: genId(), title: `新章节 ${chapters.length + 1}`, content: '', done: false, updatedAt: null };
    persist([...chapters, chapter]);
    setActiveChapterId(chapter.id);
  };

  const moveChapter = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= chapters.length) return;
    const next = [...chapters];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  };

  const openRename = (chapter: WorkChapter) => {
    setRenaming(chapter);
    setRenameValue(chapter.title);
  };

  const handleRename = () => {
    if (!renaming) return;
    const value = renameValue.trim();
    if (!value) {
      addToast('章节标题不能为空', 'error');
      return;
    }
    updateChapter(renaming.id, { title: value });
    setRenaming(null);
    addToast('章节已重命名', 'success');
  };

  const handleDelete = () => {
    if (!deleting) return;
    const next = chapters.filter((c) => c.id !== deleting.id);
    persist(next);
    if (activeChapterId === deleting.id) setActiveChapterId(next[0]?.id || '');
    setDeleting(null);
    addToast('章节已删除', 'success');
  };

  if (loading) {
    return (
      <div className="biographer-works-page">
        <header className="page-header"><h1 className="page-title">传记修改</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  return (
    <div className="biographer-works-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">传记修改</h1>
          <p className="page-subtitle">选择进行中的订单，撰写和修改传记章节内容</p>
        </div>
        {activeOrder && (
          <div className="work-order-picker">
            <BookOpen size={15} />
            <select value={activeOrderId} onChange={(e) => selectOrder(e.target.value)}>
              {orders.map((o) => (
                <option value={o.id} key={o.id}>{o.serviceName} · {o.customerName || o.userId}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {orders.length === 0 ? (
        <div className="card"><div className="card-body"><div className="admin-table-empty">暂无进行中的传记订单</div></div></div>
      ) : (
        <div className="work-layout">
          <Annotate id="biographer-works.chapters">
          <div className="card work-chapters-card">
            <div className="card-header">
              <h3 className="card-title">章节目录（{chapters.length}）</h3>
              <button className="btn btn-outline btn-sm" onClick={addChapter}><Plus size={14} /> 新增章节</button>
            </div>
            <div className="card-body work-chapters-body">
              {chapters.map((chapter, index) => {
                const status = chapterStatus(chapter);
                return (
                  <div
                    className={`work-chapter-item ${chapter.id === activeChapterId ? 'active' : ''}`}
                    key={chapter.id}
                    onClick={() => setActiveChapterId(chapter.id)}
                  >
                    <span className="work-chapter-index">{index + 1}</span>
                    <div className="work-chapter-info">
                      <div className="work-chapter-title">{chapter.title}</div>
                      <span className={chapterStatusMap[status].className}>
                        {status === 'done' ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                        {chapterStatusMap[status].label}
                      </span>
                    </div>
                    <div className="work-chapter-actions" onClick={(e) => e.stopPropagation()}>
                      <button title="上移" disabled={index === 0} onClick={() => moveChapter(index, -1)}><ArrowUp size={13} /></button>
                      <button title="下移" disabled={index === chapters.length - 1} onClick={() => moveChapter(index, 1)}><ArrowDown size={13} /></button>
                      <button title="重命名" onClick={() => openRename(chapter)}><Pencil size={13} /></button>
                      <button title="删除" className="danger" onClick={() => setDeleting(chapter)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </Annotate>

          <Annotate id="biographer-works.editor">
          <div className="card work-editor-card">
            {activeChapter ? (
              <>
                <div className="card-header work-editor-header">
                  <input
                    className="work-editor-title"
                    value={activeChapter.title}
                    onChange={(e) => updateChapter(activeChapter.id, { title: e.target.value })}
                    placeholder="章节标题"
                  />
                  <span className="work-editor-words">
                    本章 {activeChapter.content.replace(/\s/g, '').length} 字 · 全书 {totalWords} 字
                    {activeChapter.updatedAt && ` · 更新于 ${new Date(activeChapter.updatedAt).toLocaleString()}`}
                  </span>
                </div>
                <div className="card-body work-editor-body">
                  <textarea
                    className="work-editor-textarea"
                    value={activeChapter.content}
                    onChange={(e) => updateChapter(activeChapter.id, { content: e.target.value, done: false })}
                    placeholder="在这里撰写本章节内容…"
                  />
                </div>
                <div className="work-editor-footer">
                  <button
                    className="btn btn-outline"
                    disabled={polishing}
                    onClick={handlePolish}
                  >
                    <Sparkles size={14} /> {polishing ? '润色中…' : 'AI 润色'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => updateChapter(activeChapter.id, { done: !activeChapter.done, updatedAt: new Date().toISOString() })}
                  >
                    <CheckCircle2 size={14} /> {activeChapter.done ? '取消完成标记' : '标记为已完成'}
                  </button>
                  <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                    <Save size={14} /> {saving ? '保存中…' : '保存'}
                  </button>
                </div>
              </>
            ) : (
              <div className="card-body"><div className="admin-table-empty">请选择或新增一个章节</div></div>
            )}
          </div>
          </Annotate>
        </div>
      )}

      {renaming && (
        <div className="modal-overlay" onClick={() => setRenaming(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>重命名章节</h4>
              <button className="modal-close" onClick={() => setRenaming(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <input
                className="work-modal-input"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                placeholder="请输入章节标题"
              />
              <div className="work-modal-actions">
                <button className="btn btn-outline" onClick={() => setRenaming(null)}>取消</button>
                <button className="btn btn-primary" onClick={handleRename}>确定</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>删除章节</h4>
              <button className="modal-close" onClick={() => setDeleting(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p className="work-modal-hint">确定删除章节「{deleting.title}」吗？章节内容将一并删除，且无法恢复。</p>
              <div className="work-modal-actions">
                <button className="btn btn-outline" onClick={() => setDeleting(null)}>取消</button>
                <button className="btn btn-danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
