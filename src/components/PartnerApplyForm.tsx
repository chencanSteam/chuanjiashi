import { useState } from 'react';
import { User, Phone, Mail, MapPin, FileText, Send } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { partnerApi } from '../api/partner';
import type { PartnerType } from '../types/partner';
import './PartnerApplyForm.css';

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

interface PartnerApplyFormProps {
  onSuccess?: () => void;
}

export default function PartnerApplyForm({ onSuccess }: PartnerApplyFormProps) {
  const { addToast } = useToast();
  const { addRole } = useAuth();
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('请填写姓名和手机号', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await partnerApi.apply({
        name: form.name,
        phone: form.phone,
        email: form.email,
        type: form.type,
        regionCode: getRegionCode(),
        regionName: getRegionName(),
        reason: form.reason,
      });
      addToast('申请已提交并通过审核', 'success');
      addRole('partner');
      setTimeout(() => {
        onSuccess?.();
      }, 1200);
    } catch (err: any) {
      addToast(err.message || '申请失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          <option value="district">县级合伙人</option>
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

      <button
        className="btn btn-primary partner-application-submit"
        onClick={handleSubmit}
        disabled={submitting}
      >
        <Send size={14} /> {submitting ? '提交中...' : '提交申请'}
      </button>
    </div>
  );
}
