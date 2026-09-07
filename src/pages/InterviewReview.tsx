import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  ChevronRight,
  MessageSquare,
  Pencil,
  User,
} from 'lucide-react';
import { loadJson } from '../data/aiMock';
import { generateInterviewTopics } from '../utils/interviewTopics';
import { loadCollaborators } from '../data/interviewCollaboration';
import Modal from '../components/ui/Modal';
import Annotate from '../components/annotation/Annotate';
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

interface TranscriptLine {
  speaker: string;
  time: string;
  text: string;
  /** 该条对话所属的采访主题 */
  topic?: string;
  /** 废弃的回答不作为传记参考 */
  invalid?: boolean;
}

interface InterviewRecord {
  id: string;
  respondentName: string;
  relation: string;
  transcript: TranscriptLine[];
  startedAt: string;
  lastAt: string;
  /** 逐字稿的 localStorage key；fallback 记录为 null（不可编辑） */
  storageKey: string | null;
}

function loadTranscript(key: string): TranscriptLine[] {
  return loadJson<TranscriptLine[]>(key, []);
}

function getRecordTime(lines: TranscriptLine[]): { startedAt: string; lastAt: string } {
  const today = new Date().toLocaleDateString('zh-CN');
  return {
    startedAt: lines[0]?.time && lines[0].time !== '采访记录' ? `${today} ${lines[0].time}` : today,
    lastAt: lines[lines.length - 1]?.time && lines[lines.length - 1].time !== '采访记录' ? `${today} ${lines[lines.length - 1].time}` : today,
  };
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
  const [searchParams] = useSearchParams();
  const archive = useMemo(() => loadCurrentArchive(), []);
  const requestedArchiveId = searchParams.get('archiveId');
  const archiveId = requestedArchiveId || archive?.id || 'default';
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

  const collaborators = useMemo(() => loadCollaborators(archiveId), [archiveId]);
  const interviewRecords = useMemo<InterviewRecord[]>(() => {
    const records: InterviewRecord[] = [];
    const subjectTranscript = loadTranscript(`cj_interview_transcript_${archiveId}`);
    if (subjectTranscript.length > 0) {
      const times = getRecordTime(subjectTranscript);
      records.push({ id: 'subject', respondentName: archive?.name || '本人', relation: '本人', transcript: subjectTranscript, storageKey: `cj_interview_transcript_${archiveId}`, ...times });
    }
    collaborators.forEach((collaborator) => {
      const transcript = loadTranscript(`cj_interview_transcript_${archiveId}_${collaborator.id}`);
      if (transcript.length > 0) {
        const times = getRecordTime(transcript);
        records.push({ id: collaborator.id, respondentName: collaborator.name, relation: collaborator.relation || '协作者', transcript, storageKey: `cj_interview_transcript_${archiveId}_${collaborator.id}`, ...times });
      }
    });
    if (records.length === 0) {
      const fallback = Object.entries(initialAnswers)
        .filter(([, text]) => text)
        .flatMap(([questionId, text]) => {
          const question = interviewTopics.flatMap((topic) => topic.questions).find((item) => item.id === questionId);
          return question ? [{ speaker: 'AI采访官', time: '采访记录', text: question.text }, { speaker: archive?.name || '本人', time: '采访记录', text }] : [];
        });
      if (fallback.length > 0) {
        const today = new Date().toLocaleDateString('zh-CN');
        records.push({ id: 'subject-fallback', respondentName: archive?.name || '本人', relation: '本人', transcript: fallback, storageKey: null, startedAt: today, lastAt: today });
      }
    }
    return records.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [archive, archiveId, collaborators, initialAnswers, interviewTopics]);

  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | null>(null);
  const [editingLine, setEditingLine] = useState<{ index: number; text: string } | null>(null);

  // 修改某条回答：写回逐字稿存储并刷新展示
  const saveEditedLine = () => {
    if (!selectedRecord || editingLine === null) return;
    const text = editingLine.text.trim();
    if (!text) return;
    const next = selectedRecord.transcript.map((line, i) => (i === editingLine.index ? { ...line, text } : line));
    if (selectedRecord.storageKey) {
      try {
        localStorage.setItem(selectedRecord.storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
    setSelectedRecord({ ...selectedRecord, transcript: next });
    setEditingLine(null);
  };

  // 废弃/恢复某条回答：废弃的回答不作为传记参考（标注存于逐字稿行上）
  const toggleLineInvalid = (index: number) => {
    if (!selectedRecord) return;
    const next = selectedRecord.transcript.map((line, i) =>
      i === index ? { ...line, invalid: !line.invalid } : line,
    );
    if (selectedRecord.storageKey) {
      try {
        localStorage.setItem(selectedRecord.storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
    setSelectedRecord({ ...selectedRecord, transcript: next });
  };

  // 协作者回答的批量采纳/废弃
  const [checkedLines, setCheckedLines] = useState<Set<number>>(new Set());

  const persistTranscript = (record: InterviewRecord, next: TranscriptLine[]) => {
    if (record.storageKey) {
      try {
        localStorage.setItem(record.storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
    setSelectedRecord({ ...record, transcript: next });
  };

  const isCollaboratorRecord = (record: InterviewRecord) => record.id !== 'subject' && record.id !== 'subject-fallback';

  const applyBatch = (mode: 'adopt-all' | 'discard-all' | 'adopt-selected') => {
    if (!selectedRecord) return;
    const next = selectedRecord.transcript.map((line, i) => {
      if (line.speaker.includes('AI采访官')) return line;
      if (mode === 'adopt-all') return { ...line, invalid: false };
      if (mode === 'discard-all') return { ...line, invalid: true };
      return checkedLines.has(i) ? { ...line, invalid: false } : line;
    });
    persistTranscript(selectedRecord, next);
    if (mode === 'adopt-selected') setCheckedLines(new Set());
  };

  useEffect(() => {
    const respondentId = searchParams.get('respondent');
    if (respondentId) {
      const match = interviewRecords.find((record) => record.id === respondentId);
      if (match) {
        setSelectedRecord(match);
        setCheckedLines(new Set());
      }
    }
  }, [interviewRecords, searchParams]);

  const generateBiography = () => {
    navigate('/biography');
  };

  return (
    <div className="review-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">采访记录</h1>
          <div className="breadcrumb">
            <span>AI智能采访</span> / <span className="active">采访记录</span>
          </div>
          <p className="interview-record-subtitle">选择一条记录，查看完整采访对话</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => navigate('/interview')}>
            返回采访
          </button>
          <Annotate id="interview-review.generate-btn" inline>
          <button className="btn btn-primary" onClick={generateBiography}>
            <BookOpen size={14} /> 去生成传记
          </button>
          </Annotate>
        </div>
      </header>

      <div className="interview-record-list-card card">
        <div className="card-header"><h3 className="card-title"><MessageSquare size={15} /> 采访记录</h3><span className="card-extra">共 {interviewRecords.length} 条</span></div>
        <div className="card-body interview-record-list-body">
          {interviewRecords.length === 0 ? (
            <div className="transcript-empty"><MessageSquare size={34} /><p>暂无采访记录</p><button className="btn btn-primary" onClick={() => navigate('/interview')}>返回 AI 智能采访</button></div>
          ) : interviewRecords.map((record) => (
            <button className="interview-record-item" key={record.id} type="button" onClick={() => { setSelectedRecord(record); setCheckedLines(new Set()); }}>
              <span className="interview-record-avatar"><User size={19} /></span>
              <span className="interview-record-main"><strong>{record.respondentName}</strong><small>{record.relation} · {record.transcript.length} 条对话</small></span>
              <span className="interview-record-time"><span><Clock size={12} /> {record.startedAt.split(' ')[0]}</span></span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </div>

      <Modal className="interview-record-modal" open={!!selectedRecord} title={selectedRecord ? `${selectedRecord.respondentName}的采访记录` : '采访记录'} onClose={() => { setSelectedRecord(null); setCheckedLines(new Set()); }}>
        {selectedRecord && isCollaboratorRecord(selectedRecord) && (
          <div className="interview-batch-bar">
            <label className="interview-batch-check">
              <input
                type="checkbox"
                checked={selectedRecord.transcript.some((l) => !l.speaker.includes('AI采访官')) && selectedRecord.transcript.every((l, i) => l.speaker.includes('AI采访官') || checkedLines.has(i))}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCheckedLines(new Set(selectedRecord.transcript.map((l, i) => (l.speaker.includes('AI采访官') ? -1 : i)).filter((i) => i >= 0)));
                  } else {
                    setCheckedLines(new Set());
                  }
                }}
              />
              全选
            </label>
            <button type="button" className="btn btn-outline btn-sm" disabled={checkedLines.size === 0} onClick={() => applyBatch('adopt-selected')}>采纳勾选</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => applyBatch('adopt-all')}>全部采纳</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => applyBatch('discard-all')}>全部废弃</button>
          </div>
        )}
        {selectedRecord && <div className="interview-record-dialogue">{(() => {
          let lastTopic: string | undefined;
          return selectedRecord.transcript.map((line, index) => { const isAi = line.speaker.includes('AI采访官'); const topicHeader = line.topic && line.topic !== lastTopic ? <div className="interview-topic-divider" key={`topic-${index}`}>{line.topic}</div> : null; lastTopic = line.topic || lastTopic; return <div key={`${line.time}-${index}`}>{topicHeader}<div className={`interview-dialogue-line ${isAi ? 'ai' : 'respondent'}`}><div className="interview-dialogue-meta">{!isAi && isCollaboratorRecord(selectedRecord) && <input type="checkbox" checked={checkedLines.has(index)} onChange={(e) => { const next = new Set(checkedLines); if (e.target.checked) next.add(index); else next.delete(index); setCheckedLines(next); }} />}<strong>{isAi ? 'AI采访官' : selectedRecord.respondentName}</strong><span>{line.time}</span>{!isAi && selectedRecord.storageKey && <button type="button" className="interview-line-edit" onClick={() => setEditingLine({ index, text: line.text })}><Pencil size={12} /> 修改</button>}{!isAi && isCollaboratorRecord(selectedRecord) && <button type="button" className="interview-line-edit" onClick={() => toggleLineInvalid(index)}>{line.invalid ? '取消废弃' : '废弃'}</button>}</div><div className={`interview-dialogue-text ${line.invalid ? 'invalid' : ''}`}>{line.text}{line.invalid && <span className="interview-line-invalid-tag">已废弃</span>}</div></div></div>; })})()}</div>}
        {selectedRecord && editingLine !== null && (
          <div className="interview-line-edit-panel">
            <textarea
              rows={3}
              value={editingLine.text}
              onChange={(e) => setEditingLine({ ...editingLine, text: e.target.value })}
            />
            <div className="interview-line-edit-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setEditingLine(null)}>取消</button>
              <button className="btn btn-primary btn-sm" disabled={!editingLine.text.trim()} onClick={saveEditedLine}>保存修改</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
