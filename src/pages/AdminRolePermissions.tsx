import { Shield } from 'lucide-react';
import Annotate from '../components/annotation/Annotate';
import './AdminRolePermissions.css';

// 通用角色权限管理：V1.0 阶段仅作说明，多角色权限后续版本开放
export default function AdminRolePermissions() {
  return (
    <div className="role-permission-page">
      <header className="page-header">
        <h2><Shield size={20} /> 角色权限</h2>
        <p>配置后台各角色可访问的功能模块</p>
      </header>

      <Annotate id="admin-roles.placeholder">
      <div className="card rp-placeholder-card">
        <div className="card-body rp-placeholder">
          <Shield size={40} color="#1B5E4B" />
          <h3>通用角色权限管理</h3>
          <p>
            本模块用于管理平台运营后台的角色与权限：为不同角色（如运营、审核、客服）分配可访问的功能模块，
            控制页面查看与操作权限。
          </p>
          <p>
            当前 V1.0 版本仅使用单一「管理员」角色，拥有后台全部权限，无需额外配置。
            多角色创建与细粒度权限分配将在后续版本开放。
          </p>
        </div>
      </div>
      </Annotate>
    </div>
  );
}
