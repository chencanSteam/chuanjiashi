import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, Users, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import { familyApi } from '../api/family';
import type { FamilyMember } from '../mocks/types';
import './FamilyMemberList.css';

function getArchiveId() {
  return localStorage.getItem('cj_current_archive_id') ?? 'default';
}

export default function FamilyMemberList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archiveId = useMemo(() => getArchiveId(), []);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    familyApi
      .members(archiveId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [archiveId]);

  const filteredMembers = members.filter((m) => m.name.includes(search));

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (members.some((m) => m.name === name)) {
      addToast('该成员已存在', 'error');
      return;
    }
    try {
      const added = await familyApi.addOrUpdateMember(archiveId, { name, role: '成员', gen: '其他' });
      setMembers((prev) => [...prev, added]);
      setNewName('');
      setShowAdd(false);
      addToast('成员已添加', 'success');
    } catch (err: any) {
      addToast(err.message || '添加失败', 'error');
    }
  };

  return (
    <div className="detail-page member-list-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">家庭成员（{members.length}人）</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">全部成员</h3>
          {!showAdd && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 添加成员</button>}
        </div>
        <div className="card-body">
          {showAdd && (
            <div className="member-add-row">
              <input type="text" placeholder="成员姓名" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} autoFocus />
              <button onClick={handleAdd}>添加</button>
              <button onClick={() => { setShowAdd(false); setNewName(''); }}>取消</button>
            </div>
          )}
          <div className="member-search">
            <Search size={14} />
            <input type="text" placeholder="搜索成员姓名" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="member-list-grid">
            {filteredMembers.map((m) => (
              <div
                className="member-list-item"
                key={m.id}
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
