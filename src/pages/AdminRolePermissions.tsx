import { useState } from 'react';
import { Shield, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './AdminRolePermissions.css';

interface RolePermission {
  role: string;
  desc: string;
  members: number;
  permissions: Record<string, boolean>;
}

const permissionModules = ['用户管理', '人物档案', 'AI 任务', '消息通知', '系统设置'];

const initialRoles: RolePermission[] = [
  {
    role: '超级管理员',
    desc: '拥有全部权限，可管理其他管理员',
    members: 1,
    permissions: { 用户管理: true, 人物档案: true, 'AI 任务': true, 消息通知: true, 系统设置: true },
  },
  {
    role: '运营人员',
    desc: '负责用户与档案日常运营',
    members: 3,
    permissions: { 用户管理: true, 人物档案: true, 'AI 任务': true, 消息通知: true, 系统设置: false },
  },
  {
    role: '内容审核',
    desc: '负责人物档案与生成内容审核',
    members: 2,
    permissions: { 用户管理: false, 人物档案: true, 'AI 任务': false, 消息通知: false, 系统设置: false },
  },
  {
    role: '客服人员',
    desc: '查看用户信息，处理用户反馈',
    members: 4,
    permissions: { 用户管理: true, 人物档案: false, 'AI 任务': false, 消息通知: true, 系统设置: false },
  },
];

export default function AdminRolePermissions() {
  const { addToast } = useToast();
  const [roles, setRoles] = useState(initialRoles);

  const togglePermission = (roleIndex: number, module: string) => {
    setRoles((prev) => {
      const next = prev.map((r, i) =>
        i === roleIndex ? { ...r, permissions: { ...r.permissions, [module]: !r.permissions[module] } } : r,
      );
      const changed = next[roleIndex];
      addToast(`「${changed.role}」的${module}权限已${changed.permissions[module] ? '开启' : '关闭'}`, 'success');
      return next;
    });
  };

  return (
    <div className="role-permission-page">
      <header className="page-header">
        <h2><Shield size={20} /> 角色权限</h2>
        <p>管理后台角色及其功能权限</p>
      </header>

      <div className="card rp-card">
        <div className="card-header">
          <h3 className="card-title">角色列表</h3>
        </div>
        <div className="card-body">
          <table className="rp-table">
            <thead>
              <tr>
                <th>角色</th>
                <th>说明</th>
                <th>成员数</th>
                {permissionModules.map((m) => <th key={m}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={r.role}>
                  <td className="rp-role-name">{r.role}</td>
                  <td className="rp-role-desc">{r.desc}</td>
                  <td>
                    <span className="rp-members"><Users size={13} /> {r.members}</span>
                  </td>
                  {permissionModules.map((m) => (
                    <td key={m}>
                      <div
                        className={`toggle-switch ${r.permissions[m] ? 'on' : ''}`}
                        role="switch"
                        aria-checked={r.permissions[m]}
                        onClick={() => togglePermission(i, m)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
