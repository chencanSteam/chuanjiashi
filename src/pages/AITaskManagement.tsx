import { useEffect, useMemo, useState } from 'react';
import {
  Coins,
  AlertCircle,
} from 'lucide-react';
import { aiTaskApi } from '../api/aiTask';
import type { AITask, AITaskType } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './AITaskManagement.css';

const tabs = [
  { key: 'queue', label: '任务队列' },
  { key: 'token', label: 'Token 成本' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const taskTypeLabels: Record<AITaskType, string> = {
  biography: '传记生成',
  digital_person: '数字人',
  short_video: '短视频',
  pdf: 'PDF 排版',
};

// 任务未记录模型时按类型兜底展示（演示数据）
const typeDefaultModels: Record<AITaskType, string> = {
  biography: 'Kimi K2',
  digital_person: '通义千问 Max',
  short_video: '豆包 Pro',
  pdf: 'DeepSeek-V3',
};

export default function AITaskManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [typeFilter, setTypeFilter] = useState<AITaskType | 'all'>('all');

  // 过滤掉历史遗留的非大模型任务（如二维码生成）
  const onlyModelTasks = (list: AITask[]) => list.filter((t) => t.type in taskTypeLabels);

  const taskModel = (t: AITask) => t.model || typeDefaultModels[t.type];

  const loadTasks = () => {
    aiTaskApi
      .list({ type: typeFilter, status: 'all' })
      .then((list) => setTasks(onlyModelTasks(list)))
      .catch(() => setTasks([]));
  };

  useEffect(() => {
    if (activeTab === 'queue') loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, typeFilter]);

  useEffect(() => {
    if (activeTab === 'token') {
      aiTaskApi.list({ type: 'all', status: 'all' }).then((list) => setTasks(onlyModelTasks(list))).catch(() => setTasks([]));
    }
  }, [activeTab]);

  // 按类型汇总 Token 消耗（含使用模型）
  const typeStats = useMemo(() => {
    const map = new Map<string, { type: AITaskType; totalTokens: number; models: Set<string> }>();
    tasks.forEach((t) => {
      const stat = map.get(t.type) || { type: t.type, totalTokens: 0, models: new Set<string>() };
      stat.totalTokens += t.tokens;
      stat.models.add(taskModel(t));
      map.set(t.type, stat);
    });
    return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // 按用户汇总 Token 消耗（含任务类型与使用模型）
  const userStats = useMemo(() => {
    const map = new Map<string, { userName: string; userPhone: string; totalTokens: number; types: Set<string>; models: Set<string> }>();
    tasks.forEach((t) => {
      const key = t.userPhone;
      const stat = map.get(key) || { userName: t.userName, userPhone: t.userPhone, totalTokens: 0, types: new Set<string>(), models: new Set<string>() };
      stat.totalTokens += t.tokens;
      stat.types.add(taskTypeLabels[t.type]);
      stat.models.add(taskModel(t));
      map.set(key, stat);
    });
    return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return (
    <div className="ai-task-page">
      <header className="page-header">
        <h1 className="page-title">AI 任务管理</h1>
      </header>

      <Annotate id="admin-ai-tasks.tabs" inline>
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
      </Annotate>

      {activeTab === 'queue' && (
        <div className="card">
          <div className="card-header ai-task-header">
            <Annotate id="admin-ai-tasks.type-filter" inline>
            <div className="ai-task-filters">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AITaskType | 'all')}>
                <option value="all">全部类型</option>
                <option value="biography">传记生成</option>
                <option value="digital_person">数字人</option>
                <option value="short_video">短视频</option>
                <option value="pdf">PDF 排版</option>
              </select>
            </div>
            </Annotate>
          </div>
          <Annotate id="admin-ai-tasks.task-list">
          <div className="card-body ai-task-body">
            {tasks.length === 0 ? (
              <div className="ai-task-empty">暂无符合条件的任务</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>用户</th>
                      <th>类型</th>
                      <th>使用模型</th>
                      <th>Token 消耗</th>
                      <th>耗时</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="admin-table-text-left">
                          <div className="ai-task-target">{task.userName}</div>
                          <div className="ai-task-user-phone">{task.userPhone}</div>
                          {task.status === 'failed' && task.failReason && (
                            <div className="ai-task-fail-reason">
                              <AlertCircle size={12} /> {task.failReason}
                            </div>
                          )}
                        </td>
                        <td>{taskTypeLabels[task.type]}</td>
                        <td>{taskModel(task)}</td>
                        <td>{task.tokens.toLocaleString()}</td>
                        <td>{formatDuration(task)}</td>
                        <td>{new Date(task.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </Annotate>
        </div>
      )}

      {activeTab === 'token' && (
        <>
          <Annotate id="admin-ai-tasks.token-type-stats">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Coins size={16} /> 按类型汇总</h3>
            </div>
            <div className="card-body ai-task-body">
              {typeStats.length === 0 ? (
                <div className="ai-task-empty">暂无统计数据</div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>任务类型</th>
                        <th>使用模型</th>
                        <th>Token 消耗</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeStats.map((s) => (
                        <tr key={s.type}>
                          <td>{taskTypeLabels[s.type]}</td>
                          <td>{Array.from(s.models).join('、')}</td>
                          <td>{s.totalTokens.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          </Annotate>
          <Annotate id="admin-ai-tasks.token-user-stats">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Coins size={16} /> 按用户汇总</h3>
            </div>
            <div className="card-body ai-task-body">
              {userStats.length === 0 ? (
                <div className="ai-task-empty">暂无统计数据</div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>用户</th>
                        <th>任务类型</th>
                        <th>使用模型</th>
                        <th>Token 消耗</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStats.map((s) => (
                        <tr key={s.userPhone}>
                          <td className="admin-table-text-left">
                            <div className="ai-task-target">{s.userName}</div>
                            <div className="ai-task-user-phone">{s.userPhone}</div>
                          </td>
                          <td>{Array.from(s.types).join('、')}</td>
                          <td>{Array.from(s.models).join('、')}</td>
                          <td>{s.totalTokens.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          </Annotate>
        </>
      )}
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
