import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Users, BookOpen, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import { familyApi } from '../api/family';
import type { FamilyMember } from '../mocks/types';
import './FamilyMemberDetail.css';

function getArchiveId() {
  return localStorage.getItem('cj_current_archive_id') ?? 'default';
}

function getDefaultMember(name: string): FamilyMember {
  return {
    id: `m_${Date.now()}`,
    name,
    role: '家庭成员',
    gen: '第1代',
    phone: '-',
    email: '-',
    location: '江苏省苏州市',
    birth: '-',
    bio: '暂无详细介绍。',
  };
}

export default function FamilyMemberDetail() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { addToast } = useToast();
  const decodedName = decodeURIComponent(name ?? '');
  const archiveId = useMemo(() => getArchiveId(), []);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    familyApi
      .members(archiveId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [archiveId]);

  const index = members.findIndex((m) => m.name === decodedName);
  const data = index >= 0 ? members[index] : getDefaultMember(decodedName);

  const [editBio, setEditBio] = useState(data.bio ?? '');
  const [editPhone, setEditPhone] = useState(data.phone ?? '');
  const [editLocation, setEditLocation] = useState(data.location ?? '');
  const [editEmail, setEditEmail] = useState(data.email ?? '');
  const [editBirth, setEditBirth] = useState(data.birth ?? '');

  useEffect(() => {
    setEditBio(data.bio ?? '');
    setEditPhone(data.phone ?? '');
    setEditLocation(data.location ?? '');
    setEditEmail(data.email ?? '');
    setEditBirth(data.birth ?? '');
  }, [data.bio, data.phone, data.location, data.email, data.birth]);

  const handleSave = async () => {
    const next: FamilyMember = {
      ...data,
      bio: editBio,
      phone: editPhone,
      location: editLocation,
      email: editEmail,
      birth: editBirth,
    };
    try {
      const saved = await familyApi.addOrUpdateMember(archiveId, next);
      if (index >= 0) {
        setMembers((prev) => prev.map((m, i) => (i === index ? saved : m)));
      } else {
        setMembers((prev) => [...prev, saved]);
      }
      setShowEdit(false);
      addToast('资料已保存', 'success');
    } catch (err: any) {
      addToast(err.message || '保存失败', 'error');
    }
  };

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
            <div className="info-row"><Phone size={14} /> <span>{data.phone || '-'}</span></div>
            <div className="info-row"><Mail size={14} /> <span>{data.email || '-'}</span></div>
            <div className="info-row"><MapPin size={14} /> <span>{data.location || '-'}</span></div>
            <div className="info-row"><Calendar size={14} /> <span>{data.birth || '-'}</span></div>
          </div>

          <div className="member-detail-section">
            <h4><BookOpen size={14} /> 个人简介</h4>
            <p>{data.bio || '暂无简介'}</p>
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
              <label className="edit-label">电子邮箱</label>
              <input className="edit-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              <label className="edit-label">现居地</label>
              <input className="edit-input" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              <label className="edit-label">出生日期</label>
              <input className="edit-input" value={editBirth} onChange={(e) => setEditBirth(e.target.value)} />
              <label className="edit-label">个人简介</label>
              <textarea className="edit-textarea" rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setShowEdit(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleSave}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
