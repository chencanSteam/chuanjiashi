import { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  UploadCloud,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { biographerApi, type BiographerApplicationInfo } from '../api/biographer';
import './BiographerApply.css';

interface QualificationFile {
  name: string;
  preview?: string;
}

const specialtyOptions = [
  '人物传记',
  '家族史',
  '企业家传记',
  '抗战/军旅回忆',
  '知青岁月',
  '非遗匠人',
  '口述历史',
  '纪念文集',
];

export default function BiographerApply() {
  const { addToast } = useToast();
  const [record, setRecord] = useState<BiographerApplicationInfo | null>(null);
  const [form, setForm] = useState({
    name: '',
    idCard: '',
    phone: '',
    city: '',
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [files, setFiles] = useState<QualificationFile[]>([]);
  const [depositPaid, setDepositPaid] = useState(false);
  const [depositPaying, setDepositPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refreshStatus = useCallback(() => {
    return biographerApi
      .applyStatus()
      .then((res) => {
        setRecord(res.application);
        setDepositPaid(res.depositPaid);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 审核中时每 5 秒轮询一次真实审核状态（管理端审核后用户端自动更新）
  useEffect(() => {
    if (record?.status !== 'pending') return;
    const timer = window.setInterval(refreshStatus, 5000);
    return () => window.clearInterval(timer);
  }, [record?.status, refreshStatus]);

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    Array.from(list).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        addToast(`「${file.name}」超过 5MB，已跳过`, 'error');
        return;
      }
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles((prev) => [...prev, { name: file.name, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      } else {
        setFiles((prev) => [...prev, { name: file.name }]);
      }
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePayDeposit = async () => {
    setDepositPaying(true);
    try {
      await biographerApi.payDeposit();
      setDepositPaid(true);
      addToast('押金缴纳成功（¥500）', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '押金缴纳失败', 'error');
    } finally {
      setDepositPaying(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      addToast('请填写真实姓名', 'error');
      return;
    }
    if (!/^\d{15}(\d{2}[0-9Xx])?$/.test(form.idCard.trim())) {
      addToast('请填写正确的身份证号', 'error');
      return;
    }
    if (!/^1\d{10}$/.test(form.phone.trim())) {
      addToast('请填写正确的手机号', 'error');
      return;
    }
    if (!form.city.trim()) {
      addToast('请填写服务城市', 'error');
      return;
    }
    if (specialties.length === 0) {
      addToast('请选择至少一个擅长领域', 'error');
      return;
    }
    if (!depositPaid) {
      addToast('请先缴纳入驻押金', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await biographerApi.apply({
        name: form.name.trim(),
        idCard: form.idCard.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        specialties,
      });
      await refreshStatus();
      addToast('入驻申请已提交，请等待平台审核', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '提交失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetApply = () => {
    setRecord(null);
  };

  if (record) {
    const steps = [
      { label: '提交申请', done: true },
      { label: '平台审核', done: record.status !== 'pending' },
      { label: record.status === 'rejected' ? '审核驳回' : '审核通过', done: record.status !== 'pending' },
    ];
    return (
      <div className="biographer-apply-page">
        <header className="page-header">
          <h1 className="page-title">传记师入驻认证</h1>
          <p className="page-subtitle">认证通过后即可接单，为更多家庭记录人生故事</p>
        </header>

        <div className="card apply-status-card">
          <div className={`apply-status-banner ${record.status}`}>
            {record.status === 'pending' && (
              <>
                <Clock size={28} />
                <div>
                  <div className="apply-status-title">审核中</div>
                  <div className="apply-status-desc">
                    您的入驻申请已于 {new Date(record.submittedAt).toLocaleString()} 提交，平台将在 1-3 个工作日内完成审核。
                  </div>
                </div>
              </>
            )}
            {record.status === 'approved' && (
              <>
                <CheckCircle2 size={28} />
                <div>
                  <div className="apply-status-title">审核通过</div>
                  <div className="apply-status-desc">
                    恭喜您成为平台认证传记师，可前往传记师中心完善主页并开始接单。
                  </div>
                </div>
              </>
            )}
            {record.status === 'rejected' && (
              <>
                <XCircle size={28} />
                <div>
                  <div className="apply-status-title">审核驳回</div>
                  <div className="apply-status-desc">{record.reason || '资料不符合要求，请修改后重新提交。'}</div>
                </div>
              </>
            )}
          </div>

          <div className="apply-steps">
            {steps.map((s, i) => (
              <div className="apply-step" key={i}>
                <div className={`apply-step-dot ${s.done ? 'done' : ''} ${record.status === 'rejected' && i === 2 ? 'rejected' : ''}`}>
                  {s.done ? (record.status === 'rejected' && i === 2 ? <XCircle size={14} /> : <CheckCircle2 size={14} />) : i + 1}
                </div>
                <div className={`apply-step-label ${s.done ? 'done' : ''}`}>{s.label}</div>
                {i < steps.length - 1 && <div className={`apply-step-line ${steps[i + 1].done ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          <div className="apply-record-info">
            <div><span>申请人</span>{record.name}</div>
            <div><span>手机号</span>{record.phone}</div>
            <div><span>服务城市</span>{record.city}</div>
            <div><span>擅长领域</span>{record.specialties.join('、')}</div>
          </div>

          <div className="apply-status-actions">
            {record.status === 'rejected' && (
              <button className="btn btn-primary" onClick={resetApply}>
                <RefreshCw size={14} /> 修改资料重新提交
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="biographer-apply-page">
      <header className="page-header">
        <h1 className="page-title">传记师入驻认证</h1>
        <p className="page-subtitle">完成实名认证与资质审核，成为平台认证传记师</p>
      </header>

      <div className="card apply-form-card">
        <div className="card-header">
          <h3 className="card-title"><ShieldCheck size={16} /> 实名信息</h3>
        </div>
        <div className="card-body apply-form-body">
          <div className="apply-form-row">
            <label>真实姓名 <span className="apply-required">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="请输入与身份证一致的姓名"
            />
          </div>
          <div className="apply-form-row">
            <label>身份证号 <span className="apply-required">*</span></label>
            <input
              type="text"
              value={form.idCard}
              onChange={(e) => setForm({ ...form, idCard: e.target.value })}
              placeholder="请输入 18 位身份证号"
              maxLength={18}
            />
          </div>
          <div className="apply-form-row">
            <label>手机号 <span className="apply-required">*</span></label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="请输入 11 位手机号"
              maxLength={11}
            />
          </div>
          <div className="apply-form-row">
            <label>服务城市 <span className="apply-required">*</span></label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="如：北京、上海、苏州"
            />
          </div>
        </div>
      </div>

      <div className="card apply-form-card">
        <div className="card-header">
          <h3 className="card-title"><FileText size={16} /> 擅长领域 <span className="apply-required">*</span></h3>
        </div>
        <div className="card-body apply-form-body">
          <div className="apply-specialties">
            {specialtyOptions.map((s) => (
              <button
                key={s}
                type="button"
                className={`apply-specialty ${specialties.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSpecialty(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card apply-form-card">
        <div className="card-header">
          <h3 className="card-title"><UploadCloud size={16} /> 资质资料上传</h3>
        </div>
        <div className="card-body apply-form-body">
          <label className="apply-upload" htmlFor="biographer-qualification-upload">
            <UploadCloud size={28} />
            <span>点击上传资质证书、获奖证明等资料</span>
            <span className="apply-upload-hint">支持图片 / PDF，单个文件不超过 5MB</span>
          </label>
          <input
            id="biographer-qualification-upload"
            type="file"
            multiple
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {files.length > 0 && (
            <div className="apply-file-list">
              {files.map((f, i) => (
                <div className="apply-file-item" key={`${f.name}-${i}`}>
                  {f.preview ? (
                    <img className="apply-file-preview" src={f.preview} alt={f.name} />
                  ) : (
                    <div className="apply-file-preview apply-file-doc"><FileText size={20} /></div>
                  )}
                  <span className="apply-file-name">{f.name}</span>
                  <button type="button" className="apply-file-remove" onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card apply-form-card">
        <div className="card-header">
          <h3 className="card-title"><Wallet size={16} /> 押金缴纳</h3>
        </div>
        <div className="card-body apply-form-body">
          <div className="apply-deposit">
            <div className="apply-deposit-info">
              <div className="apply-deposit-amount">入驻押金 ¥500</div>
              <p>
                为保障委托方权益，传记师入驻需缴纳 ¥500 诚信押金。押金由平台托管，
                正常退出且无违规记录时全额退还；如出现爽约、抄袭等违规行为，将按规则扣除。
              </p>
            </div>
            {depositPaid ? (
              <span className="apply-deposit-paid"><CheckCircle2 size={16} /> 已缴纳</span>
            ) : (
              <button className="btn btn-primary" onClick={handlePayDeposit} disabled={depositPaying}>
                <Wallet size={14} /> {depositPaying ? '支付中…' : '缴纳 ¥500'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="apply-submit-bar">
        <button className="btn btn-primary apply-submit" onClick={handleSubmit} disabled={submitting}>
          <ShieldCheck size={16} /> {submitting ? '提交中…' : '提交入驻申请'}
        </button>
      </div>
    </div>
  );
}
