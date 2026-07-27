import { ArrowLeft, FileText, Users, Landmark, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import './FamilyInherit.css';

const inheritItems = [
  { id: 'archive', title: '数字档案继承方案', desc: '指定家庭成员作为档案继承人，确保家族记忆代代相传。', status: '已设置', Icon: FileText },
  { id: 'oral', title: '口述史资料托管', desc: '选择可靠的云端或本地托管方式，保障音视频资料长期可访问。', status: '云端托管', Icon: Users },
  { id: 'hall', title: '家风馆运营授权', desc: '授权指定成员继续维护和更新家风馆内容。', status: '待设置', Icon: Landmark },
  { id: 'privacy', title: '隐私与开放权限', desc: '设置哪些内容对家族公开、哪些仅限直系亲属查看。', status: '已设置', Icon: Lock },
];

const heirOptions = ['张明远', '李婉如', '张子涵', '张浩然'];
const scopeOptions = ['家庭数字档案', '口述史音视频', '家风馆内容', '家族相册'];
const conditionOptions = ['账户连续 3 年无登录', '账户连续 1 年无登录', '本人手动确认后生效'];

interface InheritConfig {
  heir: string;
  scopes: string[];
  condition: string;
}

const defaultConfig: InheritConfig = {
  heir: '张子涵',
  scopes: ['家庭数字档案', '家风馆内容'],
  condition: '账户连续 3 年无登录',
};

function loadConfig(id: string): InheritConfig {
  try {
    const raw = localStorage.getItem(`cj_family_inherit_config_${id}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return defaultConfig;
}

export default function FamilyInherit() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const item = inheritItems.find((i) => i.id === id) ?? inheritItems[0];
  const { title, desc, status, Icon } = item;

  const [config, setConfig] = useState<InheritConfig>(() => loadConfig(item.id));
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<InheritConfig>(config);

  const openModal = () => {
    setDraft(config);
    setModalOpen(true);
  };

  const toggleScope = (scope: string) => {
    setDraft((d) => ({
      ...d,
      scopes: d.scopes.includes(scope)
        ? d.scopes.filter((s) => s !== scope)
        : [...d.scopes, scope],
    }));
  };

  const handleSave = () => {
    if (draft.scopes.length === 0) {
      addToast('请至少选择一项继承范围', 'error');
      return;
    }
    try {
      localStorage.setItem(`cj_family_inherit_config_${item.id}`, JSON.stringify(draft));
    } catch {
      // ignore
    }
    setConfig(draft);
    setModalOpen(false);
    addToast('继承配置已保存', 'success');
  };

  return (
    <div className="detail-page family-inherit-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">{title}</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Icon size={16} /> 方案详情</h3>
          <span className={`inherit-status-tag ${status === '待设置' ? 'pending' : ''}`}>{status}</span>
        </div>
        <div className="card-body">
          <p className="inherit-desc">{desc}</p>
          <div className="inherit-section">
            <h4>当前配置</h4>
            <div className="inherit-row-simple">
              <span>继承人</span>
              <strong>{config.heir}</strong>
            </div>
            <div className="inherit-row-simple">
              <span>生效条件</span>
              <strong>{config.condition}</strong>
            </div>
            <div className="inherit-row-simple">
              <span>数据范围</span>
              <strong>{config.scopes.join('、')}</strong>
            </div>
          </div>
          <div className="inherit-actions">
            <button className="btn btn-outline" onClick={() => navigate('/family', { state: { tab: 'inherit' } })}>返回继承中心</button>
            <button className="btn btn-primary" onClick={openModal}>修改配置</button>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title="修改继承配置"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleSave}>保存配置</button>
          </>
        }
      >
        <div className="inherit-form-row">
          <label>继承人</label>
          <select
            value={draft.heir}
            onChange={(e) => setDraft((d) => ({ ...d, heir: e.target.value }))}
          >
            {heirOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div className="inherit-form-row">
          <label>继承范围</label>
          <div className="inherit-scope-group">
            {scopeOptions.map((s) => (
              <label key={s} className="inherit-scope-item">
                <input
                  type="checkbox"
                  checked={draft.scopes.includes(s)}
                  onChange={() => toggleScope(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>
        <div className="inherit-form-row">
          <label>生效条件</label>
          <select
            value={draft.condition}
            onChange={(e) => setDraft((d) => ({ ...d, condition: e.target.value }))}
          >
            {conditionOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
