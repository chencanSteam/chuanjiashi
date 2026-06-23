import { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Users, BookOpen, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import './FamilyMemberDetail.css';

const memberData: Record<string, { role: string; gen: string; phone: string; email: string; location: string; birth: string; bio: string }> = {
  '张明远': { role: '家主', gen: '第1代', phone: '138****1234', email: 'zhang@example.com', location: '江苏省苏州市', birth: '1975-08-15', bio: '张氏家庭现任家主，明远机械有限公司创始人，致力于家族档案数字化与家风传承。' },
  '李婉如': { role: '配偶', gen: '第1代', phone: '139****5678', email: 'li@example.com', location: '江苏省苏州市', birth: '1978-03-22', bio: '家庭主妇，热心家族公益事业，擅长整理家族老照片与口述史资料。' },
  '张子涵': { role: '长子', gen: '第2代', phone: '137****9012', email: 'zihan@example.com', location: '上海市', birth: '2003-05-12', bio: '在校大学生，机械工程专业，积极参与家族故事共创与数字纪念馆建设。' },
  '张若曦': { role: '儿媳', gen: '第2代', phone: '136****3456', email: 'ruoxi@example.com', location: '上海市', birth: '2006-11-08', bio: '设计师，负责家风馆视觉设计与家族相册整理。' },
  '张浩然': { role: '孙子', gen: '第3代', phone: '135****7890', email: 'haoran@example.com', location: '江苏省苏州市', birth: '2009-09-01', bio: '初中生，喜欢听爷爷讲家族故事，是家族未来的传承希望。' },
  '张志远': { role: '祖父', gen: '第1代', phone: '-', email: '-', location: '江苏省苏州市', birth: '1920-02-10', bio: '家族始祖，从教40年，一生勤勉正直，为家族奠定了重视教育的家风。' },
  '王淑兰': { role: '祖母', gen: '第1代', phone: '-', email: '-', location: '江苏省苏州市', birth: '1923-06-18', bio: '家族始祖配偶，擅长苏绣与烹饪，奶奶的拿手菜是家族共同的记忆。' },
};

export default function FamilyMemberDetail() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { addToast } = useToast();
  const decodedName = decodeURIComponent(name ?? '');
  const base = memberData[decodedName] ?? { role: '家庭成员', gen: '第1代', phone: '-', email: '-', location: '江苏省苏州市', birth: '-', bio: '暂无详细介绍。' };
  const [data, setData] = useState(base);
  const [showEdit, setShowEdit] = useState(false);
  const [editBio, setEditBio] = useState(data.bio);
  const [editPhone, setEditPhone] = useState(data.phone);
  const [editLocation, setEditLocation] = useState(data.location);

  return (
    <div className="detail-page member-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">成员资料</h1>
      </header>

      <div className="card">
        <div className="card-body member-detail-body">
          <div className="member-detail-header">
            <Avatar name={decodedName} size={80} />
            <div className="member-detail-title">
              <div className="member-detail-name">{decodedName}</div>
              <div className="member-detail-meta">{data.role} · {data.gen}</div>
            </div>
          </div>

          <div className="member-detail-info">
            <div className="info-row"><Phone size={14} /> <span>{data.phone}</span></div>
            <div className="info-row"><Mail size={14} /> <span>{data.email}</span></div>
            <div className="info-row"><MapPin size={14} /> <span>{data.location}</span></div>
            <div className="info-row"><Calendar size={14} /> <span>{data.birth}</span></div>
          </div>

          <div className="member-detail-section">
            <h4><BookOpen size={14} /> 个人简介</h4>
            <p>{data.bio}</p>
          </div>

          <div className="member-detail-section">
            <h4><ImageIcon size={14} /> 相关相册</h4>
            <div className="detail-albums">
              {['2024春游记', '春节团圆', '成长记录'].map((a) => (
                <div key={a} className="detail-album-thumb" onClick={() => navigate(`/family/album/${encodeURIComponent(a)}`)}>
                  <ImageIcon size={20} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="member-detail-actions">
            <button className="btn btn-primary" onClick={() => setShowEdit(true)}><Users size={14} /> 编辑资料</button>
            <button className="btn btn-outline" onClick={() => navigate('/archive')}><Calendar size={14} /> 人生时间轴</button>
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>编辑 {decodedName} 的资料</h4><button className="modal-close" onClick={() => setShowEdit(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <label className="edit-label">联系电话</label>
              <input className="edit-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              <label className="edit-label">现居地</label>
              <input className="edit-input" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              <label className="edit-label">个人简介</label>
              <textarea className="edit-textarea" rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setShowEdit(false)}>取消</button>
                <button className="btn btn-primary" onClick={() => {
                  setData((d) => ({ ...d, phone: editPhone, location: editLocation, bio: editBio }));
                  setShowEdit(false);
                  addToast('资料已保存', 'success');
                }}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
