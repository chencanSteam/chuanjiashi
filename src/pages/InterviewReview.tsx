import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  ChevronRight,
  MessageSquare,
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
}

interface InterviewRecord {
  id: string;
  respondentName: string;
  relation: string;
  transcript: TranscriptLine[];
  startedAt: string;
  lastAt: string;
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

  const collaborators = useMemo(() => loadCollaborators(archiveId), [archiveId]);
  const interviewRecords = useMemo<InterviewRecord[]>(() => {
    const records: InterviewRecord[] = [];
    const subjectTranscript = loadTranscript(`cj_interview_transcript_${archiveId}`);
    if (subjectTranscript.length > 0) {
      const times = getRecordTime(subjectTranscript);
      records.push({ id: 'subject', respondentName: archive?.name || '本人', relation: '本人', transcript: subjectTranscript, ...times });
    }
    collaborators.forEach((collaborator) => {
      const transcript = loadTranscript(`cj_interview_transcript_${archiveId}_${collaborator.id}`);
      if (transcript.length > 0) {
        const times = getRecordTime(transcript);
        records.push({ id: collaborator.id, respondentName: collaborator.name, relation: collaborator.relation || '协作者', transcript, ...times });
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
        records.push({ id: 'subject-fallback', respondentName: archive?.name || '本人', relation: '本人', transcript: fallback, startedAt: today, lastAt: today });
      }
    }
    return records.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [archive, archiveId, collaborators, initialAnswers, interviewTopics]);

  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | null>(null);

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
            <button className="interview-record-item" key={record.id} type="button" onClick={() => setSelectedRecord(record)}>
              <span className="interview-record-avatar"><User size={19} /></span>
              <span className="interview-record-main"><strong>{record.respondentName}</strong><small>{record.relation} · {record.transcript.length} 条对话</small></span>
              <span className="interview-record-time"><span><Clock size={12} /> {record.startedAt.split(' ')[0]}</span></span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </div>

      <Modal className="interview-record-modal" open={!!selectedRecord} title={selectedRecord ? `${selectedRecord.respondentName}的采访记录` : '采访记录'} onClose={() => setSelectedRecord(null)}>
        {selectedRecord && <div className="interview-record-dialogue">{selectedRecord.transcript.map((line, index) => { const isAi = line.speaker.includes('AI采访官'); return <div className={`interview-dialogue-line ${isAi ? 'ai' : 'respondent'}`} key={`${line.time}-${index}`}><div className="interview-dialogue-meta"><strong>{isAi ? 'AI采访官' : selectedRecord.respondentName}</strong><span>{line.time}</span></div><div className="interview-dialogue-text">{line.text}</div></div>; })}</div>}
      </Modal>
    </div>
  );
}
