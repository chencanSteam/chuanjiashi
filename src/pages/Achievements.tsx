import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Plus, Trash2, Eye, EyeOff, Pencil, Paperclip, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { uploadFile } from '../api/client';
import Modal from '../components/ui/Modal';
import './Achievements.css';

interface AchievementMaterial {
  name: string;
  url: string;
}

interface AchievementItem {
  id: number;
  title: string;
  year: string;
  category: string;
  desc: string;
  public: boolean;
  materials: AchievementMaterial[];
}

const categories = ['事业', '荣誉', '公益', '作品', '其他'];

const defaultAchievements: AchievementItem[] = [
  { id: 1, title: '创立明远机械有限公司', year: '1992', category: '事业', desc: '从国营厂辞职下海，与伙伴共同创业。', public: true, materials: [{ name: '创业初期厂房.jpg', url: '' }] },
  { id: 2, title: '获评市劳动模范', year: '2005', category: '荣誉', desc: '因技术创新与诚信经营获得市级表彰。', public: true, materials: [{ name: '劳动模范证书.pdf', url: '' }] },
  { id: 3, title: '资助乡村小学图书馆', year: '2015', category: '公益', desc: '为家乡小学捐赠图书与阅览设备。', public: false, materials: [] },
];

function storageKey(): string {
  const archiveId = localStorage.getItem('cj_current_archive_id') || 'default';
  return `cj_achievements_${archiveId}`;
}

function loadAchievements(): AchievementItem[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw) as AchievementItem[];
  } catch {
    // ignore
  }
  return defaultAchievements;
}

