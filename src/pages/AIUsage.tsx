import { useEffect, useMemo, useState } from 'react';
import {
  Cpu,
  MessageSquare,
  PenTool,
  Bot,
  Users,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { quotaApi, type QuotaSummary } from '../api/quota';
import { useToast } from '../hooks/useToast';
import './AIUsage.css';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function AIUsage() {
  const { addToast } = useToast();
  const [summary, setSummary] = useState<QuotaSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    quotaApi
      .adminSummary()
      .then(setSummary)
      .catch((err) => {
        addToast(err.message || '加载失败', 'error');
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  const statCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        icon: Zap,
        label: '累计 Token 消耗',
        value: formatTokens(summary.totalTokens),
        sub: '平台总消耗',
        color: '#1B5E4B',
      },
      {
        icon: Users,
        label: '使用用户',
        value: summary.userCount.toString(),
        sub: '产生 AI 调用',
        color: '#2563eb',
      },
      {
        icon: Cpu,
        label: '传记生成 Token',
        value: formatTokens(summary.biographyGenerate.tokensUsed),
        sub: '消耗最多',
        color: '#7c3aed',
      },
      {
        icon: MessageSquare,
        label: '采访问题 Token',
        value: formatTokens(summary.interviewQuestion.tokensUsed),
        sub: `${summary.interviewQuestion.used} 次调用`,
        color: '#d97706',
      },
      {
        icon: Bot,
        label: '数字人对话 Token',
        value: formatTokens(summary.digitalDialog.tokensUsed),
        sub: `${summary.digitalDialog.used} 次调用`,
        color: '#0891b2',
      },
      {
        icon: PenTool,
        label: '追问互动 Token',
        value: formatTokens(summary.followUp.tokensUsed),
        sub: `${summary.followUp.used} 次调用`,
        color: '#10b981',
      },
    ];
  }, [summary]);

  const totalCalls = useMemo(() => {
    if (!summary) return 0;
    return (
      summary.interviewQuestion.used +
      summary.followUp.used +
      summary.biographyGenerate.used +
      summary.digitalDialog.used
    );
  }, [summary]);

  return (
    <div className="ai-usage-page">
      <header className="page-header">
        <h1 className="page-title">AI 使用情况</h1>
      </header>

      {loading ? (
        <div className="card">
          <div className="card-body ai-usage-empty">加载中…</div>
        </div>
      ) : !summary ? (
        <div className="card">
          <div className="card-body ai-usage-empty">暂无数据</div>
        </div>
      ) : (
        <>
          <div className="ai-usage-overview card">
            <div className="ai-usage-overview-icon">
              <Cpu size={28} color="#fff" />
            </div>
            <div className="ai-usage-overview-body">
              <div className="ai-usage-overview-title">平台 Token 总消耗</div>
              <div className="ai-usage-overview-value">{formatTokens(summary.totalTokens)}</div>
              <div className="ai-usage-overview-label">累计 {totalCalls.toLocaleString()} 次 AI 调用</div>
            </div>
            <div className="ai-usage-overview-trend">
              <TrendingUp size={18} />
              <span>较上周 +18.2%</span>
            </div>
          </div>

          <div className="ai-usage-stats">
            {statCards.map((card) => (
              <div className="card ai-usage-stat-card" key={card.label}>
                <div className="ai-usage-stat-icon" style={{ color: card.color, background: `${card.color}14` }}>
                  <card.icon size={20} />
                </div>
                <div className="ai-usage-stat-body">
                  <div className="ai-usage-stat-value">{card.value}</div>
                  <div className="ai-usage-stat-label">{card.label}</div>
                  {card.sub && <div className="ai-usage-stat-sub">{card.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="card ai-usage-detail-card">
            <div className="card-header ai-usage-detail-header">
              <h3 className="ai-usage-detail-title">用户 Token 使用排行</h3>
            </div>
            <div className="card-body ai-usage-detail-body">
              {summary.details.length === 0 ? (
                <div className="ai-usage-empty">暂无明细数据</div>
              ) : (
                <div className="ai-usage-table">
                  <div className="ai-usage-row ai-usage-header-row">
                    <div className="ai-usage-cell">用户</div>
                    <div className="ai-usage-cell">累计 Token</div>
                    <div className="ai-usage-cell">传记生成</div>
                    <div className="ai-usage-cell">采访问题</div>
                    <div className="ai-usage-cell">数字人对话</div>
                    <div className="ai-usage-cell">追问互动</div>
                    <div className="ai-usage-cell">存储</div>
                  </div>
                  {summary.details.map((item, idx) => (
                    <div className="ai-usage-row" key={item.userId}>
                      <div className="ai-usage-cell ai-usage-cell-user">
                        <span className="ai-usage-rank">{idx + 1}</span>
                        {item.userId}
                      </div>
                      <div className="ai-usage-cell ai-usage-cell-tokens">
                        {formatTokens(item.totalTokens)}
                        <div className="ai-usage-token-bar">
                          <div
                            className="ai-usage-token-bar-fill"
                            style={{
                              width: `${summary.totalTokens ? (item.totalTokens / summary.totalTokens) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="ai-usage-cell">{formatTokens(item.biographyGenerate.tokensUsed || 0)}</div>
                      <div className="ai-usage-cell">{formatTokens(item.interviewQuestion.tokensUsed || 0)}</div>
                      <div className="ai-usage-cell">{formatTokens(item.digitalDialog.tokensUsed || 0)}</div>
                      <div className="ai-usage-cell">{formatTokens(item.followUp.tokensUsed || 0)}</div>
                      <div className="ai-usage-cell">{item.storage.usedMB}MB</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
