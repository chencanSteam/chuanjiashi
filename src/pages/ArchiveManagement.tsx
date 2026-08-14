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
import type { AdminArchive } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './ArchiveManagement.css';

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
  const [privacyFilter, setPrivacyFilter] = useState<AdminArchive['privacyStatus'] | 'all'>('all');
  const [detail, setDetail] = useState<AdminArchive | null>(null);

  const load = useCallback(() => {
    adminArchiveApi
      .list({
        keyword: keyword || undefined,
        privacyStatus: privacyFilter,
      })
      .then(setArchives)
      .catch(() => setArchives([]));
  }, [keyword, privacyFilter]);

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

  return (
    <div className="archive-management-page">
      <header className="page-header">
        <h1 className="page-title">人物档案管理</h1>
      </header>

      <div className="card am-list-card">
        <div className="card-header am-list-header">
          <Annotate id="admin-archives.filters" inline>
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
          </Annotate>
        </div>
        <Annotate id="admin-archives.archive-list">
        <div className="card-body am-list-body">
          {archives.length === 0 ? (
            <div className="am-empty">暂无符合条件的档案</div>
          ) : (
            <div className="am-table">
              <div className="am-row am-header">
                <div className="am-cell">主人姓名</div>
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
        </Annotate>
      </div>

      {detail && (
        <Annotate id="admin-archives.detail-drawer">
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
            </div>
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
