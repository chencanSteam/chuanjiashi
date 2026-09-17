import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, FileText, ImagePlus, PenLine, RefreshCw, Save, Trash2, TriangleAlert, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import {
  getWorkflowArchiveId,
  getWorkflowArchiveName,
  loadReviewStates,
  loadWorkflowChapters,
  saveReviewStates,
  saveWorkflowChapters,
  stripHtml,
  type ChapterReviewState,
} from '../utils/biographyWorkflow';
import { loadJson, saveJson, type ChapterData } from '../data/aiMock';
import { createCollabInvite, findAccountByPhoneOrIdCard, hasCollaboratorSlotTaken, invitesForArchive, loadActiveCollaborators, removeCollaborator, revokeCollabInvite } from '../data/interviewCollaboration';
import { relationTypeOptions } from '../utils/familyRelations';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/ui/Avatar';
import './BiographyWorkflow.css';
import './BiographyReview.css';

interface ReviewVersion {
  id: string;
  versionNumber: number;
  label: string;
  createdAt: string;
  chapters: ChapterData[];
  /** 与传记生成页共用版本存储，保留文风字段 */
  style?: string;
  reviewStates?: Record<string, ChapterReviewState>;
}

export default function BiographyReview() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const archiveId = useMemo(() => getWorkflowArchiveId(), []);
  const archiveName = useMemo(() => getWorkflowArchiveName(), []);
  const [chapters, setChapters] = useState<ChapterData[]>(() => loadWorkflowChapters(archiveId));
  const [reviewStates, setReviewStates] = useState<Record<string, ChapterReviewState>>(() => loadReviewStates(archiveId));
  const [activeIndex, setActiveIndex] = useState(0);
  const [versions, setVersions] = useState<ReviewVersion[]>(() => loadJson<ReviewVersion[]>(`cj_biography_versions_${archiveId}`, []));
  const [versionLabel, setVersionLabel] = useState('');
  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ReviewVersion | null>(null);
  const [versionAction, setVersionAction] = useState<{ kind: 'restore' | 'delete'; version: ReviewVersion } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invites, setInvites] = useState(() => invitesForArchive(archiveId).filter((item) => item.kind === 'collab' && item.status === 'pending'));
  const [collaborators, setCollaborators] = useState(() => loadActiveCollaborators(archiveId));
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteFound, setInviteFound] = useState<{ phone: string; name?: string } | null>(null);
  const [inviteRelation, setInviteRelation] = useState('配偶');
  const [inviteError, setInviteError] = useState('');
  const [revokeInvite, setRevokeInvite] = useState<{ id: string; name: string; kind: 'pending' | 'active' } | null>(null);
  const [finalOpen, setFinalOpen] = useState(false);
  const [saveState, setSaveState] = useState('已自动保存');
  const nextVersionNumber = versions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;

  useEffect(() => {
    // 每次本地编辑立即保存，取消手动保存按钮后刷新也不会丢失正文或校对进度。
    try {
      localStorage.setItem(`cj_biography_chapters_${archiveId}`, JSON.stringify(chapters));
      localStorage.setItem(`cj_biography_review_${archiveId}`, JSON.stringify(reviewStates));
      setSaveState('已自动保存');
    } catch {
      setSaveState('自动保存失败，请释放浏览器存储空间后重试');
    }
  }, [archiveId, chapters, reviewStates]);

  const refreshInvitations = () => {
    setInvites(invitesForArchive(archiveId).filter((item) => item.kind === 'collab' && item.status === 'pending'));
    setCollaborators(loadActiveCollaborators(archiveId));
  };
  useEffect(() => {
    const refresh = () => {
      setInvites(invitesForArchive(archiveId).filter((item) => item.kind === 'collab' && item.status === 'pending'));
      setCollaborators(loadActiveCollaborators(archiveId));
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
  }, [archiveId]);
  const slotTaken = collaborators.length > 0 || invites.length > 0;
  const checkInvitationSlot = () => {
    if (!hasCollaboratorSlotTaken(archiveId)) return true;
    refreshInvitations();
    setInviteFound(null);
    setInviteError('当前已有协助人或待接受邀请，请先取消权限或撤销邀请后再邀请。');
    return false;
  };
  const findInvitee = () => {
    setInviteFound(null);
    setInviteError('');
    if (!checkInvitationSlot()) return;
    if (!inviteQuery.trim()) { setInviteError('请输入对方注册的手机号或身份证号'); return; }
    const found = findAccountByPhoneOrIdCard(inviteQuery);
    if (!found) { setInviteError('未找到该账号，请核对后重试'); return; }
    if (found.phone === user?.phone) { setInviteError('不能邀请自己'); return; }
    setInviteFound(found);
  };
  const sendInvite = () => {
    if (!checkInvitationSlot() || !inviteFound) return;
    if (inviteFound.phone === user?.phone) { setInviteError('不能邀请自己'); return; }
    createCollabInvite({ kind: 'collab', scope: 'edit', archiveId, archiveName: `${archiveName}的传记`, subjectName: archiveName, inviterName: user?.name || '本人', targetPhone: inviteFound.phone, relation: inviteRelation });
    refreshInvitations();
    setInviteFound(null); setInviteQuery(''); setInviteRelation('配偶'); setInviteError('');
    addToast('邀请已发送，对方在首页接受后即可协助修改传记', 'success');
  };

  useEffect(() => {
    saveJson(`cj_biography_versions_${archiveId}`, versions);
  }, [versions, archiveId]);

  const saveVersion = () => {
    const versionNumber = versions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;
    const version: ReviewVersion = {
      id: `bv_${Date.now()}_${versionNumber}`,
      versionNumber,
      label: versionLabel.trim(),
      createdAt: new Date().toISOString(),
      chapters: chapters.map((chapter) => ({ ...chapter })),
      style: loadJson<string>(`cj_biography_style_${archiveId}`, 'warm'),
      reviewStates: structuredClone(reviewStates),
    };
    setVersions((prev) => [...prev, version]);
    setActiveVersionId(version.id);
    setVersionLabel('');
    setSaveVersionOpen(false);
    addToast(`已保存为 V${versionNumber}${version.label ? ` · ${version.label}` : ''}`, 'success');
  };

  const restoreVersion = (version: ReviewVersion) => {
    const name = `V${version.versionNumber}${version.label ? ` · ${version.label}` : ''}`;
    // 恢复前保留当前工作稿，避免自动保存覆盖后无法找回。
    setVersions((prev) => [...prev, {
      id: `bv_backup_${Date.now()}`, versionNumber: nextVersionNumber,
      label: '恢复前自动备份', createdAt: new Date().toISOString(),
      chapters: structuredClone(chapters), reviewStates: structuredClone(reviewStates),
      style: loadJson<string>(`cj_biography_style_${archiveId}`, 'warm'),
    }]);
    setChapters(version.chapters.map((chapter) => ({ ...chapter })));
    setReviewStates(structuredClone(version.reviewStates || {}));
    if (version.style) saveJson(`cj_biography_style_${archiveId}`, version.style);
    setActiveIndex(0);
    setActiveVersionId(version.id);
    setShowVersions(false);
    setVersionAction(null);
    setSaveState('正在自动保存…');
    addToast(`已切换到 ${name}，可继续校审`, 'success');
  };

  const deleteVersion = (version: ReviewVersion) => {
    setVersions((prev) => prev.filter((item) => item.id !== version.id));
    if (activeVersionId === version.id) setActiveVersionId(null);
    setVersionAction(null);
    addToast('历史版本已删除', 'success');
  };
  const activeChapter = chapters[activeIndex];
  const generatedCount = chapters.filter((chapter) => chapter.status !== 'notGenerated' && chapter.content.trim()).length;
  const reviewedCount = chapters.filter((chapter) => reviewStates[chapter.title]?.status === 'reviewed').length;
  const allGenerated = chapters.length > 0 && generatedCount === chapters.length;
  const allReviewed = allGenerated && reviewedCount === chapters.length;

  const updateContent = (content: string) => {
    setActiveVersionId(null);
    setSaveState('正在自动保存…');
    setChapters((prev) => prev.map((chapter, index) => index === activeIndex
      ? { ...chapter, content, status: 'edited', updatedAt: new Date().toLocaleString('zh-CN') }
      : chapter));
    if (activeChapter) {
      const nextStates = { ...reviewStates, [activeChapter.title]: { status: 'reviewing' as const, updatedAt: new Date().toLocaleString('zh-CN') } };
      setReviewStates(nextStates);
      saveReviewStates(archiveId, nextStates);
    }
  };

  const polishParagraph = () => {
    if (!activeChapter?.content.trim()) return;
    updateContent(`${activeChapter.content}\n\n【AI 校审说明】已完成事实核对提示、语句润色与机械感调整，保留传主本人语言风格。`);
    addToast(`「${activeChapter.title}」已完成校对打磨：纠错、润色、去除机械感，保留本人语言风格`, 'success');
  };

  const markReviewed = () => {
    if (!activeChapter?.content.trim()) {
      addToast('当前章节还没有初稿内容', 'error');
      return;
    }
    const nextStates = {
      ...reviewStates,
      [activeChapter.title]: { status: 'reviewed' as const, updatedAt: new Date().toLocaleString('zh-CN') },
    };
    setReviewStates(nextStates);
    setActiveVersionId(null);
    saveReviewStates(archiveId, nextStates);
    addToast(`「${activeChapter.title}」已标记为完成校对`, 'success');

    // 当前章节确认后自动进入下一章，最后一章保持当前页面不跳转
    if (activeIndex < chapters.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const confirmFinal = () => {
    if (!allReviewed) return;
    saveWorkflowChapters(archiveId, chapters);
    saveReviewStates(archiveId, reviewStates);
    localStorage.setItem(`cj_biography_${archiveId}`, JSON.stringify({
      title: `${archiveName}传记`,
      author: 'AI 整理',
      createdAt: new Date().toLocaleString('zh-CN'),
      completedAt: new Date().toISOString(),
      status: 'final',
      chapters: chapters.map((chapter) => ({ title: chapter.title, content: chapter.content })),
    }));
    addToast('终稿已确认，可在「我的传记」查看终稿与提炼简稿', 'success');
    navigate('/my-works');
  };

  return (
    <div className="workflow-page review-page">
      <header className="page-header workflow-header">
        <div>
          <h1 className="page-title">校审稿</h1>
        </div>
        <div className="workflow-actions">
          <button className="btn btn-outline" onClick={() => { refreshInvitations(); setInviteFound(null); setInviteQuery(''); setInviteError(''); setInviteOpen(true); }}><UserPlus size={14} /> 邀请补充</button>
          <button className="btn btn-outline" onClick={() => setShowVersions(true)}><RefreshCw size={14} /> 历史版本{versions.length ? ` (${versions.length})` : ''}</button>
          <button className="btn btn-outline" onClick={() => setSaveVersionOpen(true)}><Save size={14} /> 保存版本</button>
          <button className="btn btn-primary" onClick={() => setFinalOpen(true)}><CheckCircle2 size={14} /> 确认终稿</button>
        </div>
      </header>

      <div className="workflow-layout">
        <aside className="workflow-panel">
          <div className="workflow-panel-header">
            <h3>章节编辑目录</h3>
            <span>{reviewedCount} 章已确认</span>
          </div>
          <div className="workflow-chapter-list">
            {chapters.map((chapter, index) => {
              const reviewed = reviewStates[chapter.title]?.status === 'reviewed';
              const hasContent = chapter.status !== 'notGenerated' && chapter.content.trim();
              return (
                <button className={`workflow-chapter-item ${activeIndex === index ? 'active' : ''}`} key={`${chapter.title}-${index}`} onClick={() => setActiveIndex(index)} aria-current={activeIndex === index ? 'true' : undefined} type="button">
                  <span className="workflow-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="workflow-chapter-title">{chapter.title}</span>
                  <span className={`workflow-chapter-state ${reviewed ? 'reviewed' : hasContent ? 'done' : ''}`}>{reviewed ? '已校对' : hasContent ? '待校对' : '无内容'}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="workflow-panel workflow-editor">
          {activeChapter ? (
            <>
              <div className="workflow-editor-body">
                <h2 className="workflow-editor-title">{activeChapter.title}</h2>
                <div className="workflow-editor-meta">
                  <span><FileText size={13} /> {stripHtml(activeChapter.content).length || 0} 字</span>
                  <span>{reviewStates[activeChapter.title]?.status === 'reviewed' ? '本章已校对' : '本章待校对'}</span>
                  <span className="review-save-state" role="status">{saveState}</span>
                </div>
                <textarea
                  className="workflow-editor-textarea"
                  aria-label={`${activeChapter.title}正文`}
                  value={stripHtml(activeChapter.content)}
                  onChange={(event) => updateContent(event.target.value)}
                  placeholder="请先合成初稿，再进行校审。"
                />
                {!allGenerated && (
                  <div className="workflow-warning"><TriangleAlert size={15} /> 还有章节未完成初稿，全部章节生成后才能提交终稿。</div>
                )}
              </div>
              <div className="workflow-toolbar review-toolbar">
                <button className="btn btn-outline" onClick={polishParagraph} disabled={!activeChapter.content.trim()}><PenLine size={14} /> AI 校审本章</button>
                <button className="btn btn-outline" onClick={() => updateContent(`${activeChapter.content}\n\n[图片位置：待插入审稿图片]`)}><ImagePlus size={14} /> 插入图片</button>
                <button className="btn btn-primary" onClick={markReviewed} disabled={!activeChapter.content.trim()}><Check size={14} /> 本章确认完成</button>
              </div>
            </>
          ) : (
            <div className="workflow-empty">暂无章节内容，请先完成章节生成。</div>
          )}
        </section>
      </div>

      <Modal open={saveVersionOpen} title="保存当前版本" onClose={() => setSaveVersionOpen(false)} footer={
        <div className="version-modal-actions">
          <button className="btn btn-outline" onClick={() => setSaveVersionOpen(false)}>取消</button>
          <button className="btn btn-primary" onClick={saveVersion}>保存版本</button>
        </div>
      }>
        <div className="version-save-form">
          <label htmlFor="review-version-label">版本名称（可选）</label>
          <input id="review-version-label" value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="如：完成校审第一轮、补充童年细节（可不填）" autoFocus />
          <p>系统将自动命名为 V{nextVersionNumber}。保存当前全部 {chapters.length} 个章节及校对进度（已确认 {reviewedCount} 章），不影响自动保存的工作稿。</p>
        </div>
      </Modal>

      <Modal open={showVersions} title="历史版本" onClose={() => setShowVersions(false)}>
        <div className="biography-version-list">
          {versions.length === 0 ? (
            <div className="biography-version-empty"><RefreshCw size={30} /><p>还没有保存过版本</p><span>点击“保存版本”创建第一个可回溯版本。</span></div>
          ) : versions.slice().reverse().map((version) => (
            <div className={`biography-version-item ${activeVersionId === version.id ? 'active' : ''}`} key={version.id}>
              <div className="biography-version-main">
                <div className="biography-version-title"><strong>V{version.versionNumber}</strong>{version.label && <span>{version.label}</span>}{activeVersionId === version.id && <em>当前版本</em>}</div>
                <small>{new Date(version.createdAt).toLocaleString('zh-CN')} · {version.chapters.length} 章 · {version.reviewStates ? `${Object.values(version.reviewStates).filter((state) => state.status === 'reviewed').length} 章已校对` : '旧版本，无校对进度'}</small>
              </div>
              <div className="biography-version-actions">
                <button className="btn btn-outline btn-sm" onClick={() => { setShowVersions(false); setPreviewVersion(version); }}>预览</button>
                <button className="btn btn-outline btn-sm" onClick={() => { setShowVersions(false); setVersionAction({ kind: 'restore', version }); }}>恢复</button>
                <button className="icon-btn" title="删除版本" onClick={() => { setShowVersions(false); setVersionAction({ kind: 'delete', version }); }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={inviteOpen} title="邀请补充" className="review-dialog" onClose={() => setInviteOpen(false)}>
        <p className="review-dialog-hint">通过手机号或身份证号查找对方账号，对方同意后成为协助人。同一档案同时最多一名协助人，待接受邀请也占用名额，与 AI 智能采访保持一致。</p>
        {slotTaken && <p className="review-slot-hint" role="status">已有协助人或待接受邀请，请先取消权限或撤销邀请后再邀请。</p>}
        <form className="review-invite-search" onSubmit={(event) => { event.preventDefault(); findInvitee(); }}>
          <label htmlFor="review-invite-query">手机号 / 身份证号</label>
          <div className="review-search-row"><input id="review-invite-query" value={inviteQuery} onChange={(event) => { setInviteQuery(event.target.value); setInviteFound(null); setInviteError(''); }} disabled={slotTaken} placeholder="请输入对方注册的手机号或身份证号" /><button className="btn btn-outline" type="submit" disabled={slotTaken}>查找</button></div>
        </form>
        {inviteError && <p className="review-form-error" role="alert">{inviteError}</p>}
        {inviteFound && !slotTaken && <div className="review-found-account">
          <Avatar name={inviteFound.name || inviteFound.phone} size={40} />
          <div><strong>{inviteFound.name || '未设置姓名的用户'}</strong><small>{inviteFound.phone}</small></div>
          <label>与传主关系<select value={inviteRelation} onChange={(event) => setInviteRelation(event.target.value)}>{relationTypeOptions.map((relation) => <option key={relation}>{relation}</option>)}</select></label>
          <button className="btn btn-primary btn-sm" onClick={sendInvite}>发送邀请</button>
        </div>}
        <h4>已邀请人员</h4>
        <div className="review-invite-list">
          {!slotTaken && <p className="review-dialog-hint">暂无协助人，请在上方查找并邀请家人或朋友。</p>}
          {collaborators.map((person) => <article className="review-invite-item" key={person.id}>
            <div className="review-invite-heading"><strong>{person.name}</strong><span>{person.relation}</span><span className="review-invite-state">已接受</span></div>
            <p>{person.phone}</p>
            <div className="review-invite-controls"><button className="btn btn-ghost btn-sm" onClick={() => { setInviteOpen(false); setRevokeInvite({ id: person.id, name: person.name, kind: 'active' }); }}>取消权限</button></div>
          </article>)}
          {invites.map((invite) => <article className="review-invite-item" key={invite.id}>
            <div className="review-invite-heading"><strong>{invite.targetPhone}</strong><span>{invite.relation}</span><span className="review-invite-state">待对方同意</span></div>
            <p>{invite.scope === 'edit' ? '邀请协助修改传记' : '邀请协助采访'}</p>
            <small>{new Date(invite.createdAt).toLocaleString('zh-CN')}</small>
            <div className="review-invite-controls">
              <button className="btn btn-ghost btn-sm" onClick={() => { setInviteOpen(false); setRevokeInvite({ id: invite.id, name: invite.targetPhone, kind: 'pending' }); }}>撤销邀请</button>
            </div>
          </article>)}
        </div>
      </Modal>

      <Modal open={!!revokeInvite} title={revokeInvite?.kind === 'active' ? '取消协助权限' : '撤销邀请'} onClose={() => { setRevokeInvite(null); setInviteOpen(true); }} footer={<div className="version-modal-actions">
        <button className="btn btn-outline" onClick={() => { setRevokeInvite(null); setInviteOpen(true); }}>取消</button>
        <button className="btn btn-primary" onClick={() => { if (!revokeInvite) return; if (revokeInvite.kind === 'active') removeCollaborator(archiveId, revokeInvite.id); else revokeCollabInvite(revokeInvite.id); refreshInvitations(); setRevokeInvite(null); setInviteFound(null); setInviteError(''); setInviteOpen(true); addToast('已释放协助名额，可以重新邀请', 'success'); }}>{revokeInvite?.kind === 'active' ? '确认取消权限' : '确认撤销'}</button>
      </div>}><p>确定{revokeInvite?.kind === 'active' ? '取消' : '撤销'}“{revokeInvite?.name}”的{revokeInvite?.kind === 'active' ? '协助权限' : '邀请'}吗？名额释放后可邀请其他人，已有正文和历史记录不会删除。</p></Modal>

      <Modal open={!!previewVersion} title={`版本预览 · V${previewVersion?.versionNumber ?? ''}`} className="review-dialog" onClose={() => { setPreviewVersion(null); setShowVersions(true); }} footer={<div className="version-modal-actions"><button className="btn btn-outline" onClick={() => { setPreviewVersion(null); setShowVersions(true); }}>返回历史版本</button></div>}>
        <p className="review-dialog-hint">{previewVersion?.label || '未命名版本'} · 只读预览，不会修改当前正文</p>
        {previewVersion?.chapters.map((chapter, index) => <section className="review-version-chapter" key={`${index}-${chapter.title}`}><h4>{chapter.title}</h4><p>{stripHtml(chapter.content) || '本章暂无内容'}</p></section>)}
      </Modal>

      <Modal open={!!versionAction} title={versionAction?.kind === 'restore' ? '恢复历史版本' : '删除历史版本'} onClose={() => { setVersionAction(null); setShowVersions(true); }} footer={<div className="version-modal-actions">
        <button className="btn btn-outline" onClick={() => { setVersionAction(null); setShowVersions(true); }}>取消</button>
        <button className="btn btn-primary" onClick={() => { if (!versionAction) return; if (versionAction.kind === 'restore') restoreVersion(versionAction.version); else { deleteVersion(versionAction.version); setShowVersions(true); } }}>{versionAction?.kind === 'restore' ? '确认恢复' : '确认删除'}</button>
      </div>}><p>{versionAction?.kind === 'restore' ? `恢复 V${versionAction.version.versionNumber} 将替换当前正文及校对进度。系统会先保存“恢复前自动备份”，可随时找回当前内容。旧版本没有校对记录时，所有章节将重新待校对。` : `确定删除 V${versionAction?.version.versionNumber} 吗？删除无法撤销，但不会删除当前正在编辑的正文。`}</p></Modal>

      <Modal open={finalOpen} title={allReviewed ? '确认生成终稿' : '还有章节需要校对'} onClose={() => setFinalOpen(false)} footer={<div className="version-modal-actions"><button className="btn btn-outline" onClick={() => setFinalOpen(false)}>{allReviewed ? '继续检查' : '返回校对'}</button>{allReviewed && <button className="btn btn-primary" onClick={confirmFinal}>确认终稿并查看</button>}</div>}>
        {allReviewed ? <p>《{archiveName}传记》共 {chapters.length} 章、{chapters.reduce((sum, chapter) => sum + stripHtml(chapter.content).length, 0)} 字，已全部确认校对。确认后保存为终稿并进入“我的传记”，历史版本仍会保留。</p> : <div className="review-pending-list">
          <p className="review-dialog-hint">已确认 {reviewedCount} / {chapters.length} 章。点击下面的章节可直接定位处理，完成后再确认终稿。</p>
          {chapters.length === 0 && <p>暂无章节，请先完成初稿。</p>}
          {chapters.map((chapter, index) => ({ chapter, index })).filter(({ chapter }) => chapter.status === 'notGenerated' || !chapter.content.trim() || reviewStates[chapter.title]?.status !== 'reviewed').map(({ chapter, index }) => <button className="review-pending-item" key={`${index}-${chapter.title}`} onClick={() => { setActiveIndex(index); setFinalOpen(false); }}><span>{String(index + 1).padStart(2, '0')}　{chapter.title}</span><span>{chapter.status === 'notGenerated' || !chapter.content.trim() ? '待补充正文' : '待校对'} →</span></button>)}
        </div>}
      </Modal>
    </div>
  );
}
