import { useEffect, useState } from 'react';
import { quotaApi, type QuotaSummary } from '../api/quota';
import { useToast } from '../hooks/useToast';
import Annotate from '../components/annotation/Annotate';
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
          <Annotate id="ai-usage.user-rank">
          <div className="card ai-usage-detail-card">
            <div className="card-header ai-usage-detail-header">
              <h3 className="ai-usage-detail-title">用户 Token 使用排行</h3>
            </div>
            <div className="card-body ai-usage-detail-body">
              {summary.details.length === 0 ? (
                <div className="ai-usage-empty">暂无明细数据</div>
              ) : (
                <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>用户</th>
                      <th>累计 Token</th>
                      <th>传记生成</th>
                      <th>采访问题</th>
                      <th>数字人对话</th>
                      <th>追问互动</th>
                      <th>存储</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.details.map((item, idx) => (
                      <tr key={item.userId}>
                        <td className="admin-table-text-left">
                          <div className="ai-usage-cell-user">
                            <span className="ai-usage-rank">{idx + 1}</span>
                            {item.userId}
                          </div>
                        </td>
                        <td className="admin-table-text-left ai-usage-cell-tokens">
                          {formatTokens(item.totalTokens)}
                        </td>
                        <td>{formatTokens(item.biographyGenerate.tokensUsed || 0)}</td>
                        <td>{formatTokens(item.interviewQuestion.tokensUsed || 0)}</td>
                        <td>{formatTokens(item.digitalDialog.tokensUsed || 0)}</td>
                        <td>{formatTokens(item.followUp.tokensUsed || 0)}</td>
                        <td>{item.storage.usedMB}MB</td>
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
