import { ArrowLeft, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import './FamilyRoles.css';

interface Role {
  name: string;
  title: string;
  members: string[];
  permissions: string;
}

const initialRoles: Role[] = [
  { name: '家主', title: '家主', members: ['张明远'], permissions: '全部权限' },
  { name: '管理员', title: '管理员', members: ['李婉如'], permissions: '成员管理、内容审核' },
  { name: '编辑者', title: '编辑', members: ['张子涵'], permissions: '发布故事、上传相册' },
  { name: '观察者', title: '访客', members: ['张浩然'], permissions: '只读访问' },
];

const STORAGE_KEY = 'cj_family_roles';

function loadRoles(): Role[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return initialRoles;
}

export default function FamilyRoles() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [roles, setRoles] = useState<Role[]>(() => loadRoles());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', permissions: '' });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
    } catch {
      // ignore
    }
  }, [roles]);

  const openCreate = () => {
    setEditingIndex(null);
    setForm({ name: '', title: '', permissions: '' });
    setModalOpen(true);
  };

  const openEdit = (index: number) => {
    const role = roles[index];
    setEditingIndex(index);
    setForm({ name: role.name, title: role.title, permissions: role.permissions });
    setModalOpen(true);
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) {
      addToast('请输入角色名', 'error');
      return;
    }
    if (editingIndex === null) {
      setRoles((prev) => [
        ...prev,
        { name, title: form.title.trim() || name, members: [], permissions: form.permissions.trim() || '只读访问' },
      ]);
      addToast(`已新增角色：${name}`, 'success');
    } else {
      setRoles((prev) =>
        prev.map((r, i) =>
          i === editingIndex
            ? { ...r, name, title: form.title.trim() || name, permissions: form.permissions.trim() || r.permissions }
            : r
        )
      );
      addToast(`已更新角色：${name}`, 'success');
    }
    setModalOpen(false);
  };

  return (
    <div className="detail-page family-roles-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">角色权限</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ 新增角色</button>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Shield size={16} /> 角色列表</h3>
        </div>
        <div className="card-body">
          <table className="roles-table">
            <thead>
              <tr><th>角色</th><th>称谓</th><th>成员</th><th>权限范围</th><th>操作</th></tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={i}>
                  <td><span className="role-name">{r.name}</span></td>
                  <td>{r.title}</td>
                  <td>{r.members.length > 0 ? r.members.join('、') : '—'}</td>
                  <td>{r.permissions}</td>
                  <td><button className="btn btn-ghost btn-xs" onClick={() => openEdit(i)}>编辑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingIndex === null ? '新增角色' : '编辑角色'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleSave}>保存</button>
          </>
        }
      >
        <div className="role-form-row">
          <label>角色名</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="如：管理员"
          />
        </div>
        <div className="role-form-row">
          <label>称谓</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="如：管家、编辑、访客"
          />
        </div>
        <div className="role-form-row">
          <label>权限说明</label>
          <input
            type="text"
            value={form.permissions}
            onChange={(e) => setForm((f) => ({ ...f, permissions: e.target.value }))}
            placeholder="如：成员管理、内容审核"
          />
        </div>
      </Modal>
    </div>
  );
}
