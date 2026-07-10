import { useState } from 'react';
import { FileText, Search, ExternalLink, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './PolicyList.css';

const policies = [
  { title: '《家庭档案管理办法》', meta: '国家档案局 · 2025-08-12', tag: '档案管理' },
  { title: '《电子证照互认互通指南》', meta: '国务院办公厅 · 2025-11-03', tag: '电子证照' },
  { title: '《数字遗产继承指导意见》', meta: '司法部 · 2026-01-20', tag: '数字遗产' },
  { title: '《个人信息保护法实施条例》', meta: '全国人大常委会 · 2024-11-01', tag: '隐私保护' },
  { title: '《家风建设指导意见》', meta: '中央文明办 · 2025-03-15', tag: '家风建设' },
  { title: '《政务服务便民热线归并方案》', meta: '国务院办公厅 · 2025-06-18', tag: '政务服务' },
];

export default function PolicyList() {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof policies[number] | null>(null);

  const filtered = policies.filter((p) => p.title.includes(search));

  return (
    <div className="detail-page policy-list-page">
      <header className="page-header">
        <h1 className="page-title">政策指引</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">全部政策</h3>
          <div className="policy-search">
            <Search size={14} />
            <input type="text" placeholder="搜索政策名称" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="card-body">
          <div className="policy-list">
            {filtered.map((p, i) => (
              <div className="policy-list-item" key={i} onClick={() => setSelected(p)}>
                <FileText size={20} color="#1B5E4B" />
                <div className="policy-list-main">
                  <div className="policy-list-title">{p.title}</div>
                  <div className="policy-list-meta">{p.meta}</div>
                </div>
                <span className="policy-list-tag">{p.tag}</span>
                <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`https://chuanjiashi.cn/policy/${i}`); addToast('原文链接已复制', 'success'); }}><ExternalLink size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{selected.title}</h4><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <p>{selected.meta}</p>
              <p>这里是政策原文摘要。用户可在此查看政策要点、适用范围及办理指引。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
