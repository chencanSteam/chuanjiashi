import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Save, Eye, Image } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { biographerApi } from '../api/biographer';
import { uploadFile } from '../api/client';
import type { Biographer as MockBiographer } from '../mocks/types';
import './BiographerProfileEdit.css';

export default function BiographerProfileEdit() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<MockBiographer>>({});
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const caseInputRef = useRef<HTMLInputElement>(null);
  const [editingCaseIndex, setEditingCaseIndex] = useState<number | null>(null);

  useEffect(() => {
    biographerApi
      .me()
      .then((b) => {
        setForm({
          ...b,
          serviceAreas: b.serviceAreas || [b.city || ''],
          certificates: b.certificates || [],
          tags: b.tags || [],
          specialties: b.specialties || [],
        });
      })
      .catch(() => setForm({}))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const list = await uploadFile([file]);
      setForm((f) => ({ ...f, avatar: list[0].url }));
    } catch {
      addToast('头像上传失败', 'error');
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const list = await uploadFile(Array.from(files));
      setForm((f) => ({ ...f, certificates: [...(f.certificates || []), ...list.map((i) => i.url)] }));
    } catch {
      addToast('证明上传失败', 'error');
    }
  };

  const removeCert = (idx: number) => {
    setForm((f) => ({ ...f, certificates: (f.certificates || []).filter((_, i) => i !== idx) }));
  };

  const addTag = (field: 'specialties' | 'serviceAreas' | 'tags', value: string, setter: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setForm((f) => ({ ...f, [field]: [...(f[field] || []), trimmed] }));
    setter('');
  };

  const removeTag = (field: 'specialties' | 'serviceAreas' | 'tags', idx: number) => {
    setForm((f) => ({ ...f, [field]: (f[field] || []).filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      addToast('请填写姓名和手机号', 'error');
      return;
    }
    setSaving(true);
    try {
      await biographerApi.updateProfile(form);
      addToast('资料已保存', 'success');
      navigate('/biographer/profile');
    } catch (err: any) {
      addToast(err.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="partner-center-page"><div className="card"><div className="card-body">加载中...</div></div></div>;
  }

  const avatarContent = form.avatar ? (
    <img src={form.avatar} alt="头像" />
  ) : (
    (form.name || '传').charAt(0)
  );

  return (
    <div className="biographer-edit-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">编辑资料</h1>
        <button className="btn btn-outline" onClick={() => navigate('/biographer/profile')}>
          <Eye size={14} /> 预览介绍页
        </button>
      </header>

      <div className="biographer-edit-section">
        <div className="biographer-edit-avatar">
          <div className="biographer-edit-avatar-preview">{avatarContent}</div>
          <div className="biographer-edit-avatar-actions">
            <button className="btn btn-outline" onClick={() => avatarInputRef.current?.click()}>
              <Upload size={14} /> 上传头像
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>建议尺寸 400x400</span>
          </div>
        </div>
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">基本信息</h3>
        <div className="biographer-edit-row">
          <div className="biographer-edit-field">
            <label>姓名 *</label>
            <input value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="biographer-edit-field">
            <label>手机号 *</label>
            <input value={form.phone || ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>
        <div className="biographer-edit-row">
          <div className="biographer-edit-field">
            <label>邮箱</label>
            <input value={form.email || ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="biographer-edit-field">
            <label>所在城市</label>
            <input value={form.city || ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
        </div>
        <div className="biographer-edit-row">
          <div className="biographer-edit-field">
            <label>头衔</label>
            <input value={form.title || ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="如：高级传记顾问" />
          </div>
          <div className="biographer-edit-field">
            <label>从业年限</label>
            <input type="number" value={form.experience || 0} onChange={(e) => setForm((f) => ({ ...f, experience: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
        <div className="biographer-edit-row">
          <div className="biographer-edit-field">
            <label>教育背景</label>
            <input value={form.education || ''} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} placeholder="如：浙江大学中文系硕士" />
          </div>
        </div>
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">个人简介</h3>
        <div className="biographer-edit-field">
          <textarea
            value={form.intro || ''}
            onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
            placeholder="介绍您的从业经历、擅长领域和服务理念"
          />
        </div>
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">专长领域</h3>
        <div className="biographer-edit-tags">
          {(form.specialties || []).map((tag, idx) => (
            <span key={idx} className="biographer-edit-tag">
              {tag}
              <button onClick={() => removeTag('specialties', idx)}><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="biographer-edit-tag-input">
          <input value={specialtyInput} onChange={(e) => setSpecialtyInput(e.target.value)} placeholder="输入专长按回车添加" onKeyDown={(e) => e.key === 'Enter' && addTag('specialties', specialtyInput, setSpecialtyInput)} />
          <button className="btn btn-outline" onClick={() => addTag('specialties', specialtyInput, setSpecialtyInput)}><Plus size={14} /></button>
        </div>
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">服务区域</h3>
        <div className="biographer-edit-tags">
          {(form.serviceAreas || []).map((tag, idx) => (
            <span key={idx} className="biographer-edit-tag">
              {tag}
              <button onClick={() => removeTag('serviceAreas', idx)}><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="biographer-edit-tag-input">
          <input value={areaInput} onChange={(e) => setAreaInput(e.target.value)} placeholder="输入城市按回车添加" onKeyDown={(e) => e.key === 'Enter' && addTag('serviceAreas', areaInput, setAreaInput)} />
          <button className="btn btn-outline" onClick={() => addTag('serviceAreas', areaInput, setAreaInput)}><Plus size={14} /></button>
        </div>
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">个人标签</h3>
        <div className="biographer-edit-tags">
          {(form.tags || []).map((tag, idx) => (
            <span key={idx} className="biographer-edit-tag">
              {tag}
              <button onClick={() => removeTag('tags', idx)}><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="biographer-edit-tag-input">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="输入标签按回车添加" onKeyDown={(e) => e.key === 'Enter' && addTag('tags', tagInput, setTagInput)} />
          <button className="btn btn-outline" onClick={() => addTag('tags', tagInput, setTagInput)}><Plus size={14} /></button>
        </div>
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">服务套餐</h3>
        <div className="biographer-edit-list">
          {(form.services || []).map((s, idx) => (
            <div key={s.id} className="biographer-edit-list-item">
              <div className="biographer-edit-list-item-header">
                <span className="biographer-edit-list-item-title">套餐 {idx + 1}</span>
                <button className="biographer-edit-list-item-remove" onClick={() => setForm((f) => ({ ...f, services: (f.services || []).filter((_, i) => i !== idx) }))}><X size={16} /></button>
              </div>
              <div className="biographer-edit-row">
                <div className="biographer-edit-field">
                  <label>套餐名称</label>
                  <input value={s.name} onChange={(e) => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, name: e.target.value } : item) }))} />
                </div>
                <div className="biographer-edit-field">
                  <label>价格（元）</label>
                  <input type="number" value={s.price} onChange={(e) => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, price: parseInt(e.target.value) || 0 } : item) }))} />
                </div>
              </div>
              <div className="biographer-edit-field">
                <label>套餐描述</label>
                <input value={s.description} onChange={(e) => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, description: e.target.value } : item) }))} />
              </div>
            </div>
          ))}
          <button className="biographer-edit-add-btn" onClick={() => setForm((f) => ({ ...f, services: [...(f.services || []), { id: `svc_${Date.now()}`, name: '', price: 0, description: '' }] }))}>
            <Plus size={16} /> 添加套餐
          </button>
        </div>
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">成功案例</h3>
        <div className="biographer-edit-list">
          {(form.cases || []).map((c, idx) => (
            <div key={c.id} className="biographer-edit-list-item">
              <div className="biographer-edit-list-item-header">
                <span className="biographer-edit-list-item-title">案例 {idx + 1}</span>
                <button className="biographer-edit-list-item-remove" onClick={() => setForm((f) => ({ ...f, cases: (f.cases || []).filter((_, i) => i !== idx) }))}><X size={16} /></button>
              </div>
              <div className="biographer-edit-case-cover" onClick={() => { setEditingCaseIndex(idx); caseInputRef.current?.click(); }}>
                {c.cover ? <img src={c.cover} alt={c.title} /> : <Image size={28} />}
              </div>
              <div className="biographer-edit-field">
                <label>案例标题</label>
                <input value={c.title} onChange={(e) => setForm((f) => ({ ...f, cases: (f.cases || []).map((item, i) => i === idx ? { ...item, title: e.target.value } : item) }))} />
              </div>
              <div className="biographer-edit-field">
                <label>案例简介</label>
                <input value={c.summary} onChange={(e) => setForm((f) => ({ ...f, cases: (f.cases || []).map((item, i) => i === idx ? { ...item, summary: e.target.value } : item) }))} />
              </div>
            </div>
          ))}
          <button className="biographer-edit-add-btn" onClick={() => setForm((f) => ({ ...f, cases: [...(f.cases || []), { id: `case_${Date.now()}`, title: '', summary: '', cover: '' }] }))}>
            <Plus size={16} /> 添加案例
          </button>
        </div>
        <input
          ref={caseInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || editingCaseIndex === null) return;
            try {
              const list = await uploadFile([file]);
              setForm((f) => ({ ...f, cases: (f.cases || []).map((item, i) => i === editingCaseIndex ? { ...item, cover: list[0].url } : item) }));
            } catch {
              addToast('封面上传失败', 'error');
            }
          }}
        />
      </div>

      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">资质证明</h3>
        <div className="biographer-edit-certificates">
          {(form.certificates || []).map((url, idx) => (
            <div key={idx} className="biographer-edit-certificate">
              {url ? <img src={url} alt="证明" /> : <Upload size={24} />}
              <button className="biographer-edit-certificate-remove" onClick={() => removeCert(idx)}><X size={14} /></button>
            </div>
          ))}
          <button className="biographer-edit-certificate-add" onClick={() => certInputRef.current?.click()}>
            <Upload size={20} /> 上传证明
          </button>
          <input
            ref={certInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleCertUpload}
          />
        </div>
      </div>

      <div className="biographer-edit-footer">
        <button className="btn btn-outline" onClick={() => navigate('/biographer')} disabled={saving}>取消</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? '保存中...' : '保存资料'}
        </button>
      </div>
    </div>
  );
}
