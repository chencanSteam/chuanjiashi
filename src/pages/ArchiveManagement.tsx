import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  X,
  Image,
  Music,
  FileText,
  Lock,
  Users,
  Globe,
  FolderOpen,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { adminArchiveApi } from '../api/adminArchive';
import type { AdminArchive, ArchiveType } from '../mocks/types';
import './ArchiveManagement.css';

const ARCHIVE_TYPE_LABELS: Record<ArchiveType, string> = {
  self: '本人',
  parent: '父母',
  grandparent: '祖辈',
  relative: '亲友',
  other: '其他',
};

const PRIVACY_LABELS: Record<AdminArchive['privacyStatus'], string> = {
  private: '私密',
  shared: '家人共享',
  public: '公开',
};

const PRIVACY_ICONS: Record<AdminArchive['privacyStatus'], typeof Lock> = {
  private: Lock,
  shared: Users,
  public: Globe,
};

export default function ArchiveManagement() {
  const { addToast } = useToast();
  const [archives, setArchives] = useState<AdminArchive[]>([]);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<ArchiveType | 'all'>('all');
  const [privacyFilter, setPrivacyFilter] = useState<AdminArchive['privacyStatus'] | 'all'>('all');
  const [detail, setDetail] = useState<AdminArchive | null>(null);
  const [privacyTarget, setPrivacyTarget] = useState<{
    archive: AdminArchive;
    next: AdminArchive['privacyStatus'];
  } | null>(null);

  const load = useCallback(() => {
    adminArchiveApi
      .list({
        keyword: keyword || undefined,
        archiveType: typeFilter,
        privacyStatus: privacyFilter,
      })
      .then(setArchives)
      .catch(() => setArchives([]));
  }, [keyword, typeFilter, privacyFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const openDetail = (id: string) => {
    adminArchiveApi
      .get(id)
      .then(setDetail)
      .catch((err) => addToast(err.message || '加载档案详情失败', 'error'));
  };

  const requestPrivacyChange = (archive: AdminArchive, next: AdminArchive['privacyStatus']) => {
    if (next === archive.privacyStatus) return;
    setPrivacyTarget({ archive, next });
  };

  const handlePrivacyChange = async () => {
    if (!privacyTarget) return;
    try {
      await adminArchiveApi.updatePrivacy(privacyTarget.archive.id, privacyTarget.next);
      addToast(`已将「${privacyTarget.archive.ownerName}」的档案调整为${PRIVACY_LABELS[privacyTarget.next]}`, 'success');
      setPrivacyTarget(null);
      setDetail(null);
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '调整失败', 'error');
    }
  };

  return (
    <div className="archive-management-page">
      <header className="page-header">
        <h1 className="page-title">人物档案管理</h1>
      </header>

      <div className="card am-list-card">
        <div className="card-header am-list-header">
          <div className="am-filters">
            <div className="am-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索主人姓名、创建人…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ArchiveType | 'all')}>
              <option value="all">全部类型</option>
              <option value="self">本人</option>
              <option value="parent">父母</option>
              <option value="grandparent">祖辈</option>
              <option value="relative">亲友</option>
              <option value="other">其他</option>
            </select>
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value as AdminArchive['privacyStatus'] | 'all')}
            >
              <option value="all">全部隐私状态</option>
              <option value="private">私密</option>
              <option value="shared">家人共享</option>
              <option value="public">公开</option>
            </select>
          </div>
        </div>
        <div className="card-body am-list-body">
          {archives.length === 0 ? (
            <div className="am-empty">暂无符合条件的档案</div>
          ) : (
            <div className="am-table">
              <div className="am-row am-header">
                <div className="am-cell">主人姓名</div>
                <div className="am-cell">档案类型</div>
                <div className="am-cell">创建人</div>
                <div className="am-cell">素材（图/音/文）</div>
                <div className="am-cell">隐私状态</div>
                <div className="am-cell">完整度</div>
                <div className="am-cell">创建时间</div>
              </div>
              {archives.map((a) => {
                const PrivacyIcon = PRIVACY_ICONS[a.privacyStatus];
                return (
                  <div className="am-row am-row-clickable" key={a.id} onClick={() => openDetail(a.id)}>
                    <div className="am-cell am-cell-name">{a.ownerName}</div>
                    <div className="am-cell">{ARCHIVE_TYPE_LABELS[a.archiveType]}</div>
                    <div className="am-cell">{a.creatorNickname}</div>
                    <div className="am-cell">
                      <span className="am-material-counts">
                        <span><Image size={11} /> {a.materialCounts.image}</span>
                        <span><Music size={11} /> {a.materialCounts.audio}</span>
                        <span><FileText size={11} /> {a.materialCounts.document}</span>
                      </span>
                    </div>
                    <div className="am-cell">
                      <span className={`am-privacy ${a.privacyStatus}`}>
                        <PrivacyIcon size={11} /> {PRIVACY_LABELS[a.privacyStatus]}
                      </span>
                    </div>
                    <div className="am-cell">
                      <div className="am-completion">
                        <div className="am-completion-bar">
                          <div
                            className="am-completion-fill"
                            style={{
                              width: `${Math.min(100, a.completion)}%`,
                              background: a.completion >= 80 ? '#1B5E4B' : a.completion >= 50 ? '#d97706' : '#dc2626',
                            }}
                          />
                        </div>
                        <span>{a.completion}%</span>
                      </div>
                    </div>
                    <div className="am-cell">{new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div className="am-drawer-overlay" onClick={() => setDetail(null)}>
          <div className="am-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="am-drawer-header">
              <h4>档案详情</h4>
              <button className="modal-close" onClick={() => setDetail(null)}><X size={16} /></button>
            </div>
            <div className="am-drawer-body">
              <div className="am-detail-section">
                <div className="am-detail-title"><FolderOpen size={14} /> 基础信息</div>
                <div className="am-detail-row"><span>主人姓名</span><span>{detail.ownerName}</span></div>
                <div className="am-detail-row"><span>档案类型</span><span>{ARCHIVE_TYPE_LABELS[detail.archiveType]}</span></div>
                <div className="am-detail-row"><span>创建人</span><span>{detail.creatorNickname}</span></div>
                <div className="am-detail-row"><span>完整度</span><span>{detail.completion}%</span></div>
                <div className="am-detail-row"><span>创建时间</span><span>{new Date(detail.createdAt).toLocaleString()}</span></div>
              </div>

              <div className="am-detail-section">
                <div className="am-detail-title"><Image size={14} /> 素材列表</div>
                <div className="am-material-list">
                  <div className="am-material-item">
                    <span className="am-material-label"><Image size={13} /> 图片素材</span>
                    <span className="am-material-value">{detail.materialCounts.image} 个</span>
                  </div>
                  <div className="am-material-item">
                    <span className="am-material-label"><Music size={13} /> 音频素材</span>
                    <span className="am-material-value">{detail.materialCounts.audio} 个</span>
                  </div>
                  <div className="am-material-item">
                    <span className="am-material-label"><FileText size={13} /> 文档素材</span>
                    <span className="am-material-value">{detail.materialCounts.document} 个</span>
                  </div>
                </div>
              </div>

              <div className="am-detail-section">
                <div className="am-detail-title"><Lock size={14} /> 隐私状态调整</div>
                <div className="am-privacy-options">
                  {(Object.keys(PRIVACY_LABELS) as AdminArchive['privacyStatus'][]).map((p) => {
                    const Icon = PRIVACY_ICONS[p];
                    return (
                      <button
                        key={p}
                        className={`am-privacy-option ${p} ${detail.privacyStatus === p ? 'active' : ''}`}
                        onClick={() => requestPrivacyChange(detail, p)}
                      >
                        <Icon size={14} /> {PRIVACY_LABELS[p]}
                      </button>
                    );
                  })}
                </div>
                <p className="am-privacy-tip">当前状态：{PRIVACY_LABELS[detail.privacyStatus]}，点击其他状态发起调整</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {privacyTarget && (
        <div className="modal-overlay" onClick={() => setPrivacyTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>确认调整隐私状态</h4>
              <button className="modal-close" onClick={() => setPrivacyTarget(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>
                将「{privacyTarget.archive.ownerName}」的档案从
                {PRIVACY_LABELS[privacyTarget.archive.privacyStatus]}
                调整为{PRIVACY_LABELS[privacyTarget.next]}，是否继续？
              </p>
              <div className="am-confirm-actions">
                <button className="btn btn-outline" onClick={() => setPrivacyTarget(null)}>取消</button>
                <button className="btn btn-primary" onClick={handlePrivacyChange}>确认调整</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
