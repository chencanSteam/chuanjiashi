import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Plus, BookOpen, Search, Trash2, Edit3, Wand2 } from 'lucide-react';
import './StoryLibrary.css';

const initialStories = [
  { id: 1, title: '祖父的木工箱', author: '张明远', date: '2024-05-20', status: '已发布' },
  { id: 2, title: '母亲的年夜饭', author: '李晓如', date: '2024-04-18', status: '已发布' },
  { id: 3, title: '父亲的诚信账簿', author: '张子涵', date: '2024-03-12', status: '草稿' },
  { id: 4, title: '奶奶的手工鞋', author: '张雨桐', date: '2024-02-28', status: '已发布' },
];

export default function StoryLibrary() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stories, setStories] = useState(initialStories);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');

  const filtered = stories.filter((s) => s.title.includes(search) || s.author.includes(search));

  const addStory = () => {
    if (!newTitle.trim()) {
      addToast('请输入故事标题', 'error');
      return;
    }
    setStories((prev) => [{ id: Date.now(), title: newTitle.trim(), author: newAuthor.trim() || '佚名', date: new Date().toISOString().slice(0, 10), status: '草稿' }, ...prev]);
    setNewTitle('');
    setNewAuthor('');
    setShowAdd(false);
    addToast('故事已添加', 'success');
  };

  const removeStory = (id: number) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
    addToast('已删除', 'info');
  };

  const polish = (id: number) => {
    setProcessing(id);
    addToast('AI 扩写润色中…', 'info');
    setTimeout(() => {
      setStories((prev) => prev.map((s) => s.id === id ? { ...s, title: s.title.replace(/(?:）|\))?$/, '（已润色）') } : s));
      setProcessing(null);
      addToast('润色完成', 'success');
    }, 1200);
  };

  return (
    <div className="detail-page story-library-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/family-hall')}><ArrowLeft size={16} /> 返回</button>
        <h1 className="page-title"><BookOpen size={20} /> 家风故事库</h1>
      </header>

      <div className="card">
        <div className="card-header story-library-header">
          <div className="story-search">
            <Search size={14} />
            <input type="text" placeholder="搜索故事标题或作者" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 新增故事</button>
        </div>
        <div className="card-body story-library-body">
          {showAdd && (
            <div className="story-add-row">
              <input type="text" placeholder="故事标题" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <input type="text" placeholder="作者" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} />
              <button className="btn btn-primary" onClick={addStory}>添加</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
            </div>
          )}
          {filtered.map((s) => (
            <div className="story-library-item" key={s.id}>
              {editing === s.id ? (
                <div className="story-edit-row">
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <input type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} />
                  <button className="btn btn-primary" onClick={() => { setStories((prev) => prev.map((x) => x.id === s.id ? { ...x, title: editTitle.trim() || x.title, author: editAuthor.trim() || x.author } : x)); setEditing(null); addToast('故事已更新', 'success'); }}>保存</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(null)}>取消</button>
                </div>
              ) : (
                <>
                  <div className="story-library-info">
                    <div className="story-library-title">{s.title}</div>
                    <div className="story-library-meta">
                      <span>{s.author}</span>
                      <span>{s.date}</span>
                      <span className={`story-status ${s.status === '已发布' ? 'published' : 'draft'}`}>{s.status}</span>
                    </div>
                  </div>
                  <div className="story-library-actions">
                    <button className="btn btn-outline" disabled={processing === s.id} onClick={() => polish(s.id)}><Wand2 size={13} /> {processing === s.id ? '润色中…' : 'AI润色'}</button>
                    <button className="icon-btn" onClick={() => { setEditing(s.id); setEditTitle(s.title); setEditAuthor(s.author); }}><Edit3 size={14} /></button>
                    <button className="hall-item-delete" onClick={() => removeStory(s.id)}><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="story-library-empty">未找到相关故事</div>}
        </div>
      </div>
    </div>
  );
}
