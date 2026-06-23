import { useState } from 'react';
import { ArrowLeft, Search, Users, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import './FamilyMemberList.css';

const initialMembers = [
  { name: '张明远', role: '我', tag: '家主', gen: '第1代' },
  { name: '李婉如', role: '配偶', gen: '第1代' },
  { name: '张子涵', role: '长子', gen: '第2代' },
  { name: '张若曦', role: '儿媳', gen: '第2代' },
  { name: '张浩然', role: '孙子', gen: '第3代' },
  { name: '张志远', role: '祖父', tag: '已故', gen: '第1代' },
  { name: '王淑兰', role: '祖母', tag: '已故', gen: '第1代' },
  { name: '张建国', role: '父亲', gen: '第2代' },
  { name: '李秀英', role: '母亲', gen: '第2代' },
  { name: '张建军', role: '叔叔', gen: '第2代' },
  { name: '刘芳', role: '婶婶', gen: '第2代' },
  { name: '张伟', role: '堂兄', gen: '第3代' },
  { name: '陈静', role: '堂嫂', gen: '第3代' },
];

export default function FamilyMemberList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const filteredMembers = members.filter((m) => m.name.includes(search));

  return (
    <div className="detail-page member-list-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">家庭成员（32人）</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">全部成员</h3>
          {!showAdd && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 添加成员</button>}
        </div>
        <div className="card-body">
          {showAdd && (
            <div className="member-add-row">
              <input type="text" placeholder="成员姓名" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const name = newName.trim(); if (name) { setMembers((prev) => [...prev, { name, role: '成员', gen: '其他' }]); setNewName(''); setShowAdd(false); addToast('成员已添加', 'success'); } } }} autoFocus />
              <button onClick={() => { const name = newName.trim(); if (name) { setMembers((prev) => [...prev, { name, role: '成员', gen: '其他' }]); setNewName(''); setShowAdd(false); addToast('成员已添加', 'success'); } }}>添加</button>
              <button onClick={() => { setShowAdd(false); setNewName(''); }}>取消</button>
            </div>
          )}
          <div className="member-search">
            <Search size={14} />
            <input type="text" placeholder="搜索成员姓名" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="member-list-grid">
            {filteredMembers.map((m, i) => (
              <div
                className="member-list-item"
                key={i}
                onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}
              >
                <Avatar name={m.name} size={48} />
                <div className="member-list-info">
                  <div className="member-list-name">
                    {m.name}
                    <span className="member-list-role">（{m.role}）</span>
                    {m.tag && <span className={`member-list-tag ${m.tag === '已故' ? 'deceased' : ''}`}>{m.tag}</span>}
                  </div>
                  <div className="member-list-gen">{m.gen}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="member-list-actions">
            <button className="btn btn-outline" onClick={() => navigate('/family/members/张明远')}><Users size={14} /> 家庭成员资料</button>
            <button className="btn btn-outline" onClick={() => navigate('/family/relations')}><Clock size={14} /> 关系维护</button>
            <button className="btn btn-outline" onClick={() => navigate('/family/roles')}><BookOpen size={14} /> 角色权限</button>
          </div>
        </div>
      </div>
    </div>
  );
}
