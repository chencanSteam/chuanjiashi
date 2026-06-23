import { ArrowLeft, Baby, GraduationCap, Stethoscope, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import './FamilyChild.css';

const children = [
  { name: '张子涵', birth: '2003年5月12日', age: 21 },
  { name: '张若曦', birth: '2006年8月20日', age: 18 },
  { name: '张浩然', birth: '2009年11月3日', age: 15 },
];

const categories = [
  { key: 'growth', label: '成长记录', Icon: Baby },
  { key: 'study', label: '学习档案', Icon: GraduationCap },
  { key: 'health', label: '健康档案', Icon: Stethoscope },
  { key: 'hobby', label: '兴趣特长', Icon: Music },
];

export default function FamilyChild() {
  const navigate = useNavigate();

  return (
    <div className="detail-page family-child-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">亲子成长档案</h1>
      </header>

      <div className="child-cards">
        {children.map((c, i) => (
          <div className="card child-summary-card" key={i}>
            <div className="card-header">
              <div className="child-summary-profile">
                <Avatar name={c.name} size={48} />
                <div>
                  <div className="child-summary-name">{c.name}</div>
                  <div className="child-summary-meta">{c.birth} · {c.age}岁</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="child-cat-grid">
                {categories.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    className="child-cat-item"
                    onClick={() => navigate(`/family/child/${key}`)}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
