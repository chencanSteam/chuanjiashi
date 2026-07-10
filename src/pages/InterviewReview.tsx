import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Pencil,
  BookOpen,
  X,
  Sparkles,
  FileText,
  Clock,
  MapPin,
  Calendar,
  Tag,
  ChevronRight,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { buildReviewData, loadJson, saveJson, type ReviewEvent } from '../data/aiMock';
import { generateInterviewTopics } from '../utils/interviewTopics';
import { loadCollaborators, loadSupplementAnswers } from '../data/interviewCollaboration';
import { familyApi } from '../api/family';
import { syncReviewEventToTimeline } from '../utils/eventSync';
import './InterviewReview.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    const archives: Archive[] = JSON.parse(raw);
    return archives.find((a) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

export default function InterviewReview() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const interviewTopics = useMemo(() => generateInterviewTopics(archive, archiveId), [archive, archiveId]);

  const initialAnswers = useMemo<Record<string, string>>(() => {
    const saved = loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {});
    if (Object.keys(saved).length > 0) return saved;
    const fallback: Record<string, string> = {};
    interviewTopics.forEach((topic) => {
      topic.questions.forEach((q) => {
        fallback[q.id] = q.mockAnswer;
      });
    });
    return fallback;
  }, [archiveId, interviewTopics]);
  const initialReview = buildReviewData(initialAnswers);

  const [events, setEvents] = useState<ReviewEvent[]>(() =>
    loadJson<ReviewEvent[]>(`cj_review_events_${archiveId}`, initialReview.events)
  );
  const [highlights] = useState<string[]>(initialReview.highlights);
  const [facts] = useState<string[]>(initialReview.factsToConfirm);
  const [sources] = useState<string[]>(initialReview.sources);
  const [summary] = useState<string>(initialReview.summary);
  const [summaryTab, setSummaryTab] = useState<'summary' | 'transcript' | 'collaborators'>('summary');
  const [editingId, setEditingId] = useState<string | null>(null);

  const collaborators = useMemo(() => loadCollaborators(archiveId), [archiveId]);
  const supplementAnswers = useMemo(() => loadSupplementAnswers(archiveId), [archiveId]);
  const collaboratorStats = useMemo(() => {
    const stats: Record<string, { name: string; relation: string; count: number }> = {};
    collaborators.forEach((c) => {
      stats[c.id] = { name: c.name, relation: c.relation, count: 0 };
    });
    Object.values(supplementAnswers).forEach((list) => {
      list.forEach((a) => {
        if (stats[a.respondentId]) {
          stats[a.respondentId].count += 1;
        }
      });
    });
    return Object.values(stats);
  }, [collaborators, supplementAnswers]);

  const questionGroups = useMemo(() => {
    const groups: {
      topicTitle: string;
      questionText: string;
      questionId: string;
      answers: { speaker: string; relation: string; text: string; isSupplement: boolean }[];
    }[] = [];
    interviewTopics.forEach((topic) => {
      topic.questions.forEach((q) => {
        const answers: { speaker: string; relation: string; text: string; isSupplement: boolean }[] = [];
        const mainAnswer = initialAnswers[q.id];
        if (mainAnswer) {
          answers.push({ speaker: archive?.name || '本人', relation: '本人', text: mainAnswer, isSupplement: false });
        }
        (supplementAnswers[q.id] || []).forEach((s) => {
          answers.push({ speaker: s.respondentName, relation: s.relation, text: s.text, isSupplement: true });
        });
        if (answers.length > 0) {
          groups.push({ topicTitle: topic.title, questionText: q.text, questionId: q.id, answers });
        }
      });
    });
    return groups;
  }, [interviewTopics, initialAnswers, supplementAnswers, archive]);

  const [editForm, setEditForm] = useState<Partial<ReviewEvent>>({});
  const [addedToMaterial, setAddedToMaterial] = useState<Set<string>>(
    () => new Set(loadJson<string[]>(`cj_review_added_${archiveId}`, []))
  );

  useEffect(() => {
    saveJson(`cj_review_events_${archiveId}`, events);
  }, [events, archiveId]);

  useEffect(() => {
    saveJson(`cj_review_highlights_${archiveId}`, highlights);
  }, [highlights, archiveId]);

  const confirmEvent = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (event) {
      try {
        await familyApi.syncPlace(archiveId, event.location, event.time, event.title);
        const subjectName = archive?.name || '本人';
        await familyApi.syncRelation(archiveId, subjectName, event.title, event.summary);
        syncReviewEventToTimeline(archiveId, { ...event, status: 'confirmed' });
      } catch {}
    }
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'confirmed' as const } : e)));
    addToast('事件已确认，地点与人物关系已同步', 'success');
  };

  const ignoreEvent = (id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'ignored' as const } : e)));
    addToast('已忽略该事件', 'info');
  };

  const startEdit = (event: ReviewEvent) => {
    setEditingId(event.id);
    setEditForm({ ...event });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const next = events.map((e) =>
      e.id === editingId
        ? ({ ...e, ...editForm, status: 'confirmed' as const } as ReviewEvent)
        : e
    );
    const event = next.find((e) => e.id === editingId);
    if (event) {
      try {
        await familyApi.syncPlace(archiveId, event.location, event.time, event.title);
        const subjectName = archive?.name || '本人';
        await familyApi.syncRelation(archiveId, subjectName, event.title, event.summary);
        syncReviewEventToTimeline(archiveId, event);
      } catch {}
    }
    setEvents(next);
    setEditingId(null);
    setEditForm({});
    addToast('事件已更新并确认，地点与人物关系已同步', 'success');
  };

  const addToMaterial = (id: string) => {
    setAddedToMaterial((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveJson(`cj_review_added_${archiveId}`, Array.from(next));
      return next;
    });
    addToast('已加入传记素材', 'success');
  };

  const generateBiography = () => {
    navigate('/biography');
  };

  const confirmedCount = events.filter((e) => e.status === 'confirmed').length;

  return (
    <div className="review-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">采访整理</h1>
          <div className="breadcrumb">
            <span>AI智能采访</span> / <span className="active">采访整理</span>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => navigate('/interview')}>
            返回采访
          </button>
          <button className="btn btn-primary" onClick={generateBiography}>
            <BookOpen size={14} /> 去生成传记
          </button>
        </div>
      </header>

      <div className="review-layout">
        <div className="review-main">
          <div className="card summary-card">
            <div className="card-header summary-header">
              <h3 className="card-title">
                {summaryTab === 'summary' ? <Sparkles size={14} /> : summaryTab === 'transcript' ? <MessageSquare size={14} /> : <Users size={14} />}
                {summaryTab === 'summary' ? '采访摘要' : summaryTab === 'transcript' ? '采访详情' : '协作者补充'}
              </h3>
              <div className="summary-tabs">
                <button
                  className={summaryTab === 'summary' ? 'active' : ''}
                  onClick={() => setSummaryTab('summary')}
                >
                  摘要
                </button>
                <button
                  className={summaryTab === 'transcript' ? 'active' : ''}
                  onClick={() => setSummaryTab('transcript')}
                >
                  采访详情
                </button>
                <button
                  className={summaryTab === 'collaborators' ? 'active' : ''}
                  onClick={() => setSummaryTab('collaborators')}
                >
                  协作者补充
                </button>
              </div>
            </div>
            <div className="card-body">
              {summaryTab === 'summary' ? (
                <p className="summary-text">{summary}</p>
              ) : summaryTab === 'transcript' ? (
                <div className="question-groups">
                  {questionGroups.length === 0 ? (
                    <div className="transcript-empty">暂无采访详情记录</div>
                  ) : (
                    questionGroups.map((group) => (
                      <div className="question-group" key={group.questionId}>
                        <div className="question-group-header">
                          <span className="question-group-topic">{group.topicTitle}</span>
                          <h4 className="question-group-title">{group.questionText}</h4>
                        </div>
                        <div className="question-group-answers">
                          {group.answers.map((answer, idx) => (
                            <div
                              className={`transcript-line ${answer.isSupplement ? 'supplement' : 'subject'}`}
                              key={idx}
                            >
                              <div className="transcript-line-header">
                                <span className="transcript-speaker">
                                  {answer.speaker}
                                  <span className="transcript-relation">{answer.relation}</span>
                                </span>
                              </div>
                              <div className="transcript-text">{answer.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="collaborators-review">
                  {collaboratorStats.length === 0 ? (
                    <div className="transcript-empty">暂无协作者补充访谈</div>
                  ) : (
                    <div className="collab-stats-list">
                      {collaboratorStats.map((c, i) => (
                        <div className="collab-stat-card" key={i}>
                          <div className="collab-stat-main">
                            <strong>{c.name}</strong>
                            <span>{c.relation}</span>
                          </div>
                          <div className="collab-stat-count">{c.count} 条补充</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="supplement-detail-list">
                    {Object.entries(supplementAnswers).map(([qid, list]) =>
                      list.map((s, i) => {
                        const q = interviewTopics.flatMap((t) => t.questions).find((q) => q.id === qid);
                        return (
                          <div className="supplement-review-item" key={`${qid}-${i}`}>
                            <div className="supplement-review-meta">
                              <strong>{s.respondentName}</strong>
                              <span>{s.relation}</span>
                              <span>{new Date(s.answeredAt).toLocaleString()}</span>
                            </div>
                            {q && <div className="supplement-review-question">问题：{q.text}</div>}
                            <div className="supplement-review-text">{s.text}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card events-card">
            <div className="card-header">
              <h3 className="card-title"><Calendar size={14} /> AI 抽取的人生事件</h3>
              <span className="card-extra">{confirmedCount}/{events.length} 已确认</span>
            </div>
            <div className="card-body events-body">
              {events.map((event) => (
                <div className={`event-card ${event.status}`} key={event.id}>
                  {editingId === event.id ? (
                    <div className="event-edit-form">
                      <label>事件标题</label>
                      <input
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      />
                      <label>时间</label>
                      <input
                        value={editForm.time || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                      />
                      <label>地点</label>
                      <input
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                      />
                      <label>摘要</label>
                      <textarea
                        rows={3}
                        value={editForm.summary || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, summary: e.target.value }))}
                      />
                      <div className="event-edit-actions">
                        <button className="btn btn-primary" onClick={saveEdit}>
                          <Check size={14} /> 保存
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({});
                          }}
                        >
                          <X size={14} /> 取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="event-header">
                        <div className="event-status">
                          {event.status === 'confirmed' ? (
                            <span className="status-confirmed"><Check size={12} /> 已确认</span>
                          ) : event.status === 'ignored' ? (
                            <span className="status-ignored"><X size={12} /> 已忽略</span>
                          ) : (
                            <span className="status-pending">待确认</span>
                          )}
                        </div>
                        <div className="event-actions">
                          {event.status !== 'confirmed' && (
                            <button className="btn btn-sm btn-outline" onClick={() => confirmEvent(event.id)}>
                              <Check size={12} /> 确认
                            </button>
                          )}
                          <button className="btn btn-sm btn-ghost" onClick={() => startEdit(event)}>
                            <Pencil size={12} /> 编辑
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            disabled={addedToMaterial.has(event.id)}
                            onClick={() => addToMaterial(event.id)}
                          >
                            <BookOpen size={12} /> {addedToMaterial.has(event.id) ? '已加入' : '加入素材'}
                          </button>
                          <button className="btn btn-sm btn-ghost" onClick={() => ignoreEvent(event.id)}>
                            <X size={12} /> 忽略
                          </button>
                        </div>
                      </div>
                      <div className="event-title">{event.title}</div>
                      <div className="event-meta">
                        <span><Calendar size={12} /> {event.time}</span>
                        <span><MapPin size={12} /> {event.location}</span>
                        <span><Tag size={12} /> {event.type}</span>
                      </div>
                      <div className="event-summary">{event.summary}</div>
                      <div className="event-source">
                        <FileText size={12} /> 来源：{event.source}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="review-side">
          <div className="card highlights-card">
            <div className="card-header">
              <h3 className="card-title"><Sparkles size={14} /> 重点片段</h3>
            </div>
            <div className="card-body highlights-body">
              {highlights.map((h, i) => (
                <div className="highlight-item" key={i}>
                  <span className="highlight-quote">“</span>
                  <span className="highlight-text">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card facts-card">
            <div className="card-header">
              <h3 className="card-title"><Clock size={14} /> 待确认事实</h3>
            </div>
            <div className="card-body facts-body">
              {facts.map((f, i) => (
                <div className="fact-item" key={i}>
                  <AlertIcon />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card sources-card">
            <div className="card-header">
              <h3 className="card-title"><FileText size={14} /> 素材来源</h3>
            </div>
            <div className="card-body sources-body">
              {sources.map((s, i) => (
                <div className="source-item" key={i}>
                  <span className="source-dot" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary review-generate-btn" onClick={generateBiography}>
            生成传记 <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
