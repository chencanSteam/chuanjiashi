import { ArrowLeft, CheckCircle2, Clock, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './ArchiveSubPage.css';

const meta: Record<string, { title: string; Icon: typeof Clock; items: string[] }> = {
  completeness: { title: '档案完整度', Icon: CheckCircle2, items: ['基本信息 100%', '教育经历 80%', '工作经历 90%', '家庭关系 85%', '成就作品 70%'] },
  events: { title: '关键事件', Icon: Clock, items: ['1958 出生', '1970 求学', '1980 婚姻', '1992 创业', '2020 退休', '2024 当下'] },
  members: { title: '授权成员', Icon: Users, items: ['张明远（家主）', '李婉如（管理员）', '张子涵（编辑者）', '张建国（观察者）', '张建军（观察者）'] },
};

export default function ArchiveSubPage() {
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();
  const { title, Icon, items } = meta[section ?? ''] ?? meta.completeness;

  return (
    <div className="detail-page archive-sub-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">{title}</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Icon size={16} /> {title}</h3>
        </div>
        <div className="card-body">
          {items.map((item, i) => (
            <div className="archive-sub-row" key={i}>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