export default function Achievements() {
  const { addToast } = useToast();
  const [items, setItems] = useState<AchievementItem[]>(() => loadAchievements());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AchievementItem | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('事业');
  const [desc, setDesc] = useState('');
  const [materials, setMaterials] = useState<AchievementMaterial[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // 按时间升序排列，与人生时间轴一致
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0)),
    [items],
  );

  const openAdd = () => {
    setEditing(null);
    setTitle('');
    setYear('');
    setCategory('事业');
    setDesc('');
    setMaterials([]);
    setShowModal(true);
  };

  const openEdit = (item: AchievementItem) => {
    setEditing(item);
    setTitle(item.title);
    setYear(item.year);
    setCategory(item.category);
    setDesc(item.desc);
    setMaterials([...item.materials]);
    setShowModal(true);
  };

  const handleUploadMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const list = await uploadFile([file]);
      setMaterials((prev) => [...prev, { name: file.name, url: list[0]?.url || '' }]);
    } catch {
      // 上传失败时仍记录材料名称，不阻塞表单
      setMaterials((prev) => [...prev, { name: file.name, url: '' }]);
    } finally {
      setUploading(false);
    }
  };

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim() || !year.trim()) {
      addToast('请填写标题与年份', 'error');
      return;
    }
    if (editing) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? { ...item, title: title.trim(), year: year.trim(), category, desc: desc.trim(), materials }
            : item,
        ),
      );
      addToast('成就已更新', 'success');
    } else {
      setItems((prev) => [
        ...prev,
        { id: Date.now(), title: title.trim(), year: year.trim(), category, desc: desc.trim(), public: false, materials },
      ]);
      addToast('成就已添加', 'success');
    }
    setShowModal(false);
  };

  const togglePublic = (id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, public: !item.public } : item)));
    addToast('公开状态已更新', 'success');
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
    addToast('已删除', 'info');
  };

  // 详情页直接上传材料到当前成就
  const handleUploadToSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || selectedId === null) return;
    try {
      const list = await uploadFile([file]);
      addMaterialToSelected({ name: file.name, url: list[0]?.url || '' });
    } catch {
      addMaterialToSelected({ name: file.name, url: '' });
    }
  };

  const addMaterialToSelected = (material: AchievementMaterial) => {
    if (selectedId === null) return;
    setItems((prev) => prev.map((item) => (item.id === selectedId ? { ...item, materials: [...item.materials, material] } : item)));
    addToast('材料已上传', 'success');
  };

  const removeMaterialFromSelected = (index: number) => {
    if (selectedId === null) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, materials: item.materials.filter((_, i) => i !== index) } : item,
      ),
    );
  };

  // 默认选中第一条
  const selected = sortedItems.find((item) => item.id === selectedId) || sortedItems[0] || null;

  return (
    <div className="achievements-page">
      <div className="achievement-layout">
        <div className="card achievement-list-card">
          <div className="card-header">
            <h3 className="card-title"><Trophy size={16} /> 成就与作品</h3>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> 新增成就</button>
          </div>
          <div className="card-body">
            {sortedItems.length === 0 ? (
              <div className="achievement-empty">暂无成就记录，点击右上角「新增成就」开始记录</div>
            ) : (
              <div className="achievement-list">
                {sortedItems.map((item) => (
                  <button
                    type="button"
                    className={`achievement-item ${selected?.id === item.id ? 'active' : ''}`}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className={`achievement-dot ${item.category}`} />
                    <span className="achievement-item-year">{item.year}</span>
                    <span className="achievement-item-title">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card achievement-detail-card">
          <div className="card-header">
            <h3 className="card-title">成就详情</h3>
            {selected && (
              <button className="btn btn-outline btn-sm" onClick={() => openEdit(selected)}>
                <Pencil size={13} /> 编辑成就
              </button>
            )}
          </div>
          <div className="card-body">
            {!selected ? (
              <div className="achievement-empty">暂无成就，先从左侧新增一条</div>
            ) : (
              <>
                <div className="achievement-detail-year">{selected.year} 年</div>
                <div className="achievement-detail-title">
                  {selected.title}
                  <span className={`achievement-category ${selected.category}`}>{selected.category}</span>
                </div>
                <p className="achievement-detail-desc">{selected.desc || '暂无描述'}</p>

                <div className="achievement-detail-materials">
                  <label className="achievement-upload-btn">
                    <Plus size={14} /> 上传证明材料
                    <input type="file" hidden onChange={handleUploadToSelected} />
                  </label>
                  {selected.materials.length > 0 && (
                    <div className="achievement-materials">
                      {selected.materials.map((m, i) => (
                        <span className="achievement-material" key={i} title={m.name}>
                          <Paperclip size={11} /> {m.name}
                          <button type="button" onClick={() => removeMaterialFromSelected(i)} aria-label="移除材料"><X size={11} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="achievement-detail-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => togglePublic(selected.id)}>
                    {selected.public ? <Eye size={13} /> : <EyeOff size={13} />} {selected.public ? '公开' : '私密'}
                  </button>
                  <button className="btn btn-ghost btn-sm achievement-detail-delete" onClick={() => removeItem(selected.id)}>
                    <Trash2 size={13} /> 删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        title={editing ? '编辑成就' : '新增成就'}
        onClose={() => setShowModal(false)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn btn-primary" disabled={uploading} onClick={handleSubmit}>{editing ? '保存修改' : '添加'}</button>
          </div>
        }
      >
        <div className="achievement-form">
          <div className="form-row">
            <label>荣誉标题 <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="text" placeholder="如：获评市劳动模范" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-row">
            <label>年份 <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="text" placeholder="如：2005" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="form-row">
            <label>分类</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>描述</label>
            <textarea placeholder="简要描述这项成就或作品" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="form-row">
            <label>证明材料</label>
            <div className="achievement-material-upload">
              {materials.map((m, i) => (
                <span className="achievement-material" key={i}>
                  <Paperclip size={11} /> {m.name}
                  <button type="button" onClick={() => removeMaterial(i)} aria-label="移除材料"><X size={11} /></button>
                </span>
              ))}
              <button type="button" className="btn btn-outline btn-sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <Plus size={13} /> {uploading ? '上传中…' : '上传材料'}
              </button>
              <input ref={fileInputRef} type="file" hidden onChange={handleUploadMaterial} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
