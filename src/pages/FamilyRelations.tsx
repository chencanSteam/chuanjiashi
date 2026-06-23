import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import './FamilyRelations.css';

const relations = [
  { from: '张明远', to: '李婉如', relation: '配偶' },
  { from: '张明远', to: '张子涵', relation: '父子' },
  { from: '张明远', to: '张浩然', relation: '祖孙' },
  { from: '张建国', to: '张明远', relation: '父子' },
  { from: '张志远', to: '张建国', relation: '父子' },
  { from: '张建军', to: '刘芳', relation: '配偶' },
  { from: '张子涵', to: '张若曦', relation: '配偶' },
];

export default function FamilyRelations() {
  const navigate = useNavigate();

  return (
    <div className="detail-page family-relations-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">关系维护</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Users size={16} /> 家庭关系网络</h3>
          <button className="btn btn-primary" onClick={() => navigate('/family/members')}>添加关系</button>
        </div>
        <div className="card-body">
          {relations.map((r, i) => (
            <div className="relation-row" key={i}>
              <div className="relation-person">
                <Avatar name={r.from} size={32} />
                <span>{r.from}</span>
              </div>
              <span className="relation-label">{r.relation}</span>
              <div className="relation-person">
                <Avatar name={r.to} size={32} />
                <span>{r.to}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
