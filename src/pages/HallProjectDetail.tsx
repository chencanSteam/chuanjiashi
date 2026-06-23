import { useState } from 'react';
import { ArrowLeft, Landmark, Eye, Save, Send, Monitor, Share2, QrCode, Link as LinkIcon, ChevronRight, EyeOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './HallProjectDetail.css';

const moduleRouteMap: Record<string, string> = {
  '家训家规': 'rules',
  '家风故事': 'stories',
  '家风课程': 'courses',
  '最美家庭': 'election',
  'AI家风导师': 'mentor',
};

const projectData: Record<string, { status: string; date: string; desc: string; modules: string[] }> = {
  '张氏家风馆': { status: '建设中', date: '2024-05-24 15:30', desc: '百年张氏家风传承与数字化展馆，包含家训家规、家风故事、家风课程、最美家庭等模块。', modules: ['家训家规', '家风故事', '家风课程', '最美家庭', 'AI家风导师'] },
  '李氏家风馆': { status: '建设中', date: '2024-05-22 11:20', desc: '李氏家族数字化家风馆建设项目。', modules: ['家训家规', '家风故事', '最美家庭'] },
  '王氏家风馆': { status: '已发布', date: '2024-05-18 09:10', desc: '王氏家风馆已正式发布，支持公开访问。', modules: ['家训家规', '家风故事', '家风课程'] },
  '陈氏家风馆': { status: '已发布', date: '2024-05-15 16:45', desc: '陈氏家风馆已正式发布。', modules: ['家风故事', '最美家庭'] },
  '赵氏家风馆': { status: '建设中', date: '2024-05-10 14:20', desc: '赵氏家风馆建设项目。', modules: ['家训家规'] },
};

export default function HallProjectDetail() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { addToast } = useToast();
  const decodedName = decodeURIComponent(name ?? '');
  const base = projectData[decodedName] ?? projectData['张氏家风馆'];
  const [status, setStatus] = useState(base.status);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set(base.modules));

  return (
    <div className="detail-page hall-project-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">{decodedName}</h1>
      </header>

      <div className="card hall-project-hero">
        <div className="card-body">
          <div className="hall-project-header">
            <div className="hall-project-icon"><Landmark size={36} /></div>
            <div>
              <div className="hall-project-name">{decodedName}</div>
              <div className="hall-project-meta">
                <span className={`hall-project-status ${status === '建设中' ? 'building' : 'published'}`}>{status}</span>
                <span>更新于 {base.date}</span>
              </div>
            </div>
          </div>
          <p className="hall-project-desc">{base.desc}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">页面模块</h3>
          <div className="hall-project-actions">
            <button className="btn btn-outline" onClick={() => navigate('/family-hall/deploy')}><Eye size={14} /> 预览</button>
            <button className="btn btn-outline" onClick={() => { setSavedAt(new Date().toLocaleString()); addToast('草稿已保存', 'success'); }}><Save size={14} /> 保存{savedAt ? `于 ${savedAt.split(' ')[1]}` : ''}</button>
            <button className="btn btn-primary" onClick={() => { setStatus('已发布'); addToast('家风馆已发布', 'success'); }} disabled={status === '已发布'}>
              <Send size={14} /> {status === '已发布' ? '已发布' : '发布'}
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="hall-modules">
            {base.modules.map((m) => (
              <div
                className={`hall-module-card ${activeModules.has(m) ? 'active' : ''}`}
                key={m}
                onClick={() => navigate(`/family-hall/project/${encodeURIComponent(decodedName)}/${moduleRouteMap[m] ?? 'rules'}`)}
              >
                <Monitor size={20} color="#1B5E4B" />
                <span className="hall-module-name">{m}</span>
                <button
                  className="hall-module-toggle"
                  title={activeModules.has(m) ? '点击隐藏模块' : '点击启用模块'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModules((prev) => {
                      const next = new Set(prev);
                      if (next.has(m)) next.delete(m);
                      else next.add(m);
                      return next;
                    });
                    addToast(`已${activeModules.has(m) ? '隐藏' : '启用'}模块：${m}`, 'info');
                  }}
                >
                  {activeModules.has(m) ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <ChevronRight size={14} className="hall-module-arrow" />
              </div>
            ))}
          </div>
          <div className="hall-deploy-actions">
            <button className="btn btn-outline" onClick={() => navigate('/family-hall/deploy')}><LinkIcon size={14} /> H5链接</button>
            <button className="btn btn-outline" onClick={() => navigate('/family-hall/deploy')}><QrCode size={14} /> 二维码</button>
            <button className="btn btn-outline" onClick={() => navigate('/family-hall/deploy')}><Share2 size={14} /> 分享海报</button>
          </div>
        </div>
      </div>
    </div>
  );
}
