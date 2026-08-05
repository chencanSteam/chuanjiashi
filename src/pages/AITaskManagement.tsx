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
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { aiTaskApi } from '../api/aiTask';
import {
  loadTopicConfig,
  createTopic,
  updateTopic,
  removeTopic,
  type InterviewTopicConfig,
} from '../data/interviewTopicConfig';
import type { TokenCostStat } from '../api/aiTask';
import Modal from '../components/ui/Modal';
import type { AITask, AITaskType, AITaskStatus, PromptTemplate, PromptTemplateType } from '../mocks/types';
import './AITaskManagement.css';

const tabs = [
  { key: 'queue', label: '任务队列' },
  { key: 'token', label: 'Token 成本' },
  { key: 'templates', label: '模板管理' },
  { key: 'topics', label: '采访主题' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const taskTypeLabels: Record<AITaskType, string> = {
  biography: '传记生成',
  digital_person: '数字人',
  short_video: '短视频',
  pdf: 'PDF 排版',
  qrcode: '二维码生成',
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
  const [topicList, setTopicList] = useState<InterviewTopicConfig[]>([]);
  const [topicModal, setTopicModal] = useState<{ mode: 'create' | 'edit'; topic?: InterviewTopicConfig } | null>(null);
  const [topicForm, setTopicForm] = useState({ title: '', summary: '' });

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
      // 同步加载全部任务，用于按用户汇总消耗
      aiTaskApi.list({ type: 'all', status: 'all' }).then(setTasks).catch(() => setTasks([]));
    }
    if (activeTab === 'templates') {
      aiTaskApi.templates().then(setTemplates).catch(() => setTemplates([]));
    }
    if (activeTab === 'topics') {
      setTopicList(loadTopicConfig());
    }
  }, [activeTab]);

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

  // 模板编辑
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', summary: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const openEditTemplate = (tpl: PromptTemplate) => {
    setTemplateForm({ name: tpl.name, summary: tpl.summary });
    setEditingTemplate(tpl);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    if (!templateForm.name.trim() || !templateForm.summary.trim()) {
      addToast('模板名称和内容不能为空', 'error');
      return;
    }
    setSavingTemplate(true);
    try {
      const updated = await aiTaskApi.updateTemplate(editingTemplate.id, {
        name: templateForm.name.trim(),
        summary: templateForm.summary.trim(),
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTemplate(null);
      addToast('模板已更新', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '保存失败', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  // 采访主题 CRUD（采访页实时读取该配置）
  const refreshTopics = () => setTopicList(loadTopicConfig());

  const openCreateTopic = () => {
    setTopicForm({ title: '', summary: '' });
    setTopicModal({ mode: 'create' });
  };

  const openEditTopic = (t: InterviewTopicConfig) => {
    setTopicForm({ title: t.title, summary: t.summary });
    setTopicModal({ mode: 'edit', topic: t });
  };

  const saveTopic = () => {
    if (!topicForm.title.trim()) {
      addToast('主题名称不能为空', 'error');
      return;
    }
    if (topicModal?.mode === 'edit' && topicModal.topic) {
      updateTopic(topicModal.topic.id, { title: topicForm.title.trim(), summary: topicForm.summary.trim() });
      addToast('主题已更新，采访时立即生效', 'success');
    } else {
      createTopic({ title: topicForm.title.trim(), summary: topicForm.summary.trim() });
      addToast('主题已添加，采访问题将由 AI 根据主题名生成', 'success');
    }
    setTopicModal(null);
    refreshTopics();
  };

  const toggleTopic = (t: InterviewTopicConfig) => {
    updateTopic(t.id, { enabled: !t.enabled });
    addToast(`主题「${t.title}」已${t.enabled ? '停用' : '启用'}`, 'success');
    refreshTopics();
  };

  const deleteTopic = (t: InterviewTopicConfig) => {
    if (!window.confirm(`确定删除主题「${t.title}」吗？采访将不再包含该主题。`)) return;
    removeTopic(t.id);
    addToast('主题已删除', 'success');
    refreshTopics();
  };

  const totalTokens = useMemo(() => tokenStats.reduce((sum, s) => sum + s.totalTokens, 0), [tokenStats]);
  const totalTaskCount = useMemo(() => tokenStats.reduce((sum, s) => sum + s.taskCount, 0), [tokenStats]);

  // 按用户汇总 Token 消耗
  const userStats = useMemo(() => {
    const map = new Map<string, { userName: string; userPhone: string; taskCount: number; totalTokens: number }>();
    tasks.forEach((t) => {
      const key = t.userPhone;
      const stat = map.get(key) || { userName: t.userName, userPhone: t.userPhone, taskCount: 0, totalTokens: 0 };
      stat.taskCount += 1;
      stat.totalTokens += t.tokens;
      map.set(key, stat);
    });
    return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens);
  }, [tasks]);

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
                  <div className="ai-task-cell">用户</div>
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
                      <div className="ai-task-target">{task.userName}</div>
                      <div className="ai-task-user-phone">{task.userPhone}</div>
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
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Coins size={16} /> 按用户汇总</h3>
            </div>
            <div className="card-body ai-task-body">
              {userStats.length === 0 ? (
                <div className="ai-task-empty">暂无统计数据</div>
              ) : (
                <div className="ai-task-table ai-token-table">
                  <div className="ai-task-row ai-task-header-row">
                    <div className="ai-task-cell">用户</div>
                    <div className="ai-task-cell">任务数</div>
                    <div className="ai-task-cell">Token 消耗</div>
                    <div className="ai-task-cell">估算成本</div>
                    <div className="ai-task-cell">占比</div>
                  </div>
                  {userStats.map((s) => (
                    <div className="ai-task-row" key={s.userPhone}>
                      <div className="ai-task-cell">
                        <div className="ai-task-target">{s.userName}</div>
                        <div className="ai-task-user-phone">{s.userPhone}</div>
                      </div>
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
                        <div className="ai-q-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => openEditTemplate(tpl)}>
                            <Pencil size={13} /> 编辑
                          </button>
                          <label className="ai-tpl-switch">
                            <input type="checkbox" checked={enabled} onChange={() => toggleTemplate(tpl)} />
                            <span>{enabled ? '已启用' : '已停用'}</span>
                          </label>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </>
      )}
      {activeTab === 'topics' && (
        <div className="card">
          <div className="card-header ai-task-header">
            <h3 className="card-title"><ListTodo size={16} /> 采访主题（采访页按此配置展示，共 {topicList.length} 个）</h3>
            <button className="btn btn-primary btn-sm" onClick={openCreateTopic}>
              <Plus size={14} /> 新增主题
            </button>
          </div>
          <div className="card-body ai-task-body">
            {topicList.length === 0 ? (
              <div className="ai-task-empty">暂无主题，点击右上角「新增主题」添加</div>
            ) : (
              topicList.map((t, i) => (
                <div className="ai-tpl-item" key={t.id}>
                  <div className="ai-tpl-info">
                    <div className="ai-tpl-name">
                      {i + 1}. {t.title}
                      <span className={`ai-task-status ${t.enabled ? 'success' : 'queued'}`} style={{ marginLeft: 8 }}>
                        {t.enabled ? '启用中' : '已停用'}
                      </span>
                      {!t.builtin && (
                        <span className="ai-task-status queued" style={{ marginLeft: 4 }}>AI 出题</span>
                      )}
                    </div>
                    <div className="ai-tpl-summary">{t.summary || '暂无简介'}</div>
                  </div>
                  <div className="ai-q-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => toggleTopic(t)}>
                      {t.enabled ? '停用' : '启用'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditTopic(t)}>
                      <Pencil size={13} /> 编辑
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => deleteTopic(t)}>
                      <Trash2 size={13} /> 删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Modal
        open={!!editingTemplate}
        title="编辑模板"
        onClose={() => setEditingTemplate(null)}
      >
        <div className="ai-q-form">
          <label className="ai-q-label">模板名称</label>
          <input
            className="ai-q-input"
            value={templateForm.name}
            onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <label className="ai-q-label">模板内容</label>
          <textarea
            className="ai-q-input ai-q-textarea"
            rows={5}
            value={templateForm.summary}
            onChange={(e) => setTemplateForm((f) => ({ ...f, summary: e.target.value }))}
          />
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={savingTemplate} onClick={saveTemplate}>
            {savingTemplate ? '保存中…' : '保存'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!topicModal}
        title={topicModal?.mode === 'edit' ? '编辑主题' : '新增主题'}
        onClose={() => setTopicModal(null)}
      >
        <div className="ai-q-form">
          <label className="ai-q-label">主题名称</label>
          <input
            className="ai-q-input"
            placeholder="如：军旅生涯 / 手艺传承"
            value={topicForm.title}
            onChange={(e) => setTopicForm((f) => ({ ...f, title: e.target.value }))}
          />
          <label className="ai-q-label">主题简介</label>
          <textarea
            className="ai-q-input ai-q-textarea"
            rows={3}
            placeholder="一句话说明该主题采访的内容方向"
            value={topicForm.summary}
            onChange={(e) => setTopicForm((f) => ({ ...f, summary: e.target.value }))}
          />
          {topicModal?.mode === 'create' && (
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
              新增的主题没有预设题库，采访问题将由 AI 根据主题名称自动生成。
            </p>
          )}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={saveTopic}>
            保存
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
