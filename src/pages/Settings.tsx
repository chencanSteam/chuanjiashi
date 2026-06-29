import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Users,
  Database,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Mic,
  BookOpen,
  UserCircle2,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Trash2,
  X,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { loadQuota, type AIQuota } from '../data/aiMock';
import './Settings.css';

const sidebarItems = [
  { key: 'account', icon: User, label: '账户信息' },
  { key: 'quota', icon: Sparkles, label: 'AI额度' },
  { key: 'notification', icon: Bell, label: '通知设置' },
  { key: 'privacy', icon: Shield, label: '隐私与安全' },
  { key: 'family', icon: Users, label: '家庭成员' },
  { key: 'storage', icon: Database, label: '存储与备份' },
  { key: 'help', icon: HelpCircle, label: '帮助与反馈' },
];

const familyMembers = [
  { name: '张一帆', role: '户主', phone: '138****1234', email: 'zhang@example.com' },
  { name: '李秀英', role: '配偶', phone: '139****5678', email: 'li@example.com' },
  { name: '张伟', role: '子女', phone: '137****9012', email: 'wei@example.com' },
];

const initialNotifications = [
  { label: 'AI 采访完成提醒', checked: true },
  { label: '传记章节生成通知', checked: true },
  { label: '家庭成员动态提醒', checked: false },
  { label: '纪念日/节日提醒', checked: true },
  { label: '政务办理进度通知', checked: true },
  { label: '系统更新与公告', checked: false },
];

const helpItems = [
  { label: '常见问题' },
  { label: '新手指引' },
  { label: '联系客服' },
  { label: '意见反馈' },
];

