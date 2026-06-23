import { ArrowLeft, Baby, GraduationCap, Stethoscope, Music } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './FamilyChildCategory.css';

const categoryMeta: Record<string, { label: string; Icon: typeof Baby; items: string[] }> = {
  growth: { label: '成长记录', Icon: Baby, items: ['第一次走路', '幼儿园入园', '小学毕业', '中学入学', '18岁成人礼'] },
  study: { label: '学习档案', Icon: GraduationCap, items: ['小学成绩单', '中考成绩', '高考志愿', '大学录取', '奖学金记录'] },
  health: { label: '健康档案', Icon: Stethoscope, items: ['体检报告 2023', '疫苗接种记录', '过敏史', '视力检查', '身高体重曲线'] },
  hobby: { label: '兴趣特长', Icon: Music, items: ['钢琴考级', '书法比赛', '足球训练', '绘画作品', '机器人竞赛'] },
};

export default function FamilyChildCategory() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const meta = categoryMeta[category ?? ''] ?? categoryMeta.growth;
  const { label, Icon, items } = meta;

  return (
    <div className="detail-page family-child-category-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/family/child')}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">{label}</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Icon size={16} /> {label}</h3>
        </div>
        <div className="card-body">
          <div className="child-timeline">
            {items.map((item, i) => (
              <div className="child-timeline-row" key={i}>
                <div className="child-timeline-dot" />
                <div className="child-timeline-content">
                  <div className="child-timeline-title">{item}</div>
                  <div className="child-timeline-date">{2010 + i * 2}年</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
