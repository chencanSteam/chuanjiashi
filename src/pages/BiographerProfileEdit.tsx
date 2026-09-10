import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Save, Eye, Image } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { biographerApi } from '../api/biographer';
import { uploadFile } from '../api/client';
import type { Biographer as MockBiographer } from '../mocks/types';
import { regions } from '../data/regions';
import Annotate from '../components/annotation/Annotate';
import './BiographerProfileEdit.css';

function isImageUrl(value: string): boolean {
  return /^(https?:|data:|blob:|\/)/.test(value);
}

interface BiographerProfileEditProps {
  /** 嵌入「我的介绍页」的编辑模式：隐藏独立页头，取消/提交后回调 onExit */
  embedded?: boolean;
  onExit?: () => void;
}

export default function BiographerProfileEdit({ embedded, onExit }: BiographerProfileEditProps = {}) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<MockBiographer>>({});
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [areaProvince, setAreaProvince] = useState('');
  const [areaCity, setAreaCity] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const caseInputRef = useRef<HTMLInputElement>(null);
  const [editingCaseIndex, setEditingCaseIndex] = useState<number | null>(null);

  useEffect(() => {
    biographerApi
      .me()
      .then((b) => {
        const matchedProvince = regions.find((province) => province.cities.some((city) => (
          city.name === b.city || city.name.replace(/市$/, '') === b.city
        )));
        const matchedCity = matchedProvince?.cities.find((city) => (
          city.name === b.city || city.name.replace(/市$/, '') === b.city
        ));
        setSelectedProvince(matchedProvince?.name || '');
        setSelectedCity(matchedCity?.name || b.city || '');
        setForm({
          ...b,
          title: '金牌传记师',
          city: matchedCity?.name || b.city || '',
          serviceAreas: b.serviceAreas || [matchedCity?.name || b.city || ''],
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
      await biographerApi.updateProfile({ ...form, title: '金牌传记师', city: selectedCity });
      addToast('主页已提交平台审核，审核通过后才会对外展示', 'success');
      if (embedded) onExit?.();
      else navigate('/biographer/profile');
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

  const availableCities = regions.find((province) => province.name === selectedProvince)?.cities || [];
  const availableAreaCities = regions.find((province) => province.name === areaProvince)?.cities || [];

  return (
    <div className="biographer-edit-page">
      {embedded ? (
        <div className="biographer-edit-review-hints">
          <p className="profile-review-hint">编辑后提交平台审核，通过后才会对外展示；审核期间线上主页保持不变。</p>
          {form.profileReviewStatus === 'pending' && <p className="profile-review-status pending">主页审核中，当前线上主页保持不变</p>}
          {form.profileReviewStatus === 'rejected' && <p className="profile-review-status rejected">主页未通过审核：{form.profileRejectReason || '请修改后重新提交'}</p>}
          {form.profileReviewStatus === 'approved' && <p className="profile-review-status approved">当前主页已通过平台审核并正常展示</p>}
        </div>
      ) : (
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">编辑主页</h1>
            <p className="profile-review-hint">提交后由平台审核，通过后才会对外展示</p>
            {form.profileReviewStatus === 'pending' && <p className="profile-review-status pending">主页审核中，当前线上主页保持不变</p>}
            {form.profileReviewStatus === 'rejected' && <p className="profile-review-status rejected">主页未通过审核：{form.profileRejectReason || '请修改后重新提交'}</p>}
            {form.profileReviewStatus === 'approved' && <p className="profile-review-status approved">当前主页已通过平台审核并正常展示</p>}
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/biographer/profile')}>
            <Eye size={14} /> 预览提交内容
          </button>
        </header>
      )}

      <Annotate id="biographer-profile-edit.avatar">
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
      </Annotate>

      <Annotate id="biographer-profile-edit.basic">
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
            <div className="biographer-edit-cascade">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  const province = e.target.value;
                  setSelectedProvince(province);
                  setSelectedCity('');
                  setForm((f) => ({ ...f, city: '' }));
                }}
              >
                <option value="">请选择省</option>
                {regions.map((province) => <option key={province.name} value={province.name}>{province.name}</option>)}
              </select>
              <select
                value={selectedCity}
                disabled={!selectedProvince}
                onChange={(e) => {
                  const city = e.target.value;
                  setSelectedCity(city);
                  setForm((f) => ({ ...f, city }));
                }}
              >
                <option value="">请选择市</option>
                {availableCities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="biographer-edit-row">
          <div className="biographer-edit-field">
            <label>头衔</label>
            <input value="金牌传记师" readOnly disabled aria-readonly="true" />
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
      </Annotate>

      <Annotate id="biographer-profile-edit.tags">
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
          <select
            value={areaProvince}
            onChange={(e) => {
              setAreaProvince(e.target.value);
              setAreaCity('');
            }}
          >
            <option value="">请选择省</option>
            {regions.map((province) => <option key={province.name} value={province.name}>{province.name}</option>)}
          </select>
          <select value={areaCity} disabled={!areaProvince} onChange={(e) => setAreaCity(e.target.value)}>
            <option value="">请选择市</option>
            {availableAreaCities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
          </select>
          <button
            className="btn btn-outline"
            disabled={!areaCity || (form.serviceAreas || []).includes(areaCity)}
            onClick={() => {
              if (!areaCity || (form.serviceAreas || []).includes(areaCity)) return;
              setForm((f) => ({ ...f, serviceAreas: [...(f.serviceAreas || []), areaCity] }));
              setAreaCity('');
            }}
          ><Plus size={14} /></button>
        </div>
      </div>

      </Annotate>

      <Annotate id="biographer-profile-edit.services">
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
              <div className="biographer-edit-row">
                <div className="biographer-edit-field">
                  <label>采访次数</label>
                  <input value={s.interviewCount || ''} placeholder="如：2 次" onChange={(e) => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, interviewCount: e.target.value } : item) }))} />
                </div>
                <div className="biographer-edit-field">
                  <label>传记字数</label>
                  <input value={s.wordCount || ''} placeholder="如：5000 字" onChange={(e) => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, wordCount: e.target.value } : item) }))} />
                </div>
              </div>
              <div className="biographer-edit-row">
                <div className="biographer-edit-field">
                  <label>交付周期</label>
                  <input value={s.deliveryPeriod || ''} placeholder="如：30 天" onChange={(e) => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, deliveryPeriod: e.target.value } : item) }))} />
                </div>
                <div className="biographer-edit-field">
                  <label>修改次数</label>
                  <input value={s.revisionCount || ''} placeholder="如：2 次" onChange={(e) => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, revisionCount: e.target.value } : item) }))} />
                </div>
              </div>
              <div className="biographer-edit-row">
                <div className="biographer-edit-field">
                  <label>实体书</label>
                  <div className="biographer-edit-radio-group">
                    {['含', '不含'].map((opt) => (
                      <label key={opt} className="biographer-edit-radio">
                        <input
                          type="radio"
                          checked={(s.physicalBook || '') === opt}
                          onChange={() => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, physicalBook: opt } : item) }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="biographer-edit-field">
                  <label>影像资料</label>
                  <div className="biographer-edit-radio-group">
                    {['含', '不含'].map((opt) => (
                      <label key={opt} className="biographer-edit-radio">
                        <input
                          type="radio"
                          checked={(s.mediaMaterial || '') === opt}
                          onChange={() => setForm((f) => ({ ...f, services: (f.services || []).map((item, i) => i === idx ? { ...item, mediaMaterial: opt } : item) }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button className="biographer-edit-add-btn" onClick={() => setForm((f) => ({ ...f, services: [...(f.services || []), { id: `svc_${Date.now()}`, name: '', price: 0, description: '' }] }))}>
            <Plus size={16} /> 添加套餐
          </button>
        </div>
      </div>
      </Annotate>

      <Annotate id="biographer-profile-edit.cases">
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
      </Annotate>

      <Annotate id="biographer-profile-edit.certificates">
      <div className="biographer-edit-section">
        <h3 className="biographer-edit-section-title">资质证明</h3>
        <div className="biographer-edit-certificates">
          {(form.certificates || []).map((url, idx) => (
            <div key={idx} className={`biographer-edit-certificate ${isImageUrl(url) ? '' : 'named'}`}>
              {isImageUrl(url) ? <img src={url} alt="证明" /> : <><Upload size={20} /><span>{url}</span></>}
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
      </Annotate>

      <Annotate id="biographer-profile-edit.save">
      <div className="biographer-edit-footer">
        <button className="btn btn-outline" onClick={() => (embedded ? onExit?.() : navigate('/biographer'))} disabled={saving}>取消</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? '提交中...' : form.profileReviewStatus === 'rejected' ? '重新提交审核' : '提交平台审核'}
        </button>
      </div>
      </Annotate>
    </div>
  );
}
