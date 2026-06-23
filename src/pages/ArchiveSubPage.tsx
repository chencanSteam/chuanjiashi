import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Users, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './ArchiveSubPage.css';

const initialMeta: Record<string, { title: string; Icon: typeof Clock; items: { label: string; value?: number; role?: string }[] }> = {
  completeness: { title: '档案完整度', Icon: CheckCircle2, items: [{ label: '基本信息', value: 100 }, { label: '教育经历', value: 80 }, { label: '工作经历', value: 90 }, { label: '家庭关系', value: 85 }, { label: '成就作品', value: 70 }] },
  events: { title: '关键事件', Icon: Clock, items: [{ label: '1958 出生' }, { label: '1970 求学' }, { label: '1980 婚姻' }, { label: '1992 创业' }, { label: '2020 退休' }, { label: '2024 当下' }] },
  members: { title: '授权成员', Icon: Users, items: [{ label: '张明远', role: '家主' }, { label: '李婉如', role: '管理员' }, { label: '张子涵', role: '编辑者' }, { label: '张建国', role: '观察者' }, { label: '张建军', role: '观察者' }] },
};

export default function ArchiveSubPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { section } = useParams<{ section: string }>();
  const config = initialMeta[section ?? ''] ?? initialMeta.completeness;
  const { title, Icon, items: initialItems } = config;
  const [items, setItems] = useState(initialItems);

  const updateValue = (i: number, value: number) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, value } : item));
  };

  const updateRole = (i: number, role: string) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, role } : item));
  };

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
              {section === 'completeness' && (
                <>
                  <span className="archive-sub-label">{item.label}</span>
                  <input type="range" min={0} max={100} value={item.value} onChange={(e) => updateValue(i, parseInt(e.target.value, 10))} />
                  <span className="archive-sub-value">{item.value}%</span>
                </>
              )}
              {section === 'events' && (
                <button className="archive-sub-event" onClick={() => navigate(`/archive/event/${item.label.split(' ')[0]}/edit`)}>
                  <Clock size={14} /> {item.label}
                </button>
              )}
              {section === 'members' && (
                <div className="archive-sub-member">
                  <span className="archive-sub-name">{item.label}</span>
                  <select value={item.role} onChange={(e) => updateRole(i, e.target.value)}>
                    <option>家主</option>
                    <option>管理员</option>
                    <option>编辑者</option>
                    <option>观察者</option>
                  </select>
                  <button className="btn btn-ghost" onClick={() => navigate(`/family/members/${encodeURIComponent(item.label)}`)}>查看</button>
                </div>
              )}
            </div>
          ))}
          {section === 'completeness' && (
            <button className="btn btn-primary" onClick={() => addToast('完整度已保存', 'success')}><Save size={14} /> 保存完整度</button>
          )}
        </div>
      </div>
    </div>
  );
}
