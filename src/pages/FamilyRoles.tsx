import { ArrowLeft, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FamilyRoles.css';

const initialRoles = [
  { name: '家主', members: ['张明远'], permissions: '全部权限' },
  { name: '管理员', members: ['李婉如'], permissions: '成员管理、内容审核' },
  { name: '编辑者', members: ['张子涵'], permissions: '发布故事、上传相册' },
  { name: '观察者', members: ['张浩然'], permissions: '只读访问' },
];

export default function FamilyRoles() {
  const navigate = useNavigate();
  const [roles] = useState(initialRoles);

  return (
    <div className="detail-page family-roles-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">角色权限</h1>
        <button className="btn btn-primary">+ 新增角色</button>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Shield size={16} /> 角色列表</h3>
        </div>
        <div className="card-body">
          <table className="roles-table">
            <thead>
              <tr><th>角色</th><th>成员</th><th>权限范围</th><th>操作</th></tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={i}>
                  <td><span className="role-name">{r.name}</span></td>
                  <td>{r.members.join('、')}</td>
                  <td>{r.permissions}</td>
                  <td><button className="btn btn-ghost btn-xs">编辑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
