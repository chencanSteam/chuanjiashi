import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, FileText, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { applyForPartner } from '../data/partnerData';
import type { PartnerType } from '../types/partner';
import './PartnerApplication.css';

const regionData: Record<string, { code: string; name: string }[]> = {
  '330000': [
    { code: '330100', name: '杭州市' },
    { code: '330200', name: '宁波市' },
    { code: '330300', name: '温州市' },
  ],
  '330100': [
    { code: '330106', name: '西湖区' },
    { code: '330104', name: '江干区' },
    { code: '330105', name: '拱墅区' },
  ],
};

export default function PartnerApplication() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'district' as PartnerType,
    province: '330000',
    city: '330100',
    district: '330106',
    reason: '',
  });

  const getRegionName = () => {
    const provinceName = '浙江省';
    const cityName = regionData['330000'].find((c) => c.code === form.city)?.name || '';
    const districtName = regionData['330100'].find((d) => d.code === form.district)?.name || '';
    if (form.type === 'province') return provinceName;
    if (form.type === 'city') return cityName;
    return `${cityName}${districtName}`;
  };

  const getRegionCode = () => {
    if (form.type === 'province') return form.province;
    if (form.type === 'city') return form.city;
    return form.district;
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('请填写姓名和手机号', 'error');
      return;
    }
    applyForPartner({
      name: form.name,
      phone: form.phone,
      email: form.email,
      type: form.type,
      regionCode: getRegionCode(),
      regionName: getRegionName(),
      reason: form.reason,
    });
    addToast('申请已提交，请等待审核', 'success');
    navigate('/login', { replace: true });
  };

  return (
    <div className="partner-application-page">
      <div className="partner-application-card">
        <header className="partner-application-header">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>
            <ArrowLeft size={16} /> 返回登录
          </button>
          <h1>申请成为合伙人</h1>
          <p>免费申请，审核通过后即可开展业务</p>
        </header>

        <div className="partner-application-form">
          <div className="form-row">
            <label><User size={12} /> 姓名</label>
            <input
              type="text"
              placeholder="请输入真实姓名"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <label><Phone size={12} /> 手机号</label>
            <input
              type="tel"
              placeholder="请输入手机号"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <label><Mail size={12} /> 邮箱</label>
            <input
              type="email"
              placeholder="请输入邮箱（选填）"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <label>合伙人类型</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartnerType }))}>
              <option value="province">省级合伙人</option>
              <option value="city">市级合伙人</option>
              <option value="district">区县合伙人</option>
              <option value="inviter">邀请码合伙人</option>
            </select>
          </div>

          {form.type !== 'inviter' && (
            <div className="form-row">
              <label><MapPin size={12} /> 代理区域</label>
              <div className="partner-region-selects">
                <select value={form.province} disabled>
                  <option value="330000">浙江省</option>
                </select>
                {form.type !== 'province' && (
                  <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}>
                    {regionData['330000'].map((c) => (
                      <option value={c.code} key={c.code}>{c.name}</option>
                    ))}
                  </select>
                )}
                {form.type === 'district' && (
                  <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}>
                    {regionData['330100'].map((d) => (
                      <option value={d.code} key={d.code}>{d.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="form-row">
            <label><FileText size={12} /> 申请理由</label>
            <textarea
              rows={3}
              placeholder="请简述您的资源优势或推广计划"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>

          <button className="btn btn-primary partner-application-submit" onClick={handleSubmit}>
            <Send size={14} /> 提交申请
          </button>
        </div>
      </div>
    </div>
  );
}
