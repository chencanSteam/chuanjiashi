import { useEffect, useMemo, useState } from 'react';
import {
  ListTodo,
  Coins,
  FileText,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
  Plus,
  Pencil,
  Trash2,
  MessageSquareText,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { aiTaskApi } from '../api/aiTask';
import type { TokenCostStat } from '../api/aiTask';
import Modal from '../components/ui/Modal';
import type { AITask, AITaskType, AITaskStatus, PromptTemplate, PromptTemplateType, QrCodeRecord, Question } from '../mocks/types';
import './AITaskManagement.css';

const tabs = [
  { key: 'queue', label: '任务队列' },
  { key: 'token', label: 'Token 成本' },
  { key: 'templates', label: '模板管理' },
  { key: 'questions', label: '采访题库' },
  { key: 'qrcodes', label: '二维码管理' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const taskTypeLabels: Record<AITaskType, string> = {
  biography: '传记生成',
  digital_person: '数字人',
  short_video: '短视频',
  pdf: 'PDF 排版',
  qrcode: '二维码生成',
};

const qrCodeTypeLabels: Record<QrCodeRecord['type'], string> = {
  tombstone: '墓碑码',
  memorial: '纪念物码',
  share: '分享码',
};

const qrCodeStatusLabels: Record<QrCodeRecord['status'], string> = {
  enabled: '启用',
  disabled: '停用',
  bound: '已绑定',
  unbound: '未绑定',
};

const taskStatusLabels: Record<AITaskStatus, string> = {
  queued: '排队中',
  running: '生成中',
  success: '成功',
  failed: '失败',
};

const templateTypeLabels: Record<PromptTemplateType, string> = {
  prompt: 'Prompt 模板',
  questionnaire: '问卷模板',
  style: '文风模板',
  interview_rule: '采访题库规则',
};

const templateTypeOrder: PromptTemplateType[] = ['prompt', 'questionnaire', 'style', 'interview_rule'];

export default function AITaskManagement() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [typeFilter, setTypeFilter] = useState<AITaskType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AITaskStatus | 'all'>('all');
  const [tokenStats, setTokenStats] = useState<TokenCostStat[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCodeRecord[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionModal, setQuestionModal] = useState<{ mode: 'create' | 'edit'; question?: Question } | null>(null);
  const [questionForm, setQuestionForm] = useState({ category: '', title: '', question: '' });
  const [savingQuestion, setSavingQuestion] = useState(false);

  const loadQuestions = () => {
    aiTaskApi
      .questions()
      .then(setQuestions)
      .catch(() => setQuestions([]));
  };

  const loadTasks = () => {
    aiTaskApi
      .list({ type: typeFilter, status: statusFilter })
      .then(setTasks)
      .catch(() => setTasks([]));
  };

  useEffect(() => {
    if (activeTab === 'queue') loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, typeFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'token') {
      aiTaskApi.tokenStats().then(setTokenStats).catch(() => setTokenStats([]));
    }
    if (activeTab === 'templates') {
      aiTaskApi.templates().then(setTemplates).catch(() => setTemplates([]));
    }
    if (activeTab === 'qrcodes') {
      aiTaskApi.qrCodes().then(setQrCodes).catch(() => setQrCodes([]));
    }
    if (activeTab === 'questions') {
      loadQuestions();
    }
  }, [activeTab]);

  const toggleQrCode = async (code: QrCodeRecord) => {
    const next = code.status === 'disabled' ? 'enabled' : 'disabled';
    try {
      const updated = await aiTaskApi.updateQrCodeStatus(code.id, next);
      setQrCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      addToast(`二维码「${code.code}」已${next === 'enabled' ? '启用' : '停用'}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const handleRetry = async (task: AITask) => {
    try {
      await aiTaskApi.retry(task.id);
      addToast('任务已重新排队', 'success');
      loadTasks();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '重试失败', 'error');
    }
  };

  const toggleTemplate = async (tpl: PromptTemplate) => {
    try {
      const updated = await aiTaskApi.updateTemplateStatus(tpl.id, !tpl.enabled);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      addToast(`模板「${tpl.name}」已${updated.enabled ? '启用' : '停用'}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  const groupedQuestions = useMemo(() => {
    const groups: { category: string; items: Question[] }[] = [];
    questions.forEach((q) => {
      const g = groups.find((x) => x.category === q.category);
      if (g) g.items.push(q);
      else groups.push({ category: q.category, items: [q] });
    });
    return groups;
  }, [questions]);

  const openCreateQuestion = () => {
    setQuestionForm({ category: '', title: '', question: '' });
    setQuestionModal({ mode: 'create' });
  };

  const openEditQuestion = (q: Question) => {
    setQuestionForm({ category: q.category, title: q.title, question: q.question });
    setQuestionModal({ mode: 'edit', question: q });
  };

  const saveQuestion = async () => {
    if (!questionForm.category.trim() || !questionForm.title.trim() || !questionForm.question.trim()) {
      addToast('分类、标题、题干不能为空', 'error');
      return;
    }
    setSavingQuestion(true);
    try {
      if (questionModal?.mode === 'edit' && questionModal.question) {
        await aiTaskApi.updateQuestion(questionModal.question.id, questionForm);
        addToast('题目已更新，采访时立即生效', 'success');
      } else {
        await aiTaskApi.createQuestion(questionForm);
        addToast('题目已添加，采访时立即生效', 'success');
      }
      setQuestionModal(null);
      loadQuestions();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '保存失败', 'error');
    } finally {
      setSavingQuestion(false);
    }
  };

  const removeQuestion = async (q: Question) => {
    if (!window.confirm(`确定删除题目「${q.title}」吗？删除后采访将不再提问此题。`)) return;
    try {
      await aiTaskApi.deleteQuestion(q.id);
      addToast('题目已删除', 'success');
      loadQuestions();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '删除失败', 'error');
    }
  };

  const totalTokens = useMemo(() => tokenStats.reduce((sum, s) => sum + s.totalTokens, 0), [tokenStats]);
  const totalTaskCount = useMemo(() => tokenStats.reduce((sum, s) => sum + s.taskCount, 0), [tokenStats]);

  const groupedTemplates = useMemo(() => {
    return templateTypeOrder.map((type) => ({
      type,
      label: templateTypeLabels[type],
      items: templates.filter((t) => t.type === type),
    }));
  }, [templates]);

  return (
    <div className="ai-task-page">
      <header className="page-header">
        <h1 className="page-title">AI 任务管理</h1>
      </header>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'queue' && (
        <div className="card">
          <div className="card-header ai-task-header">
            <div className="ai-task-filters">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AITaskType | 'all')}>
                <option value="all">全部类型</option>
                <option value="biography">传记生成</option>
                <option value="digital_person">数字人</option>
                <option value="short_video">短视频</option>
                <option value="pdf">PDF 排版</option>
                <option value="qrcode">二维码生成</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AITaskStatus | 'all')}>
                <option value="all">全部状态</option>
                <option value="queued">排队中</option>
                <option value="running">生成中</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>
          <div className="card-body ai-task-body">
            {tasks.length === 0 ? (
              <div className="ai-task-empty">暂无符合条件的任务</div>
            ) : (
              <div className="ai-task-table">
                <div className="ai-task-row ai-task-header-row">
                  <div className="ai-task-cell">关联对象</div>
                  <div className="ai-task-cell">类型</div>
                  <div className="ai-task-cell">状态</div>
                  <div className="ai-task-cell">Token 消耗</div>
                  <div className="ai-task-cell">耗时</div>
                  <div className="ai-task-cell">创建时间</div>
                  <div className="ai-task-cell">操作</div>
                </div>
                {tasks.map((task) => (
                  <div className="ai-task-row" key={task.id}>
                    <div className="ai-task-cell">
                      <div className="ai-task-target">{task.targetName}</div>
                      {task.status === 'failed' && task.failReason && (
                        <div className="ai-task-fail-reason">
                          <AlertCircle size={12} /> {task.failReason}
                        </div>
                      )}
                    </div>
                    <div className="ai-task-cell">{taskTypeLabels[task.type]}</div>
                    <div className="ai-task-cell">
                      <span className={`ai-task-status ${task.status}`}>
                        {task.status === 'success' && <CheckCircle size={12} />}
                        {task.status === 'failed' && <AlertCircle size={12} />}
                        {task.status === 'running' && <Loader size={12} />}
                        {task.status === 'queued' && <Clock size={12} />}
                        {taskStatusLabels[task.status]}
                      </span>
                    </div>
                    <div className="ai-task-cell">{task.tokens.toLocaleString()}</div>
                    <div className="ai-task-cell">{formatDuration(task)}</div>
                    <div className="ai-task-cell">{new Date(task.createdAt).toLocaleString()}</div>
                    <div className="ai-task-cell">
                      {task.status === 'failed' && (
                        <button className="btn btn-outline ai-task-retry-btn" onClick={() => handleRetry(task)}>
                          <RefreshCw size={12} /> 重试
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'token' && (
        <>
          <div className="ai-token-stats">
            <div className="card ai-token-stat">
              <Coins size={20} color="#1B5E4B" />
              <div>
                <div className="ai-token-stat-value">{totalTokens.toLocaleString()}</div>
                <div className="ai-token-stat-label">Token 总消耗</div>
              </div>
            </div>
            <div className="card ai-token-stat">
              <ListTodo size={20} color="#2563eb" />
              <div>
                <div className="ai-token-stat-value">{totalTaskCount}</div>
                <div className="ai-token-stat-label">任务总数</div>
              </div>
            </div>
            <div className="card ai-token-stat">
              <Coins size={20} color="#d97706" />
              <div>
                <div className="ai-token-stat-value">¥{(totalTokens * 0.00002).toFixed(2)}</div>
                <div className="ai-token-stat-label">估算成本（¥0.00002/Token）</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Coins size={16} /> 按类型汇总</h3>
            </div>
            <div className="card-body ai-task-body">
              {tokenStats.length === 0 ? (
                <div className="ai-task-empty">暂无统计数据</div>
              ) : (
                <div className="ai-task-table ai-token-table">
                  <div className="ai-task-row ai-task-header-row">
                    <div className="ai-task-cell">任务类型</div>
                    <div className="ai-task-cell">任务数</div>
                    <div className="ai-task-cell">Token 消耗</div>
                    <div className="ai-task-cell">估算成本</div>
                    <div className="ai-task-cell">占比</div>
                  </div>
                  {tokenStats.map((s) => (
                    <div className="ai-task-row" key={s.type}>
                      <div className="ai-task-cell">{taskTypeLabels[s.type]}</div>
                      <div className="ai-task-cell">{s.taskCount}</div>
                      <div className="ai-task-cell">{s.totalTokens.toLocaleString()}</div>
                      <div className="ai-task-cell">¥{(s.totalTokens * 0.00002).toFixed(2)}</div>
                      <div className="ai-task-cell">
                        <div className="ai-token-bar">
                          <div
                            className="ai-token-bar-inner"
                            style={{ width: `${totalTokens ? Math.round((s.totalTokens / totalTokens) * 100) : 0}%` }}
                          />
                        </div>
                        <span>{totalTokens ? Math.round((s.totalTokens / totalTokens) * 100) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <>
          {groupedTemplates.map((group) => (
            <div className="card ai-tpl-group" key={group.type}>
              <div className="card-header">
                <h3 className="card-title"><FileText size={16} /> {group.label}</h3>
              </div>
              <div className="card-body ai-task-body">
                {group.items.length === 0 ? (
                  <div className="ai-task-empty">暂无{group.label}</div>
                ) : (
                  group.items.map((tpl) => {
                    const enabled = tpl.enabled;
                    return (
                      <div className="ai-tpl-item" key={tpl.id}>
                        <div className="ai-tpl-info">
                          <div className="ai-tpl-name">{tpl.name}</div>
                          <div className="ai-tpl-summary">{tpl.summary}</div>
                          <div className="ai-tpl-time">更新于 {new Date(tpl.updatedAt).toLocaleString()}</div>
                        </div>
                        <label className="ai-tpl-switch">
                          <input type="checkbox" checked={enabled} onChange={() => toggleTemplate(tpl)} />
                          <span>{enabled ? '已启用' : '已停用'}</span>
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </>
      )}
      {activeTab === 'questions' && (
        <div className="card">
          <div className="card-header ai-task-header">
            <h3 className="card-title"><MessageSquareText size={16} /> 采访题库（AI 采访实时使用，共 {questions.length} 题）</h3>
            <button className="btn btn-primary btn-sm" onClick={openCreateQuestion}>
              <Plus size={14} /> 新增题目
            </button>
          </div>
          <div className="card-body ai-task-body">
            {groupedQuestions.length === 0 ? (
              <div className="ai-task-empty">题库为空，点击右上角「新增题目」添加</div>
            ) : (
              groupedQuestions.map((group) => (
                <div className="ai-tpl-group" key={group.category}>
                  <div className="ai-q-category">{group.category}（{group.items.length}）</div>
                  {group.items.map((q) => (
                    <div className="ai-tpl-item" key={q.id}>
                      <div className="ai-tpl-info">
                        <div className="ai-tpl-name">{q.order}. {q.title}</div>
                        <div className="ai-tpl-summary">{q.question}</div>
                      </div>
                      <div className="ai-q-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openEditQuestion(q)}>
                          <Pencil size={13} /> 编辑
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => removeQuestion(q)}>
                          <Trash2 size={13} /> 删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {activeTab === 'qrcodes' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FileText size={16} /> 二维码列表</h3>
          </div>
          <div className="card-body ai-task-body">
            {qrCodes.length === 0 ? (
              <div className="ai-task-empty">暂无二维码记录</div>
            ) : (
              <div className="ai-task-table">
                <div className="ai-task-row ai-task-header-row">
                  <div className="ai-task-cell">二维码编号</div>
                  <div className="ai-task-cell">关联数字馆</div>
                  <div className="ai-task-cell">码类型</div>
                  <div className="ai-task-cell">状态</div>
                  <div className="ai-task-cell">生成时间</div>
                  <div className="ai-task-cell">操作</div>
                </div>
                {qrCodes.map((code) => (
                  <div className="ai-task-row" key={code.id}>
                    <div className="ai-task-cell">
                      <div className="ai-task-target">{code.code}</div>
                    </div>
                    <div className="ai-task-cell">{code.museumName}</div>
                    <div className="ai-task-cell">{qrCodeTypeLabels[code.type]}</div>
                    <div className="ai-task-cell">
                      <span className={`ai-task-status ${code.status === 'disabled' ? 'failed' : code.status === 'unbound' ? 'queued' : 'success'}`}>
                        {qrCodeStatusLabels[code.status]}
                      </span>
                    </div>
                    <div className="ai-task-cell">{new Date(code.createdAt).toLocaleString()}</div>
                    <div className="ai-task-cell">
                      <button className="btn btn-outline ai-task-retry-btn" onClick={() => toggleQrCode(code)}>
                        {code.status === 'disabled' ? '启用' : '停用'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={!!questionModal}
        title={questionModal?.mode === 'edit' ? '编辑题目' : '新增题目'}
        onClose={() => setQuestionModal(null)}
      >
        <div className="ai-q-form">
          <label className="ai-q-label">题目分类</label>
          <input
            className="ai-q-input"
            placeholder="如：童年成长 / 家庭生活 / 事业经历"
            value={questionForm.category}
            onChange={(e) => setQuestionForm((f) => ({ ...f, category: e.target.value }))}
          />
          <label className="ai-q-label">题目标题</label>
          <input
            className="ai-q-input"
            placeholder="如：出生与童年"
            value={questionForm.title}
            onChange={(e) => setQuestionForm((f) => ({ ...f, title: e.target.value }))}
          />
          <label className="ai-q-label">题干（AI 采访时提问的内容）</label>
          <textarea
            className="ai-q-input ai-q-textarea"
            rows={4}
            placeholder="请输入问题内容"
            value={questionForm.question}
            onChange={(e) => setQuestionForm((f) => ({ ...f, question: e.target.value }))}
          />
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={savingQuestion} onClick={saveQuestion}>
            {savingQuestion ? '保存中…' : '保存'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function formatDuration(task: AITask): string {
  if (!task.finishedAt) return '-';
  const ms = new Date(task.finishedAt).getTime() - new Date(task.createdAt).getTime();
  if (ms < 0) return '-';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '不足 1 分钟';
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
}
