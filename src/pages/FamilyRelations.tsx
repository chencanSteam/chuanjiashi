import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users, Plus, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { relationTypeOptions } from '../utils/familyRelations';
import { familyApi } from '../api/family';
import type { FamilyRelation, FamilyMember } from '../mocks/types';
import './FamilyRelations.css';

function getArchiveId() {
  return localStorage.getItem('cj_current_archive_id') ?? 'default';
}



export default function FamilyRelations() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archiveId = useMemo(() => getArchiveId(), []);
  const [relations, setRelations] = useState<FamilyRelation[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    familyApi
      .relations(archiveId)
      .then(setRelations)
      .catch(() => setRelations([]));
    familyApi
      .members(archiveId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [archiveId]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [relation, setRelation] = useState(relationTypeOptions[0]);



  const memberNames = members.map((m) => m.name);
  const allNames = Array.from(new Set([...memberNames, ...relations.flatMap((r) => [r.from, r.to])]));

  const handleAdd = async () => {
    if (!from.trim() || !to.trim()) {
      addToast('请填写双方姓名', 'error');
      return;
    }
    if (from.trim() === to.trim()) {
      addToast('不能与自己建立关系', 'error');
      return;
    }
    const exists = relations.some(
      (r) =>
        (r.from === from.trim() && r.to === to.trim()) ||
        (r.from === to.trim() && r.to === from.trim())
    );
    if (exists) {
      addToast('该关系已存在', 'error');
      return;
    }
    try {
      const added = await familyApi.addRelation(archiveId, { from: from.trim(), to: to.trim(), relation });
      setRelations((prev) => [...prev, added]);
      setFrom('');
      setTo('');
      setRelation(relationTypeOptions[0]);
      setShowAdd(false);
      addToast('关系已添加', 'success');
    } catch (err: any) {
      addToast(err.message || '添加失败', 'error');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await familyApi.removeRelation(archiveId, id);
      setRelations((prev) => prev.filter((r) => r.id !== id));
      addToast('关系已删除', 'info');
    } catch (err: any) {
      addToast(err.message || '删除失败', 'error');
    }
  };

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
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 添加关系</button>
        </div>
        <div className="card-body">
          {showAdd && (
            <div className="relation-add-form">
              <input list="member-names" type="text" placeholder="甲方姓名" value={from} onChange={(e) => setFrom(e.target.value)} />
              <select value={relation} onChange={(e) => setRelation(e.target.value)}>
                {relationTypeOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input list="member-names" type="text" placeholder="乙方姓名" value={to} onChange={(e) => setTo(e.target.value)} />
              <datalist id="member-names">
                {allNames.map((n) => <option key={n} value={n} />)}
              </datalist>
              <button className="btn btn-primary" onClick={handleAdd}>添加</button>
              <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setFrom(''); setTo(''); }}><X size={14} /></button>
            </div>
          )}
          {relations.map((r) => (
            <div className="relation-row" key={r.id}>
              <div className="relation-person" onClick={() => navigate(`/family/members/${encodeURIComponent(r.from)}`)}>
                <Avatar name={r.from} size={32} />
                <span>{r.from}</span>
              </div>
              <span className="relation-label">{r.relation}</span>
              <div className="relation-person" onClick={() => navigate(`/family/members/${encodeURIComponent(r.to)}`)}>
                <Avatar name={r.to} size={32} />
                <span>{r.to}</span>
              </div>
              <button className="relation-delete" onClick={() => handleRemove(r.id)} title="删除">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {relations.length === 0 && <div className="relation-empty">暂无关系，点击右上角添加</div>}
        </div>
      </div>
    </div>
  );
}
