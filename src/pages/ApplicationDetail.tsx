import { useState } from 'react';
import { ArrowLeft, FileText, Clock, CheckCircle2, User, Calendar, Printer, Download, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './ApplicationDetail.css';

const appData: Record<string, { name: string; type: string; status: string; date: string; desc: string }> = {
  'ZJ-20260618-001': { name: '张伟', type: '亲属关系证明', status: '审核中', date: '2026-06-18', desc: '用于公证、落户、入学等场景的亲属关系证明申请。' },
  '20260617002': { name: '李秀英', type: '档案调阅申请', status: '待补充', date: '2026-06-17', desc: '向档案馆申请调阅历史户籍与婚姻档案。' },
  '20260615003': { name: '王建国', type: '家风荣誉认证', status: '已办结', date: '2026-06-15', desc: '申报优秀家庭、文明家庭等荣誉认证。' },
};

export default function ApplicationDetail() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { addToast } = useToast();
  const [showProof, setShowProof] = useState(false);
  const decodedCode = decodeURIComponent(code ?? '');
  const data = appData[decodedCode] ?? appData['ZJ-20260618-001'];

  return (
    <div className="detail-page application-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">办理详情</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">{data.type}</h3>
            <div className="app-code"><FileText size={12} /> 编号：{decodedCode}</div>
          </div>
          <span className={`app-status ${data.status === '审核中' ? 'pending' : data.status === '待补充' ? 'need' : 'done'}`}>{data.status}</span>
        </div>
        <div className="card-body app-detail-body">
          <div className="app-info-grid">
            <div className="app-info-item"><User size={14} /> 申请人：{data.name}</div>
            <div className="app-info-item"><Calendar size={14} /> 申请时间：{data.date}</div>
            <div className="app-info-item"><Clock size={14} /> 预计办结：3个工作日</div>
            <div className="app-info-item"><CheckCircle2 size={14} /> 当前节点：{data.status}</div>
          </div>

          <div className="app-desc">{data.desc}</div>

          <div className="app-timeline">
            <div className="timeline-step done"><div className="step-dot" /> 提交申请</div>
            <div className={`timeline-step ${data.status !== '待补充' ? 'done' : ''}`}><div className="step-dot" /> AI 智能核验</div>
            <div className={`timeline-step ${data.status === '已办结' ? 'done' : data.status === '审核中' ? 'active' : ''}`}><div className="step-dot" /> 人工复核</div>
            <div className={`timeline-step ${data.status === '已办结' ? 'done' : ''}`}><div className="step-dot" /> 结果下发</div>
          </div>

          <div className="app-detail-actions">
            <button className="btn btn-primary" onClick={() => setShowProof(true)}><FileText size={14} /> 查看证明</button>
            <button className="btn btn-outline" onClick={() => window.print()}><Printer size={14} /> 打印</button>
            <button className="btn btn-outline" onClick={() => {
              const blob = new Blob([`${data.type}\n编号：${decodedCode}\n申请人：${data.name}\n状态：${data.status}`], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${data.type}.txt`;
              a.click();
              URL.revokeObjectURL(url);
              addToast('证明已下载', 'success');
            }}><Download size={14} /> 下载</button>
          </div>
        </div>
      </div>

      {showProof && (
        <div className="modal-overlay" onClick={() => setShowProof(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>电子证明</h4><button className="modal-close" onClick={() => setShowProof(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <div className="proof-doc">
                <h5>{data.type}</h5>
                <p>编号：{decodedCode}</p>
                <p>申请人：{data.name}</p>
                <p>状态：{data.status}</p>
                <p>本证明由“传家世”平台根据用户授权档案生成。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
