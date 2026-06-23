import { ArrowLeft, FileText, Users, Landmark, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './FamilyInherit.css';

const inheritItems = [
  { id: 'archive', title: '数字档案继承方案', desc: '指定家庭成员作为档案继承人，确保家族记忆代代相传。', status: '已设置', Icon: FileText },
  { id: 'oral', title: '口述史资料托管', desc: '选择可靠的云端或本地托管方式，保障音视频资料长期可访问。', status: '云端托管', Icon: Users },
  { id: 'hall', title: '家风馆运营授权', desc: '授权指定成员继续维护和更新家风馆内容。', status: '待设置', Icon: Landmark },
  { id: 'privacy', title: '隐私与开放权限', desc: '设置哪些内容对家族公开、哪些仅限直系亲属查看。', status: '已设置', Icon: Lock },
];

export default function FamilyInherit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const item = inheritItems.find((i) => i.id === id) ?? inheritItems[0];
  const { title, desc, status, Icon } = item;

  return (
    <div className="detail-page family-inherit-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">{title}</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Icon size={16} /> 方案详情</h3>
          <span className={`inherit-status-tag ${status === '待设置' ? 'pending' : ''}`}>{status}</span>
        </div>
        <div className="card-body">
          <p className="inherit-desc">{desc}</p>
          <div className="inherit-section">
            <h4>当前配置</h4>
            <div className="inherit-row-simple">
              <span>继承人</span>
              <strong>张子涵</strong>
            </div>
            <div className="inherit-row-simple">
              <span>生效条件</span>
              <strong>账户连续 3 年无登录</strong>
            </div>
            <div className="inherit-row-simple">
              <span>数据范围</span>
              <strong>全部家庭档案与家风馆内容</strong>
            </div>
          </div>
          <div className="inherit-actions">
            <button className="btn btn-outline" onClick={() => navigate('/family', { state: { tab: 'inherit' } })}>返回继承中心</button>
            <button className="btn btn-primary">修改配置</button>
          </div>
        </div>
      </div>
    </div>
  );
}
