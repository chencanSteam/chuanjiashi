import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageSquare, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loadCollaborators, loadInterviewTranscript, findCollaboratorForUser } from '../../data/interviewCollaboration';
import { generateInterviewTopics } from '../../utils/interviewTopics';
import { loadJson } from '../../data/aiMock';
import './MobileInterviewReview.css';

interface Archive { id: string; name: string; birthYear: string; origin: string; occupation: string; }
interface RecordItem { id: string; name: string; relation: string; lines: { speaker: string; time: string; text: string }[]; historical?: boolean; }

function loadArchive(id: string | null): Archive | null {
  try {
    const archives = JSON.parse(localStorage.getItem('cj_archives') || '[]') as Archive[];
    return archives.find((archive) => archive.id === id) || null;
  } catch { return null; }
}

export default function MobileInterviewReview() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const archiveId = params.get('archiveId') || localStorage.getItem('cj_current_archive_id');
  const archive = useMemo(() => loadArchive(archiveId), [archiveId]);
  const [selectedId, setSelectedId] = useState(params.get('respondent') || 'subject');
  const records = useMemo<RecordItem[]>(() => {
    if (!archiveId) return [];
    const topics = generateInterviewTopics(archive, archiveId);
    const result: RecordItem[] = [];
    const subjectLines = loadInterviewTranscript(archiveId);
    if (subjectLines.length) result.push({ id: 'subject', name: archive?.name || '本人', relation: '本人', lines: subjectLines });
    const fallbackAnswers = loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {});
    if (!subjectLines.length && Object.keys(fallbackAnswers).length) {
      const lines = Object.entries(fallbackAnswers).flatMap(([qid, answer]) => {
        const question = topics.flatMap((topic) => topic.questions).find((item) => item.id === qid);
        return question ? [{ speaker: 'AI采访官', time: '历史记录', text: question.text }, { speaker: archive?.name || '本人', time: '历史记录', text: answer }] : [];
      });
      if (lines.length) result.push({ id: 'subject', name: archive?.name || '本人', relation: '本人', lines, historical: true });
    }
    loadCollaborators(archiveId).forEach((collaborator) => {
      const lines = loadInterviewTranscript(archiveId, collaborator.id);
      if (lines.length) result.push({ id: collaborator.id, name: collaborator.name, relation: collaborator.relation || '协助人', lines });
    });
    const currentCollaborator = findCollaboratorForUser(archiveId, user);
    if (currentCollaborator) return result.filter((record) => record.id === currentCollaborator.id);
    return result;
  }, [archive, archiveId, user]);
  const selected = records.find((record) => record.id === selectedId) || records[0];

  if (!archive) return <div className="mobile-review-page"><button className="mobile-review-back" onClick={() => navigate('/m/interview')}><ArrowLeft size={18} /> 返回采访</button><div className="mobile-review-empty">暂无人生档案</div></div>;
  return (
    <div className="mobile-review-page">
      <div className="mobile-review-toolbar"><button className="mobile-review-back" onClick={() => navigate('/m/interview')}><ArrowLeft size={18} /> 返回采访</button><strong>采访记录</strong><span /></div>
      <div className="mobile-review-summary"><MessageSquare size={22} /><div><strong>{archive.name}的采访记录</strong><small>共 {records.length} 位回答者 · 记录会自动保存</small></div></div>
      {records.length === 0 ? <div className="mobile-review-empty"><MessageSquare size={38} /><p>暂无采访记录</p><button onClick={() => navigate('/m/interview')}>开始采访</button></div> : <>
        <div className="mobile-review-record-tabs">{records.map((record) => <button key={record.id} className={selected?.id === record.id ? 'active' : ''} onClick={() => setSelectedId(record.id)}><span className="mobile-review-avatar"><User size={16} /></span><span><strong>{record.name}</strong><small>{record.relation} · {record.lines.length} 条</small></span></button>)}</div>
        {selected && <section className="mobile-review-dialogue"><div className="mobile-review-dialogue-head"><strong>{selected.name} · {selected.relation}</strong>{selected.historical && <span>历史记录整理</span>}</div>{selected.lines.map((line, index) => <div className={`mobile-review-line ${line.speaker.includes('AI采访官') ? 'ai' : 'respondent'}`} key={`${line.time}-${index}`}><div className="mobile-review-line-meta"><strong>{line.speaker.includes('AI采访官') ? 'AI采访官' : selected.name}</strong><time>{line.time}</time></div><p>{line.text}</p></div>)}<div className="mobile-review-note"><CheckCircle2 size={15} /> 原始问题与回答按采访顺序完整保留</div></section>}
      </>}
    </div>
  );
}