export default function Settings() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();
  const active = sidebarItems.some((item) => item.key === section) ? (section ?? 'account') : 'account';

  const [notifications, setNotifications] = useState(initialNotifications);
  const [smsLogin, setSmsLogin] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFreq, setBackupFreq] = useState('每天');
  const [account, setAccount] = useState({ nickname: '张一帆', realName: '张一帆', phone: '138****1234', email: 'zhang@example.com' });
  const [showPassword, setShowPassword] = useState(false);
  const [members, setMembers] = useState(familyMembers);
  const [showVisibility, setShowVisibility] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [managingMember, setManagingMember] = useState<typeof familyMembers[0] | null>(null);
  const [helpArticle, setHelpArticle] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Record<string, string>>({ 基本信息: '家人可见', 多媒体档案: '家人可见', 人生事件: '部分公开', 成就与作品: '公开展示' });
  const [quota] = useState<AIQuota>(() => loadQuota());

  const toggleNotification = (i: number) => {
    setNotifications((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], checked: !next[i].checked };
      addToast(`${next[i].label} 已${next[i].checked ? '开启' : '关闭'}`, 'success');
      return next;
    });
  };

  return (
    <div className="settings-page">
      <header className="page-header"><h1 className="page-title">系统设置</h1></header>

      <div className="settings-layout">
        <div className="card settings-sidebar">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              className={`settings-nav-item ${active === item.key ? 'active' : ''}`}
              onClick={() => navigate(`/settings/${item.key}`)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <ChevronRight size={14} className="settings-chevron" />
            </div>
          ))}
        </div>

        <div className="settings-content">
          {active === 'account' && (
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">账户信息</h3></div>
              <div className="card-body settings-body">
                <div className="profile-edit">
                  <Avatar name={account.nickname} size={64} />
                  <label className="btn btn-outline">
                    更换头像
                    <input type="file" accept="image/*" hidden onChange={() => addToast('头像已更新', 'success')} />
                  </label>
                </div>
                <div className="form-row">
                  <label>昵称</label>
                  <input type="text" value={account.nickname} onChange={(e) => setAccount((a) => ({ ...a, nickname: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>真实姓名</label>
                  <input type="text" value={account.realName} onChange={(e) => setAccount((a) => ({ ...a, realName: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>手机号码</label>
                  <input type="text" value={account.phone} onChange={(e) => setAccount((a) => ({ ...a, phone: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>电子邮箱</label>
                  <input type="text" value={account.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>绑定微信</label>
                  <div className="bind-tag">已绑定</div>
                </div>
                <button className="btn btn-primary save-btn" onClick={() => addToast('账户信息已保存', 'success')}>保存修改</button>
              </div>
            </div>
          )}

          {active === 'notification' && (
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">通知设置</h3></div>
              <div className="card-body settings-body">
                {notifications.map((n, i) => (
                  <div className="setting-row" key={i}>
                    <span>{n.label}</span>
                    <div className={`toggle-switch ${n.checked ? 'on' : ''}`} onClick={() => toggleNotification(i)}></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'privacy' && (
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">隐私与安全</h3></div>
              <div className="card-body settings-body">
                <div className="setting-row"><span>登录密码</span><button className="btn btn-outline" onClick={() => setShowPassword(true)}>修改</button></div>
                <div className="setting-row"><span>手机验证码登录</span><div className={`toggle-switch ${smsLogin ? 'on' : ''}`} onClick={() => { setSmsLogin((v) => !v); addToast(`手机验证码登录已${!smsLogin ? '开启' : '关闭'}`, 'success'); }}></div></div>
                <div className="setting-row"><span>两步验证</span><div className={`toggle-switch ${twoFactor ? 'on' : ''}`} onClick={() => { setTwoFactor((v) => !v); addToast(`两步验证已${!twoFactor ? '开启' : '关闭'}`, 'success'); }}></div></div>
                <div className="setting-row"><span>家庭成员可见范围</span><button className="btn btn-outline" onClick={() => setShowVisibility(true)}>管理</button></div>
                <div className="danger-zone">
                  <div className="danger-title"><Trash2 size={16} /> 注销账户</div>
                  <p>注销后，您的所有个人数据将被清除，且不可恢复。</p>
                  <button className="btn btn-danger" onClick={() => setShowDelete(true)}>申请注销</button>
                </div>
              </div>
            </div>
          )}

          {active === 'family' && (
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">家庭成员</h3><button className="btn btn-primary" onClick={() => { const name = window.prompt('请输入成员姓名'); if (name) setMembers((prev) => [...prev, { name, role: '成员', phone: '-', email: '-' }]); }}>添加成员</button></div>
              <div className="card-body settings-body">
                {members.map((m, i) => (
                  <div className="family-member-row" key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                    <Avatar name={m.name} size={40} />
                    <div className="member-main">
                      <div className="member-name">{m.name}<span className="member-role">{m.role}</span></div>
                      <div className="member-contact">{m.phone} · {m.email}</div>
                    </div>
                    <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); setManagingMember(m); }}>管理</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'storage' && (
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">存储与备份</h3></div>
              <div className="card-body settings-body">
                <div className="storage-bar">
                  <div className="storage-used" style={{ width: '62%' }}></div>
                </div>
                <div className="storage-info">已使用 6.2 GB / 10 GB</div>
                <div className="setting-row"><span>自动备份</span><div className={`toggle-switch ${autoBackup ? 'on' : ''}`} onClick={() => { setAutoBackup((v) => !v); addToast(`自动备份已${!autoBackup ? '开启' : '关闭'}`, 'success'); }}></div></div>
                <div className="setting-row"><span>备份频率</span><select value={backupFreq} onChange={(e) => { setBackupFreq(e.target.value); addToast(`备份频率：${e.target.value}`, 'info'); }}><option>每天</option><option>每周</option></select></div>
                <button className="btn btn-outline" onClick={() => addToast('立即备份', 'success')}>立即备份</button>
              </div>
            </div>
          )}

          {active === 'quota' && (
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title"><Sparkles size={16} /> AI 额度</h3></div>
              <div className="card-body settings-body">
                <div className="setting-row">
                  <span>当前套餐</span>
                  <strong>{quota.plan}</strong>
                </div>
                {[
                  { key: 'interviewQuestion', label: 'AI采访问题', icon: Mic },
                  { key: 'followUp', label: 'AI延伸问题', icon: Sparkles },
                  { key: 'biographyGenerate', label: '传记生成', icon: BookOpen },
                  { key: 'digitalDialog', label: '数字人对话', icon: UserCircle2 },
                ].map((item) => {
                  const q = quota[item.key as keyof AIQuota] as { used: number; total: number };
                  const pct = Math.round((q.used / q.total) * 100);
                  return (
                    <div className="setting-row" key={item.key}>
                      <span><item.icon size={14} /> {item.label}</span>
                      <div className="quota-line" style={{ minWidth: 160, gap: 12 }}>
                        <div className="usage-bar">
                          <div className="usage-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span>{q.used} / {q.total}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="setting-row">
                  <span><FolderOpen size={14} /> 素材存储</span>
                  <div className="quota-line" style={{ minWidth: 160, gap: 12 }}>
                    <div className="usage-bar">
                      <div className="usage-fill storage" style={{ width: `${Math.round((quota.storage.usedMB / quota.storage.totalMB) * 100)}%` }} />
                    </div>
                    <span>{quota.storage.usedMB}MB / {quota.storage.totalMB}MB</span>
                  </div>
                </div>
                {(quota.interviewQuestion.used >= quota.interviewQuestion.total || quota.followUp.used >= quota.followUp.total || quota.biographyGenerate.used >= quota.biographyGenerate.total || quota.digitalDialog.used >= quota.digitalDialog.total) && (
                  <div className="quota-alert">
                    <AlertCircle size={14} /> 部分额度已用完，可点击下方按钮升级套餐。
                  </div>
                )}
                <button className="btn btn-primary save-btn" onClick={() => addToast('已跳转至套餐升级（演示）', 'info')}>升级套餐</button>
              </div>
            </div>
          )}

          {active === 'help' && (
            <div className="card settings-card">
              <div className="card-header"><h3 className="card-title">帮助与反馈</h3></div>
              <div className="card-body settings-body">
                {helpItems.map((h, i) => (
                  <div className="help-item" key={i} onClick={() => setHelpArticle(h.label)}>
                    <CheckCircle size={16} color="#1B5E4B" /> {h.label}
                  </div>
                ))}
                <div className="about-box">
                  <div>传家世 v1.0.0</div>
                  <div className="about-meta">© 2026 传家世科技</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPassword && (
        <div className="modal-overlay" onClick={() => setShowPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>修改登录密码</h4><button className="modal-close" onClick={() => setShowPassword(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <input type="password" placeholder="当前密码" className="modal-input" />
              <input type="password" placeholder="新密码" className="modal-input" />
              <input type="password" placeholder="确认新密码" className="modal-input" />
              <button className="btn btn-primary" onClick={() => { setShowPassword(false); addToast('密码已修改', 'success'); }}>确认修改</button>
            </div>
          </div>
        </div>
      )}

      {showVisibility && (
        <div className="modal-overlay" onClick={() => setShowVisibility(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>管理可见范围</h4><button className="modal-close" onClick={() => setShowVisibility(false)}><X size={16} /></button></div>
            <div className="modal-body">
              {Object.entries(visibility).map(([label, value]) => (
                <div className="visibility-row" key={label}>
                  <span>{label}</span>
                  <select value={value} onChange={(e) => setVisibility((prev) => ({ ...prev, [label]: e.target.value }))}>
                    <option>仅自己</option>
                    <option>家人可见</option>
                    <option>部分公开</option>
                    <option>公开展示</option>
                  </select>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => { setShowVisibility(false); addToast('可见范围已保存', 'success'); }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>注销账户</h4><button className="modal-close" onClick={() => setShowDelete(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>注销后数据不可恢复。请输入「确认注销」以继续。</p>
              <input type="text" className="modal-input" placeholder="确认注销" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              <button className="btn btn-danger" style={{ width: '100%' }} disabled={deleteConfirm !== '确认注销'} onClick={() => { setShowDelete(false); addToast('账户注销申请已提交', 'error'); }}>确认注销</button>
            </div>
          </div>
        </div>
      )}

      {managingMember && (
        <div className="modal-overlay" onClick={() => setManagingMember(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>管理成员：{managingMember.name}</h4><button className="modal-close" onClick={() => setManagingMember(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div className="form-row"><label>角色</label><input type="text" value={managingMember.role} onChange={(e) => setMembers((prev) => prev.map((m) => m.name === managingMember.name ? { ...m, role: e.target.value } : m))} /></div>
              <div className="form-row"><label>手机</label><input type="text" value={managingMember.phone} onChange={(e) => setMembers((prev) => prev.map((m) => m.name === managingMember.name ? { ...m, phone: e.target.value } : m))} /></div>
              <div className="form-row"><label>邮箱</label><input type="text" value={managingMember.email} onChange={(e) => setMembers((prev) => prev.map((m) => m.name === managingMember.name ? { ...m, email: e.target.value } : m))} /></div>
              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => { setManagingMember(null); addToast('成员信息已保存', 'success'); }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {helpArticle && (
        <div className="modal-overlay" onClick={() => setHelpArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{helpArticle}</h4><button className="modal-close" onClick={() => setHelpArticle(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>这里是「{helpArticle}」的详细说明。您可以通过左侧菜单查看更多帮助内容。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
