import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic,
  ChevronRight,
  SkipForward,
  Save,
  Sparkles,
  MessageSquarePlus,
  FolderOpen,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Type,
  Video,
  Square,
  StopCircle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import {
  interviewTopics,
  followUpQuestionsPool,
  loadQuota,
  consumeInterviewQuestion,
  consumeFollowUp,
  type AIQuota,
} from '../data/aiMock';
import './AIInterview.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
}

interface TranscriptLine {
  speaker: string;
  time: string;
  text: string;
}

interface VideoRecording {
  seconds: number;
  recordedAt: string;
  transcript: string;
}

interface InterviewSession {
  currentTopicIndex: number;
  currentQuestionIndex: number;
  answeredIds: string[];
  skippedIds: string[];
  followUps: Record<string, { question: string; userAnswer?: string; answered: boolean }[]>;
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

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function AIInterview() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const subjectName = archive?.name || '张家声';

  const [quota, setQuota] = useState<AIQuota>(() => loadQuota());
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {})
  );
  const [transcript, setTranscript] = useState<TranscriptLine[]>(() =>
    loadJson<TranscriptLine[]>(`cj_interview_transcript_${archiveId}`, [])
  );
  const [session, setSession] = useState<InterviewSession>(() =>
    loadJson<InterviewSession>(`cj_interview_session_${archiveId}`, {
      currentTopicIndex: 0,
      currentQuestionIndex: 0,
      answeredIds: [],
      skippedIds: [],
      followUps: {},
    })
  );

  const firstQuestion = interviewTopics[0]?.questions[0];
  const [currentAnswer, setCurrentAnswer] = useState(
    firstQuestion ? loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {})[firstQuestion.id] || firstQuestion.mockAnswer : ''
  );
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [answerMode, setAnswerMode] = useState<'text' | 'voice' | 'video'>('text');
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [videoRecordings, setVideoRecordings] = useState<Record<string, VideoRecording>>(() =>
    loadJson<Record<string, VideoRecording>>(`cj_interview_video_${archiveId}`, {})
  );
  const [activeFollowUpIndex, setActiveFollowUpIndex] = useState<number | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');

  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentTopic = interviewTopics[session.currentTopicIndex];
  const currentQuestion = currentTopic?.questions[session.currentQuestionIndex];

  useEffect(() => {
    saveJson(`cj_interview_answers_${archiveId}`, answers);
  }, [answers, archiveId]);

  useEffect(() => {
    saveJson(`cj_interview_transcript_${archiveId}`, transcript);
  }, [transcript, archiveId]);

  useEffect(() => {
    saveJson(`cj_interview_session_${archiveId}`, session);
  }, [session, archiveId]);

  useEffect(() => {
    if (recordingVoice) {
      voiceTimerRef.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    } else if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    return () => { if (voiceTimerRef.current) clearInterval(voiceTimerRef.current); };
  }, [recordingVoice]);

  useEffect(() => {
    if (recordingVideo) {
      videoTimerRef.current = setInterval(() => setVideoSeconds((s) => s + 1), 1000);
    } else if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    return () => { if (videoTimerRef.current) clearInterval(videoTimerRef.current); };
  }, [recordingVideo]);

  const voiceWaveHeights = useMemo(
    () => Array.from({ length: 40 }, (_, i) => 20 + ((i * 37 + 12) % 61)),
    []
  );

  const nowTime = () =>
    new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const totalQuestions = useMemo(
    () => interviewTopics.reduce((sum, t) => sum + t.questions.length, 0),
    []
  );
  const answeredCount = session.answeredIds.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const saveCurrentAnswer = () => {
    if (!currentQuestion) return;
    const text = currentAnswer.trim();
    if (!text) {
      addToast('请先输入回答内容', 'error');
      return;
    }

    if (!session.answeredIds.includes(currentQuestion.id)) {
      const nextQuota = consumeInterviewQuestion(quota);
      setQuota(nextQuota);
    }

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
    setSession((prev) => ({
      ...prev,
      answeredIds: Array.from(new Set([...prev.answeredIds, currentQuestion.id])),
      skippedIds: prev.skippedIds.filter((id) => id !== currentQuestion.id),
    }));

    setTranscript((prev) => [
      ...prev,
      { speaker: 'AI采访官', time: nowTime(), text: currentQuestion.text },
      { speaker: subjectName, time: nowTime(), text },
    ]);

    addToast('本段已保存', 'success');

    // 根据当前回答自动生成延伸问题
    generateFollowUps(currentQuestion.id);
  };

  const generateFollowUps = (questionId: string) => {
    const used = consumeFollowUp(quota);
    setQuota(used);
    setGeneratingFollowUp(true);

    const count = 2 + Math.floor(Math.random() * 2);
    const questions: string[] = [];
    while (questions.length < count) {
      const q = followUpQuestionsPool[Math.floor(Math.random() * followUpQuestionsPool.length)];
      if (!questions.includes(q)) questions.push(q);
    }

    setTimeout(() => {
      setSession((prev) => ({
        ...prev,
        followUps: {
          ...prev.followUps,
          [questionId]: [
            ...(prev.followUps[questionId] || []),
            ...questions.map((q) => ({ question: q, answered: false })),
          ],
        },
      }));
      setGeneratingFollowUp(false);
      addToast(`AI 根据您的回答生成了 ${questions.length} 个延伸问题`, 'success');
    }, 800);
  };

  const formatSeconds = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startVoiceRecord = () => {
    setVoiceRecorded(false);
    setRecordingVoice(true);
    setVoiceSeconds(0);
    addToast('开始录制语音回答…', 'info');
  };

  const stopVoiceRecord = () => {
    setRecordingVoice(false);
    const mockTranscript = '[语音转写] 我用语音回答了这个问题，讲述了当时真实的经历和感受。';
    setCurrentAnswer((prev) => (prev.trim() ? `${prev}\n\n${mockTranscript}` : mockTranscript));
    setVoiceRecorded(true);
    addToast('语音回答已转写', 'success');
  };

  const startVideoRecord = () => {
    if (!currentQuestion) return;
    setVideoRecorded(false);
    setRecordingVideo(true);
    setVideoSeconds(0);
    addToast('开始录制视频回答…', 'info');
  };

  const stopVideoRecord = () => {
    if (!currentQuestion) return;
    setRecordingVideo(false);
    const mockTranscript = '[视频转写] 通过视频记录的回答，AI 已提取关键内容并整理成文字。';
    setCurrentAnswer((prev) => (prev.trim() ? `${prev}\n\n${mockTranscript}` : mockTranscript));
    const recording: VideoRecording = {
      seconds: videoSeconds,
      recordedAt: new Date().toISOString(),
      transcript: mockTranscript,
    };
    setVideoRecordings((prev) => ({ ...prev, [currentQuestion.id]: recording }));
    setVideoRecorded(true);
    addToast('视频回答已保存', 'success');
  };

  const answerFor = (topicIndex: number, questionIndex: number) => {
    const q = interviewTopics[topicIndex]?.questions[questionIndex];
    if (!q) return '';
    return answers[q.id] || q.mockAnswer;
  };

  const moveToNext = () => {
    if (!currentTopic || !currentQuestion) return;
    const questionList = currentTopic.questions;
    let nextTopicIndex = session.currentTopicIndex;
    let nextQuestionIndex = session.currentQuestionIndex;
    if (session.currentQuestionIndex < questionList.length - 1) {
      nextQuestionIndex += 1;
    } else if (session.currentTopicIndex < interviewTopics.length - 1) {
      nextTopicIndex += 1;
      nextQuestionIndex = 0;
    } else {
      addToast('已是最后一题，可以结束采访并整理', 'info');
      return;
    }
    setSession((prev) => ({
      ...prev,
      currentTopicIndex: nextTopicIndex,
      currentQuestionIndex: nextQuestionIndex,
    }));
    setCurrentAnswer(answerFor(nextTopicIndex, nextQuestionIndex));
    setAnswerMode('text');
    setRecordingVoice(false);
    setVoiceSeconds(0);
    setVoiceRecorded(false);
    setRecordingVideo(false);
    setVideoSeconds(0);
    setVideoRecorded(false);
  };

  const handleNextQuestion = () => {
    if (currentAnswer.trim() && currentQuestion && !session.answeredIds.includes(currentQuestion.id)) {
      saveCurrentAnswer();
      setTimeout(moveToNext, 300);
    } else {
      moveToNext();
    }
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    setSession((prev) => ({
      ...prev,
      skippedIds: Array.from(new Set([...prev.skippedIds, currentQuestion.id])),
    }));
    addToast('已跳过该问题', 'info');
    moveToNext();
  };

  const endInterview = () => {
    navigate('/interview-review');
  };

  const selectQuestion = (topicIndex: number, questionIndex: number) => {
    setSession((prev) => ({
      ...prev,
      currentTopicIndex: topicIndex,
      currentQuestionIndex: questionIndex,
    }));
    setCurrentAnswer(answerFor(topicIndex, questionIndex));
    setAnswerMode('text');
    setRecordingVoice(false);
    setVoiceSeconds(0);
    setVoiceRecorded(false);
    setRecordingVideo(false);
    setVideoSeconds(0);
    setVideoRecorded(false);
    setActiveFollowUpIndex(null);
    setFollowUpAnswer('');
  };

  const currentFollowUps = currentQuestion ? session.followUps[currentQuestion.id] || [] : [];
  const pendingFollowUps = currentFollowUps.filter((f) => !f.answered);
  const answeredFollowUps = currentFollowUps.filter((f) => f.answered);
  const activeFollowUp = activeFollowUpIndex !== null ? currentFollowUps[activeFollowUpIndex] : null;

  const saveFollowUpAnswer = () => {
    if (!currentQuestion || activeFollowUpIndex === null || !followUpAnswer.trim()) return;
    setSession((prev) => {
      const list = prev.followUps[currentQuestion.id] || [];
      const updated = list.map((f, i) =>
        i === activeFollowUpIndex ? { ...f, userAnswer: followUpAnswer.trim(), answered: true } : f
      );
      return { ...prev, followUps: { ...prev.followUps, [currentQuestion.id]: updated } };
    });
    setTranscript((prev) => [
      ...prev,
      { speaker: 'AI采访官·延伸', time: nowTime(), text: currentFollowUps[activeFollowUpIndex].question },
      { speaker: subjectName, time: nowTime(), text: followUpAnswer.trim() },
    ]);
    setActiveFollowUpIndex(null);
    setFollowUpAnswer('');
    addToast('延伸问题回答已保存', 'success');
  };

  const selectFollowUp = (index: number) => {
    setActiveFollowUpIndex(index);
    setFollowUpAnswer('');
  };

  return (
    <div className="interview-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">AI智能采访</h1>
          <div className="breadcrumb">
            <span>首页</span> / <span className="active">AI智能采访</span>
          </div>
          <div className="interview-progress-text">任务进度 {answeredCount}/{totalQuestions} · {progressPercent}%</div>
        </div>
        <button className="btn btn-primary end-interview-btn" onClick={endInterview}>
          <FolderOpen size={14} /> 结束采访并整理
        </button>
      </header>

      <div className="interview-top-stats">
        <div className="card stat-person">
          <div className="card-body">
            <div className="stat-label-text">当前采访对象</div>
            <div className="person-row">
              <Avatar name={subjectName} size={48} />
              <div>
                <div className="person-name">{subjectName}</div>
                <div className="person-tags">
                  <span>{archive?.birthYear ? `${new Date().getFullYear() - Number(archive.birthYear)}岁` : '75岁'}</span>
                  <span>{archive?.origin || '江苏苏州'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card stat-phase">
          <div className="card-body">
            <div className="stat-label-text">当前主题</div>
            <div className="phase-num">{currentTopic?.title || '—'}</div>
            <div className="phase-desc">{currentTopic?.summary || ''}</div>
          </div>
        </div>
      </div>

      <div className="interview-grid">
        <div className="card topic-card">
          <div className="card-header">
            <h3 className="card-title">采访主题</h3>
            <span className="card-extra">{interviewTopics.length} 个主题</span>
          </div>
          <div className="card-body topic-body">
            {interviewTopics.map((topic, ti) => {
              const done = topic.questions.filter((q) => session.answeredIds.includes(q.id)).length;
              const active = ti === session.currentTopicIndex;
              return (
                <button
                  className={`topic-item ${active ? 'active' : ''}`}
                  key={topic.id}
                  onClick={() => selectQuestion(ti, 0)}
                >
                  <div className="topic-name">
                    {active ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    {topic.title}
                  </div>
                  <div className="topic-progress">{done}/{topic.questions.length}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card workspace-card">
          <div className="card-header">
            <h3 className="card-title">
              <Mic size={16} /> 当前问题
            </h3>
            {currentQuestion && session.answeredIds.includes(currentQuestion.id) && (
              <span className="answered-badge"><CheckCircle2 size={12} /> 已保存</span>
            )}
          </div>
          <div className="card-body workspace-body">
            {currentQuestion ? (
              <>
                <div className="question-box">
                  <div className="question-number">{session.currentQuestionIndex + 1}</div>
                  <div className="question-text">{currentQuestion.text}</div>
                </div>

                <div className="workspace-actions workspace-actions-top">
                  <button className="btn btn-primary" onClick={saveCurrentAnswer} disabled={generatingFollowUp || !currentAnswer.trim()}>
                    <Save size={14} /> 保存本段
                  </button>
                  <button className="btn btn-outline" onClick={handleNextQuestion} disabled={generatingFollowUp}>
                    下一题 <ChevronRight size={14} />
                  </button>
                  <button className="btn btn-ghost" onClick={handleSkip} disabled={generatingFollowUp}>
                    <SkipForward size={14} /> 跳过问题
                  </button>
                </div>

                <div className="answer-section">
                  <div className="answer-section-header">
                    <label className="section-label">
                      {answerMode === 'text' ? <Type size={14} /> : answerMode === 'voice' ? <Mic size={14} /> : <Video size={14} />}
                      回答区
                    </label>
                    <div className="answer-mode-tabs">
                      <button className={`mode-tab ${answerMode === 'text' ? 'active' : ''}`} onClick={() => setAnswerMode('text')}>
                        <Type size={13} /> 文字
                      </button>
                      <button className={`mode-tab ${answerMode === 'voice' ? 'active' : ''}`} onClick={() => setAnswerMode('voice')}>
                        <Mic size={13} /> 语音
                      </button>
                      <button
                        className={`mode-tab ${answerMode === 'video' ? 'active' : ''}`}
                        onClick={() => {
                          setAnswerMode('video');
                          const rec = currentQuestion ? videoRecordings[currentQuestion.id] : undefined;
                          if (rec) {
                            setVideoRecorded(true);
                            setRecordingVideo(false);
                            setVideoSeconds(rec.seconds);
                          } else {
                            setVideoRecorded(false);
                            setRecordingVideo(false);
                            setVideoSeconds(0);
                          }
                        }}
                      >
                        <Video size={13} /> 视频
                      </button>
                    </div>
                  </div>

                  {answerMode === 'text' && (
                    <textarea
                      ref={textareaRef}
                      className="answer-textarea"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="请输入或口述回答…"
                      rows={6}
                    />
                  )}

                  {answerMode === 'voice' && (
                    <div className="media-answer voice-answer">
                      {voiceRecorded && !recordingVoice ? (
                        <div className="voice-recorded">
                          <div className="voice-wave-large">
                            {voiceWaveHeights.map((h, i) => (
                              <div key={i} className="voice-large-seg" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <div className="voice-meta">
                            <span className="voice-duration"><Clock size={14} /> {formatSeconds(voiceSeconds)}</span>
                            <span className="voice-status">语音回答已转写为文字</span>
                          </div>
                          <button className="btn btn-outline" onClick={startVoiceRecord}>
                            <RefreshCw size={14} /> 重新录制
                          </button>
                        </div>
                      ) : (
                        <div className="voice-recorder">
                          <div className={`voice-wave-large ${recordingVoice ? 'recording' : ''}`}>
                            {voiceWaveHeights.map((h, i) => (
                              <div key={i} className="voice-large-seg" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <div className="voice-meta">
                            {recordingVoice ? (
                              <>
                                <span className="recording-dot" />
                                <span>录制中 {formatSeconds(voiceSeconds)}</span>
                              </>
                            ) : (
                              <span>点击开始录制语音回答</span>
                            )}
                          </div>
                          {recordingVoice ? (
                            <button className="btn btn-danger" onClick={stopVoiceRecord}>
                              <Square size={14} /> 结束录制
                            </button>
                          ) : (
                            <button className="btn btn-primary" onClick={startVoiceRecord}>
                              <Mic size={14} /> 开始录制
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {answerMode === 'video' && (
                    <div className="media-answer video-answer">
                      {videoRecorded && !recordingVideo ? (
                        <div className="video-recorded">
                          <div className="video-preview">
                            <CheckCircle2 size={32} color="#1B5E4B" />
                            <span>视频回答已保存</span>
                            <span className="video-duration">{formatSeconds(videoSeconds)}</span>
                          </div>
                          <button className="btn btn-outline" onClick={startVideoRecord}>
                            <RefreshCw size={14} /> 重新录制
                          </button>
                        </div>
                      ) : (
                        <div className="video-recorder">
                          <div className="video-preview">
                            {recordingVideo ? (
                              <>
                                <div className="recording-dot" />
                                <span>正在录制 {formatSeconds(videoSeconds)}</span>
                              </>
                            ) : (
                              <>
                                <Video size={32} color="#9ca3af" />
                                <span>点击开始录制视频回答</span>
                              </>
                            )}
                          </div>
                          {recordingVideo ? (
                            <button className="btn btn-danger" onClick={stopVideoRecord}>
                              <StopCircle size={14} /> 结束录制
                            </button>
                          ) : (
                            <button className="btn btn-primary" onClick={startVideoRecord}>
                              <Video size={14} /> 开始录制
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {activeFollowUp && (
                  <div className="followup-answer-section">
                    <label className="section-label">
                      <MessageSquarePlus size={14} /> 当前延伸问题
                    </label>
                    <div className="followup-answer-question">
                      <Sparkles size={14} />
                      {activeFollowUp.question}
                    </div>
                    <textarea
                      className="answer-textarea followup-answer-textarea"
                      value={followUpAnswer}
                      onChange={(e) => setFollowUpAnswer(e.target.value)}
                      placeholder="请输入对这个延伸问题的回答…"
                      rows={4}
                    />
                    <div className="followup-answer-actions">
                      <button
                        className="btn btn-primary"
                        onClick={saveFollowUpAnswer}
                        disabled={!followUpAnswer.trim()}
                      >
                        <Save size={14} /> 保存延伸回答
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          setActiveFollowUpIndex(null);
                          setFollowUpAnswer('');
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {answeredFollowUps.length > 0 && (
                  <div className="followup-section">
                    <label className="section-label">
                      <MessageSquarePlus size={14} /> 已回答延伸问题
                    </label>
                    <div className="followup-list">
                      {answeredFollowUps.map((f, i) => (
                        <div className="followup-bubble" key={i}>
                          <div className="followup-q"><Sparkles size={12} /> {f.question}</div>
                          <div className="followup-a">{f.userAnswer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="interview-done">
                <CheckCircle2 size={48} color="#1B5E4B" />
                <h3>本阶段采访问题已全部完成</h3>
                <p>您可以结束采访，进入整理页面。</p>
                <button className="btn btn-primary" onClick={endInterview}>
                  <FolderOpen size={14} /> 结束采访并整理
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="interview-right">
          <div className="card progress-card">
            <div className="card-header">
              <h3 className="card-title">本次采访进度</h3>
            </div>
            <div className="card-body progress-body">
              <div className="progress-ring-wrap">
                <div className="progress-ring-bg">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e8ecea" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#1B5E4B"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 3.27} 327`}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="progress-ring-text">{progressPercent}%</div>
                </div>
              </div>
              <div className="progress-detail">
                <div><span className="dot green" /> 已回答 {answeredCount} 题</div>
                <div><span className="dot gray" /> 待回答 {totalQuestions - answeredCount} 题</div>
                <div><span className="dot orange" /> 已跳过 {session.skippedIds.length} 题</div>
              </div>

            </div>
          </div>

          <div className="card followup-sidebar-card">
            <div className="card-header">
              <h3 className="card-title"><MessageSquarePlus size={14} /> 延伸问题</h3>
              {pendingFollowUps.length > 0 && (
                <span className="followup-sidebar-count">{pendingFollowUps.length} 个待回答</span>
              )}
            </div>
            <div className="card-body followup-sidebar-body">
              {currentQuestion ? (
                pendingFollowUps.length > 0 ? (
                  <div className="followup-sidebar-list">
                    {pendingFollowUps.map((f) => {
                      const realIndex = currentFollowUps.findIndex((item) => item === f);
                      return (
                        <div
                          className={`followup-sidebar-item ${activeFollowUpIndex === realIndex ? 'active' : ''}`}
                          key={realIndex}
                          onClick={() => selectFollowUp(realIndex)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              selectFollowUp(realIndex);
                            }
                          }}
                        >
                          <div className="followup-sidebar-q"><Sparkles size={12} /> {f.question}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="followup-sidebar-empty">
                    <Sparkles size={24} color="#9ca3af" />
                    <p>暂无待回答延伸问题</p>
                    <span>保存当前问题回答后，AI 将自动根据内容生成延伸问题</span>
                  </div>
                )
              ) : (
                <div className="followup-sidebar-empty">
                  <Sparkles size={24} color="#9ca3af" />
                  <p>采访已完成</p>
                </div>
              )}
            </div>
          </div>

          {quota.interviewQuestion.used >= quota.interviewQuestion.total && (
            <div className="card alert-card">
              <div className="card-body alert-body">
                <AlertCircle size={18} />
                <span>AI采访问题额度已用完，整理已有素材即可生成传记。</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card transcript-card">
        <div className="card-header">
          <h3 className="card-title"><BookOpen size={14} /> 实时转写</h3>
          <div className="card-extra"><Clock size={12} /> 自动保存</div>
        </div>
        <div className="card-body transcript-body">
          {transcript.length === 0 ? (
            <div className="transcript-empty">采访开始后，转写内容会实时出现在这里</div>
          ) : (
            <div className="transcript-list">
              {transcript.map((line, i) => (
                <div className={`transcript-line ${line.speaker === 'AI采访官' || line.speaker.includes('延伸') ? 'ai' : 'user'}`} key={i}>
                  <Avatar name={line.speaker} size={32} />
                  <div className="tx-main">
                    <div className="tx-header">
                      <span className="tx-speaker">{line.speaker}</span>
                      <span className="tx-time">{line.time}</span>
                    </div>
                    <div className="tx-text">{line.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
