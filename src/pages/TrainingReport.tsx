import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Download, Printer, FileText, TrendingUp, Award, Activity } from 'lucide-react';
import './TrainingReport.css';

const metrics = [
  { label: '语言风格学习', value: 82, color: '#1B5E4B' },
  { label: '情感记忆', value: 76, color: '#2D7A66' },
  { label: '价值观建模', value: 85, color: '#4CA88E' },
  { label: '一致性测试', value: 73, color: '#D4A373' },
  { label: '安全边界', value: 94, color: '#C27BA0' },
];

const trends = [
  { date: '06-18', score: 78 },
  { date: '06-17', score: 75 },
  { date: '06-16', score: 72 },
  { date: '06-15', score: 70 },
  { date: '06-14', score: 68 },
  { date: '06-13', score: 65 },
];

export default function TrainingReport() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const overall = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length);
  const maxScore = Math.max(...trends.map((t) => t.score));

  const downloadReport = () => {
    setDownloading(true);
    setTimeout(() => {
      const blob = new Blob(['数字人训练报告\n综合得分：' + overall + '\n生成时间：' + new Date().toLocaleString('zh-CN')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '训练报告.txt';
      a.click();
      URL.revokeObjectURL(url);
      setDownloading(false);
      addToast('报告已下载', 'success');
    }, 600);
  };

  return (
    <div className="detail-page training-report-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/digital-person')}><ArrowLeft size={16} /> 返回</button>
        <h1 className="page-title">训练报告</h1>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={14} /> 打印</button>
          <button className="btn btn-primary" onClick={downloadReport} disabled={downloading}><Download size={14} /> {downloading ? '生成中…' : '下载报告'}</button>
        </div>
      </header>

      <div className="training-report-grid">
        <div className="card training-overall-card">
          <div className="card-body training-overall-body">
            <div className="training-overall-score">
              <Award size={36} />
              <div>
                <div className="training-overall-value">{overall}</div>
                <div className="training-overall-label">综合训练得分</div>
              </div>
            </div>
            <div className="training-overall-desc">
              基于最近 7 次训练数据综合评估，数字亲人的人格模型整体稳定，语言风格与价值观建模表现较好。
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title"><Activity size={16} /> 能力维度</h3></div>
          <div className="card-body training-metrics-body">
            {metrics.map((m) => (
              <div className="training-metric-row" key={m.label}>
                <div className="training-metric-label">{m.label}</div>
                <div className="training-metric-bar"><div style={{ width: `${m.value}%`, background: m.color }} /></div>
                <div className="training-metric-value">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title"><TrendingUp size={16} /> 训练趋势</h3></div>
          <div className="card-body training-trend-body">
            <div className="training-trend-chart">
              {trends.map((t, i) => (
                <div className="training-trend-column" key={t.date}>
                  <div className="training-trend-bar-wrap">
                    <div className="training-trend-bar" style={{ height: `${(t.score / 100) * 160}px`, opacity: i === 0 ? 1 : 0.6 }} />
                  </div>
                  <div className="training-trend-date">{t.date}</div>
                  <div className="training-trend-score">{t.score}</div>
                </div>
              ))}
            </div>
            <div className="training-trend-summary">
              最高分：<strong>{maxScore}</strong> · 近 7 天提升：<strong>+13</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title"><FileText size={16} /> 训练总结</h3></div>
          <div className="card-body training-summary-text">
            <p>1. 语言风格学习完成度较高，日常对话中已能较好模拟原人口吻。</p>
            <p>2. 情感记忆维度仍有提升空间，建议补充更多生活场景对话样本。</p>
            <p>3. 安全边界设置完善，已有效过滤敏感与伦理风险内容。</p>
            <p>4. 建议下一训练周期重点加强一致性测试与情感记忆。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
