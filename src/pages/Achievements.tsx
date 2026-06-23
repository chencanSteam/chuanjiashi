import { useState } from 'react';
import { Trophy, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './Achievements.css';

const initialAchievements = [
  { id: 1, title: '创立明远机械有限公司', year: '1992', category: '事业', desc: '从国营厂辞职下海，与伙伴共同创业。', public: true },
  { id: 2, title: '获评市劳动模范', year: '2005', category: '荣誉', desc: '因技术创新与诚信经营获得市级表彰。', public: true },
  { id: 3, title: '资助乡村小学图书馆', year: '2015', category: '公益', desc: '为家乡小学捐赠图书与阅览设备。', public: false },
];

const categories = ['事业', '荣誉', '公益', '作品', '其他'];

export default function Achievements() {
  const { addToast } = useToast();
  const [items, setItems] = useState(initialAchievements);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('事业');
  const [desc, setDesc] = useState('');

  const addItem = () => {
    if (!title.trim() || !year.trim()) {
      addToast('请填写标题与年份', 'error');
      return;
    }
    setItems((prev) => [{ id: Date.now(), title: title.trim(), year: year.trim(), category, desc: desc.trim(), public: false }, ...prev]);
    setTitle('');
    setYear('');
    setDesc('');
    setCategory('事业');
    setShowAdd(false);
    addToast('成就已添加', 'success');
  };

  const togglePublic = (id: number) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, public: !item.public } : item));
    addToast('公开状态已更新', 'success');
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    addToast('已删除', 'info');
  };

  return (
    <div className="achievements-page">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Trophy size={16} /> 成就与作品</h3>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 新增成就</button>
        </div>
        <div className="card-body">
          {showAdd && (
            <div className="achievement-add">
              <input type="text" placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input type="text" placeholder="年份" value={year} onChange={(e) => setYear(e.target.value)} />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <textarea placeholder="简介" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
              <div className="achievement-add-actions">
                <button className="btn btn-primary" onClick={addItem}>添加</button>
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
              </div>
            </div>
          )}
          <div className="achievement-list">
            {items.map((item) => (
              <div className="achievement-item" key={item.id}>
                <div className="achievement-year">{item.year}</div>
                <div className="achievement-main">
                  <div className="achievement-title">
                    {item.title}
                    <span className={`achievement-category ${item.category}`}>{item.category}</span>
                  </div>
                  <div className="achievement-desc">{item.desc}</div>
                </div>
                <div className="achievement-actions">
                  <button className="btn btn-ghost" onClick={() => togglePublic(item.id)}>
                    {item.public ? <Eye size={13} /> : <EyeOff size={13} />} {item.public ? '公开' : '私密'}
                  </button>
                  <button className="hall-item-delete" onClick={() => removeItem(item.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
