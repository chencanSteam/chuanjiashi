import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import Annotate from '../components/annotation/Annotate';
import { regions } from '../data/regions';
import { industryOptions, industryOccupations } from '../data/occupations';
import './Login.css';

// 注册页：仅支持手机号 + 短信验证码注册
export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originDistrict, setOriginDistrict] = useState('');
  const [originDetail, setOriginDetail] = useState('');
  const [industry, setIndustry] = useState('');
  const [occupation, setOccupation] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();
  const birthYears = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => String(currentYear - index));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 发送验证码（演示环境：直接通过提示展示验证码）
  const handleSendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCountdown(60);
    addToast(`验证码已发送（演示环境：${newCode}）`, 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // 演示环境不拦截空字段，未填写手机号时使用演示手机号继续流程。
    const demoPhone = /^1\d{10}$/.test(phone.trim()) ? phone.trim() : '13800138003';
    const { success, error } = await login(demoPhone, '123456', { isRegister: true, name: name.trim() });
    if (!success) {
      setSubmitting(false);
      addToast(error || '注册失败，请重试', 'error');
      return;
    }
    addToast('注册成功，开始完善人生档案', 'success');
    navigate('/onboarding', {
      replace: true,
      state: {
        startStep: 3,
        from: '/home',
        profile: {
          name: name.trim(),
          gender,
          birthYear,
          birthMonth,
          birthDay,
          originProvince,
          originCity,
          originDistrict,
          originDetail,
          industry,
          occupation,
        },
      },
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">传</div>
          <div>
            <h1 className="login-title">注册账号</h1>
            <p className="login-subtitle">填写基本信息和手机号，体验完整注册流程</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="register-section-title"><User size={17} /> 基本信息</div>
          <div className="register-form-grid">
            <label className="register-form-field">
              <span>姓名 <em>*</em></span>
              <input type="text" placeholder="如：张三" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="register-form-field">
              <span>性别</span>
              <select value={gender} onChange={(e) => setGender(e.target.value as '男' | '女')}>
                <option value="男">男</option><option value="女">女</option>
              </select>
            </label>
            <label className="register-form-field register-form-field-full">
              <span>出生日期 <em>*</em></span>
              <div className="register-cascade-row">
                <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}><option value="">年</option>{birthYears.map((year) => <option key={year} value={year}>{year} 年</option>)}</select>
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}><option value="">月</option>{Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((month) => <option key={month} value={month}>{Number(month)} 月</option>)}</select>
                <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)}><option value="">日</option>{Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0')).map((day) => <option key={day} value={day}>{Number(day)} 日</option>)}</select>
              </div>
            </label>
            <label className="register-form-field register-form-field-full">
              <span>籍贯 <em>*</em></span>
              <div className="register-cascade-row">
                <select value={originProvince} onChange={(e) => { setOriginProvince(e.target.value); setOriginCity(''); setOriginDistrict(''); }}><option value="">省份</option>{regions.map((region) => <option key={region.name} value={region.name}>{region.name}</option>)}</select>
                <select value={originCity} disabled={!originProvince} onChange={(e) => { setOriginCity(e.target.value); setOriginDistrict(''); }}><option value="">城市</option>{(regions.find((region) => region.name === originProvince)?.cities || []).map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}</select>
                <select value={originDistrict} disabled={!originCity} onChange={(e) => setOriginDistrict(e.target.value)}><option value="">区/县</option>{(regions.find((region) => region.name === originProvince)?.cities.find((city) => city.name === originCity)?.districts || []).map((district) => <option key={district} value={district}>{district}</option>)}</select>
              </div>
            </label>
            <label className="register-form-field register-form-field-full">
              <span>详细地址</span>
              <input type="text" placeholder="选填，如：平江路 12 号" value={originDetail} onChange={(e) => setOriginDetail(e.target.value)} />
            </label>
            <label className="register-form-field">
              <span>行业 <em>*</em></span>
              <select value={industry} onChange={(e) => { setIndustry(e.target.value); setOccupation(''); }}><option value="">请选择行业</option>{industryOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </label>
            <label className="register-form-field">
              <span>职业 <em>*</em></span>
              <select value={occupation} disabled={!industry} onChange={(e) => setOccupation(e.target.value)}><option value="">{industry ? '请选择职业' : '请先选择行业'}</option>{(industryOccupations[industry] || []).map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </label>
          </div>
          <div className="register-section-title register-contact-title"><Phone size={17} /> 手机号验证</div>
          <div className="login-field">
            <Phone size={16} />
            <input
              type="text"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="login-field login-code">
            <Lock size={16} />
            <input
              type="text"
              placeholder="验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Annotate id="register.send-code" inline>
            <button type="button" className="btn btn-outline code-btn" disabled={countdown > 0} onClick={handleSendCode}>
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </button>
            </Annotate>
          </div>

          <Annotate id="register.agreement">
          <label className="login-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>我已阅读并同意《用户协议》和《隐私协议》</span>
          </label>
          </Annotate>

          <Annotate id="register.submit">
          <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
            {submitting ? '注册中…' : '注册'} <ArrowRight size={16} />
          </button>
          </Annotate>
        </form>

        <Annotate id="register.back">
        <button type="button" className="btn btn-ghost login-back" onClick={() => navigate('/login')}>
          <ArrowLeft size={14} /> 返回登录
        </button>
        </Annotate>
      </div>
    </div>
  );
}
