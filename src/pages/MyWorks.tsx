import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic, Trash2, User, Plus, ChevronRight, UploadCloud, Download, Printer, QrCode, FileText, PenLine, Sparkles, UserPlus, type LucideIcon } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { archiveApi } from '../api/archive';
import { orderApi } from '../api/order';
import { paymentApi } from '../api/payment';
import { bookshelfApi } from '../api/bookshelf';
import PublishBookModal from '../components/PublishBookModal';
import Modal from '../components/ui/Modal';
import { getWorkStatus, type WorkStatus } from '../utils/works';
import { loadReviewStates, loadWorkflowChapters } from '../utils/biographyWorkflow';
import Annotate from '../components/annotation/Annotate';
import './MyWorks.css';

interface Archive {
  id: string;
  name: string;
  gender: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

interface WorkItem extends Archive {
  status: WorkStatus;
}

function loadLegacyArchives(): Archive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function extractYear(date?: string): string {
  if (!date) return '';
  return date.split('-')[0] || '';
}

function getStatusClass(status: WorkStatus): string {
  return status === '已完成' ? 'success' : 'warning';
}

function loadLicenseSettings(items: WorkItem[]): Record<string, { isFree: boolean; price: number; trialWords: number }> {
  const map: Record<string, { isFree: boolean; price: number; trialWords: number }> = {};
  items.forEach((w) => {
    try {
      const raw = localStorage.getItem(`cj_work_license_settings_${w.id}`);
      if (raw) map[w.id] = JSON.parse(raw);
    } catch {
      // ignore
    }
  });
  return map;
}

/** mock 创作者收益（按作品 id 生成稳定伪随机数据） */
function mockEarnings(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  const sold = (hash % 180) + 6;
  const price = [9.9, 19.9, 29.9][hash % 3];
  return { sold, price, total: sold * price };
}

/** 传记增值付费服务 */
type PaidServiceKey = 'download' | 'publish' | 'qrcode';

interface PaidService {
  key: PaidServiceKey;
  label: string;
  price: number;
  desc: string;
  orderType: 'biography' | 'book' | 'qrcode';
}

const paidServices: PaidService[] = [
  { key: 'download', label: '下载 PDF', price: 9.9, desc: '高清排版 PDF，可保存与自行打印', orderType: 'biography' },
  { key: 'publish', label: '出版实体书', price: 59, desc: '精装印刷成书，配送到家', orderType: 'book' },
  { key: 'qrcode', label: '生成二维码', price: 19.9, desc: '生成传记专属二维码，扫码即可阅读', orderType: 'qrcode' },
];

function loadPaidServices(workId: string): PaidServiceKey[] {
  try {
    const raw = localStorage.getItem(`cj_work_paid_${workId}`);
    if (raw) return JSON.parse(raw) as PaidServiceKey[];
  } catch {
    // ignore
  }
  return [];
}

function savePaidService(workId: string, key: PaidServiceKey) {
  const list = loadPaidServices(workId);
  if (!list.includes(key)) {
    localStorage.setItem(`cj_work_paid_${workId}`, JSON.stringify([...list, key]));
  }
}

export default function MyWorks() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [publishingWork, setPublishingWork] = useState<WorkItem | null>(null);
  const [licenseSettings, setLicenseSettings] = useState<Record<string, { isFree: boolean; price: number; trialWords: number }>>({});
  const [payTarget, setPayTarget] = useState<{ work: WorkItem; service: PaidService } | null>(null);
  const [paying, setPaying] = useState(false);
  const [qrWork, setQrWork] = useState<WorkItem | null>(null);
  const [paidMap, setPaidMap] = useState<Record<string, PaidServiceKey[]>>({});
  const [briefReady, setBriefReady] = useState<Record<string, boolean>>({});
  const refreshBookStatuses = async () => {
    try {
      await bookshelfApi.myList();
    } catch {
      // 书架状态仅用于刷新演示数据，不影响当前页面展示
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const mockArchives = await archiveApi.list();
        const legacyArchives = loadLegacyArchives();
        const mergedMap = new Map<string, Archive>();
        mockArchives.forEach((a) => {
          mergedMap.set(a.id, {
            id: a.id,
            name: a.name,
            gender: a.gender === 'female' ? '女' : '男',
            birthYear: extractYear(a.birthDate),
            origin: a.birthPlace || '',
            occupation: '',
          });
        });
        legacyArchives.forEach((a) => {
          if (!mergedMap.has(a.id)) mergedMap.set(a.id, a);
        });
        const items = Array.from(mergedMap.values()).map((a) => ({ ...a, status: getWorkStatus(a.id) }));
        setWorks(items);
        setLicenseSettings(loadLicenseSettings(items));
        const paid: Record<string, PaidServiceKey[]> = {};
        items.forEach((w) => { paid[w.id] = loadPaidServices(w.id); });
        setPaidMap(paid);
        await refreshBookStatuses();
      } catch {
        const legacyArchives = loadLegacyArchives();
        const items = legacyArchives.map((a) => ({ ...a, status: getWorkStatus(a.id) }));
        setWorks(items);
        setLicenseSettings(loadLicenseSettings(items));
        const paid: Record<string, PaidServiceKey[]> = {};
        items.forEach((w) => { paid[w.id] = loadPaidServices(w.id); });
        setPaidMap(paid);
        await refreshBookStatuses();
      } finally {
        // ignore
      }
    };
    load();
  }, []);

  const deleteWork = (id: string) => {
    if (!window.confirm('确定要删除该作品及关联数据吗？此操作不可恢复。')) return;
    const next = works.filter((w) => w.id !== id);
    setWorks(next);
    localStorage.setItem('cj_archives', JSON.stringify(next));
    localStorage.removeItem(`cj_events_${id}`);
    localStorage.removeItem(`cj_event_tags_${id}`);
    localStorage.removeItem(`cj_media_${id}`);
    localStorage.removeItem(`cj_members_${id}`);
    localStorage.removeItem(`cj_biography_${id}`);
    localStorage.removeItem(`cj_interview_outline_${id}`);
    localStorage.removeItem(`cj_interview_transcript_${id}`);
    localStorage.removeItem(`cj_interview_transcript_mobile_${id}`);
    localStorage.removeItem(`cj_interview_session_${id}`);
    localStorage.removeItem(`cj_interview_answers_${id}`);
    localStorage.removeItem(`cj_interview_notes_${id}`);
    localStorage.removeItem(`cj_biography_comments_${id}`);
    localStorage.removeItem(`cj_biography_likes_${id}`);
    const current = localStorage.getItem('cj_current_archive_id');
    if (current === id) {
      localStorage.setItem('cj_current_archive_id', next[0]?.id || '');
    }
    addToast('作品已删除', 'info');
  };

  const openWork = (work: WorkItem) => {
    localStorage.setItem('cj_current_archive_id', work.id);
    if (work.status === '已完成') {
      navigate('/biography/print');
    } else if (localStorage.getItem(`cj_polish_doc_${work.id}`)) {
      // 已有传记上传草稿：回到原上传润色页继续编辑
      navigate('/polish');
    } else if (localStorage.getItem(`cj_biography_chapters_${work.id}`)) {
      // AI传记章节草稿：回到传记编辑器，而不是重新采访
      navigate('/biography');
    } else {
      navigate('/interview');
    }
  };

  const canPublish = (work: WorkItem) => work.status === '已完成';

  // 付费服务：已购买直接执行，未购买先弹支付确认
  const runPaidService = (work: WorkItem, service: PaidService) => {
    if (service.key === 'download') {
      localStorage.setItem('cj_current_archive_id', work.id);
      navigate('/biography/print');
    } else if (service.key === 'publish') {
      addToast('出版订单已提交，可在「我的订单」查看进度', 'success');
    } else {
      setQrWork(work);
    }
  };

  const handlePaidService = (work: WorkItem, service: PaidService) => {
    if ((paidMap[work.id] || []).includes(service.key)) {
      runPaidService(work, service);
      return;
    }
    setPayTarget({ work, service });
  };

  const handleConfirmPay = async () => {
    if (!payTarget) return;
    const { work, service } = payTarget;
    setPaying(true);
    try {
      const order = await orderApi.create({
        type: service.orderType,
        productId: `${service.key}_${work.id}`,
        productName: `${work.name}的传记 · ${service.label}`,
        amount: service.price,
      });
      await paymentApi.pay(order.id, 'wechat');
      savePaidService(work.id, service.key);
      setPaidMap((prev) => ({ ...prev, [work.id]: [...(prev[work.id] || []), service.key] }));
      addToast(`支付成功，${service.label}已开通`, 'success');
      setPayTarget(null);
      runPaidService(work, service);
    } catch (err) {
      addToast(err instanceof Error ? err.message : '支付失败，请稍后重试', 'error');
    } finally {
      setPaying(false);
    }
  };

  const openDraft = (work: WorkItem, draftKey: string) => {
    localStorage.setItem('cj_current_archive_id', work.id);
    if (draftKey === 'draft') navigate('/biography');
    else if (draftKey === 'review') navigate('/biography/review');
    else navigate('/biography/print');
  };

  const startReview = (work: WorkItem) => {
    localStorage.setItem('cj_current_archive_id', work.id);
    navigate('/biography/review');
  };

  const inviteSupplement = (work: WorkItem, draftName: string) => {
    addToast(`已生成《${work.name}的传记》${draftName}补充邀请，可分享给家人朋友共同完善`, 'success');
  };

  const extractBrief = (work: WorkItem) => {
    setBriefReady((prev) => ({ ...prev, [work.id]: true }));
    try { localStorage.setItem(`cj_work_brief_${work.id}`, '1'); } catch { /* ignore */ }
    addToast('已在终稿基础上提炼简稿（1000字以内 · 人生梗概）', 'success');
  };

  const isBriefGenerated = (workId: string) => {
    if (briefReady[workId]) return true;
    try { return localStorage.getItem(`cj_work_brief_${workId}`) === '1'; } catch { return false; }
  };

  return (
    <div className="my-works-page">
      <header className="page-header">
        <h1 className="page-title">我的传记</h1>
        <Annotate id="my-works.new-biography" inline>
        <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
          <Plus size={14} /> 新建传记
        </button>
        </Annotate>
      </header>

      {works.length === 0 ? (
        <div className="card works-empty">
          <User size={40} color="#9ca3af" />
          <p>暂无传记，开始记录第一份人生传记吧</p>
          <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
            <Plus size={14} /> 新建传记
          </button>
        </div>
      ) : (
        <div className="works-grid">
          {works.map((work) => {
            const earnings = mockEarnings(work.id);
            const setting = licenseSettings[work.id];
            // 原型按作品完成状态展示收益：已完成的传记可展示 mock 收益，未完成作品不展示。
            const showEarnings = work.status === '已完成';
            // 单价优先使用创作者实际设置的售价，取不到再退回 mock 伪随机
            const unitPrice = setting ? setting.price : earnings.price;
            const totalEarnings = earnings.sold * unitPrice;
            // 稿件版本：初稿 / 校审稿为过程稿，最终沉淀终稿 / 简稿两个版本
            const draftReady = work.status !== '采访进行中';
            const reviewStates = loadReviewStates(work.id);
            const reviewChapters = loadWorkflowChapters(work.id);
            const reviewStarted = Object.values(reviewStates).some((state) => state.status === 'reviewing');
            const finalReady = work.status === '已完成';
            const reviewReady = finalReady || (reviewChapters.length > 0 && reviewChapters.every((chapter) => reviewStates[chapter.title]?.status === 'reviewed'));
            const briefGenerated = isBriefGenerated(work.id);
            const drafts: Array<{ key: string; name: string; process: boolean; icon: LucideIcon; desc: string; ready: boolean; invite?: boolean }> = [
              { key: 'draft', name: '初稿', process: true, icon: FileText, desc: '所有篇章整合串联，统一时间线、统一文风、统一叙事逻辑', ready: draftReady, invite: true },
              { key: 'review', name: '校审稿', process: true, icon: PenLine, desc: '逐字校对纠错、优化语句、补充细节、去除机械感，全文打磨至温润、庄重、有温度', ready: reviewReady, invite: true },
              { key: 'final', name: '终稿', process: false, icon: BookOpen, desc: '八大篇章齐全 · 全人生记录', ready: finalReady },
              { key: 'brief', name: '简稿', process: false, icon: Sparkles, desc: '1000字以内 · 人生梗概 · 极简留存', ready: briefGenerated },
            ];
            return (
            <div className="card work-card" key={work.id}>
              <div className="card-body work-body">
                <Annotate id="my-works.work-status">
                <div className="work-main">
                  <Avatar name={work.name} size={48} />
                  <div className="work-info">
                    <div className="work-name">{work.name}的传记</div>
                    <span className={`work-status ${getStatusClass(work.status)}`}>{work.status}</span>
                  </div>
                </div>
                </Annotate>
                <div className="work-extra">
                  <Annotate id="my-works.earnings">
                  {showEarnings ? (
                    <div className="work-earnings">
                      <div className="work-earnings-item">
                        <span className="work-earnings-value">{earnings.sold}</span>
                        <span className="work-earnings-label">售出份数</span>
                      </div>
                      <div className="work-earnings-item">
                        <span className="work-earnings-value">
                          {setting?.isFree ? '免费' : `¥${unitPrice.toFixed(2)}`}
                        </span>
                        <span className="work-earnings-label">单价</span>
                      </div>
                      <div className="work-earnings-item">
                        <span className="work-earnings-value work-earnings-total">
                          ¥{totalEarnings.toFixed(2)}
                        </span>
                        <span className="work-earnings-label">累计收益</span>
                      </div>
                    </div>
                  ) : (
                    <div className="work-earnings-placeholder">
                      <span className="work-earnings-placeholder-title">暂无收益数据</span>
                      <span className="work-earnings-placeholder-label">
                        {work.status === '已完成' ? '上架并审核通过后开始统计' : '完成传记并上架后开始统计'}
                      </span>
                    </div>
                  )}
                  </Annotate>
                  {work.status === '已完成' && setting && (
                    <div className="work-license-detail">
                      <span>{setting.isFree ? '免费公开' : `售价 ¥${setting.price.toFixed(2)}`} · 试看 {setting.trialWords} 字</span>
                    </div>
                  )}
                </div>
                <div className="work-drafts">
                  <div className="work-drafts-header">
                    <span className="work-drafts-title">稿件版本</span>
                    <span className="work-drafts-tip">初稿、校审稿为过程稿，最终沉淀终稿与简稿两个版本</span>
                  </div>
                  <div className="work-drafts-grid">
                    {drafts.map((draft) => (
                      <div className="work-draft-item" key={draft.key}>
                        <div className="work-draft-head">
                          <draft.icon size={14} />
                          <span className="work-draft-name">{draft.name}</span>
                          <em className={`work-draft-tag ${draft.process ? 'process' : 'final'}`}>
                            {draft.process ? '过程稿' : '最终版'}
                          </em>
                        </div>
                        <p className="work-draft-desc">{draft.desc}</p>
                        <div className="work-draft-foot">
                          {draft.key === 'brief' ? (
                            briefGenerated ? (
                              <>
                                <span className="work-draft-status ready">已生成 · 986 字</span>
                                <button type="button" className="work-draft-btn" onClick={() => openDraft(work, draft.key)}>查看</button>
                              </>
                            ) : finalReady ? (
                              <button type="button" className="work-draft-btn primary" onClick={() => extractBrief(work)}>
                                <Sparkles size={12} /> 从终稿提炼
                              </button>
                            ) : (
                              <span className="work-draft-status">待终稿生成后提炼</span>
                            )
                          ) : draft.key === 'review' && draftReady && !reviewReady ? (
                            <button type="button" className="work-draft-btn primary" onClick={() => startReview(work)}>
                              <PenLine size={12} /> {reviewStarted ? '继续校审' : '开始校审'}
                            </button>
                          ) : draft.ready ? (
                            <>
                              <span className="work-draft-status ready">已生成</span>
                              <button type="button" className="work-draft-btn" onClick={() => openDraft(work, draft.key)}>查看</button>
                              {draft.invite && (
                                <button type="button" className="work-draft-btn" onClick={() => inviteSupplement(work, draft.name)}>
                                  <UserPlus size={12} /> 邀请补充
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="work-draft-status">未生成</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Annotate id="my-works.work-actions">
                <div className="work-actions">
                  {work.status !== '已完成' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => openWork(work)}>
                      <Mic size={14} /> 继续完成 <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => openWork(work)}>
                      <BookOpen size={14} /> 查看传记
                    </button>
                  )}
                  {canPublish(work) && (
                    <button className="btn btn-outline btn-sm work-publish" onClick={() => setPublishingWork(work)}>
                      <UploadCloud size={14} /> 上架
                    </button>
                  )}
                  <button
                    className="icon-btn work-delete"
                    title="删除"
                    onClick={() => deleteWork(work.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                </Annotate>
                {work.status === '已完成' && (
                  <Annotate id="my-works.paid-services">
                  <div className="work-paid-services">
                    {paidServices.map((service) => {
                      const paid = (paidMap[work.id] || []).includes(service.key);
                      const ServiceIcon = service.key === 'download' ? Download : service.key === 'publish' ? Printer : QrCode;
                      return (
                        <button
                          key={service.key}
                          type="button"
                          className={`work-paid-btn ${paid ? 'paid' : ''}`}
                          title={service.desc}
                          onClick={() => handlePaidService(work, service)}
                        >
                          <ServiceIcon size={14} /> {service.label}
                          <span className="work-paid-price">{paid ? '已开通' : `¥${service.price}`}</span>
                        </button>
                      );
                    })}
                  </div>
                  </Annotate>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {payTarget && (
        <Modal
          open
          title="确认支付"
          onClose={() => { if (!paying) setPayTarget(null); }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline" disabled={paying} onClick={() => setPayTarget(null)}>取消</button>
              <button className="btn btn-primary" disabled={paying} onClick={handleConfirmPay}>
                {paying ? '支付中…' : `微信支付 ¥${payTarget.service.price}`}
              </button>
            </div>
          }
        >
          <div className="work-pay-detail">
            <div className="work-pay-row"><span>作品</span><strong>{payTarget.work.name}的传记</strong></div>
            <div className="work-pay-row"><span>服务</span><strong>{payTarget.service.label}</strong></div>
            <div className="work-pay-row"><span>说明</span><strong>{payTarget.service.desc}</strong></div>
            <div className="work-pay-row total"><span>应付金额</span><strong>¥{payTarget.service.price.toFixed(2)}</strong></div>
            <p className="work-pay-tip">演示环境为模拟支付，支付成功后该服务永久开通，可在「我的订单」查看记录。</p>
          </div>
        </Modal>
      )}

      {qrWork && (
        <Modal
          open
          title={`《${qrWork.name}的传记》分享二维码`}
          onClose={() => setQrWork(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="btn btn-outline"
                onClick={() => { navigator.clipboard.writeText(`https://cj.example.com/share/${qrWork.id}`); addToast('链接已复制', 'success'); }}
              >
                复制链接
              </button>
              <button className="btn btn-primary" onClick={() => setQrWork(null)}>完成</button>
            </div>
          }
        >
          <div className="work-qr-body">
            <div className="work-qr-image"><QrCode size={140} strokeWidth={1} /></div>
            <p>微信扫码即可阅读传记内容</p>
            <p className="work-qr-link">https://cj.example.com/share/{qrWork.id}</p>
          </div>
        </Modal>
      )}

      {publishingWork && (
        <PublishBookModal
          archive={{
            id: publishingWork.id,
            name: publishingWork.name,
            birthYear: publishingWork.birthYear,
            origin: publishingWork.origin,
            occupation: publishingWork.occupation,
          }}
          onClose={() => setPublishingWork(null)}
          onPublished={refreshBookStatuses}
        />
      )}
    </div>
  );
}
