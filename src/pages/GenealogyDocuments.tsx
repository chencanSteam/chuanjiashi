import { useState } from 'react';
import { ArrowLeft, FileText, Plus, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './GenealogyDocuments.css';

const documents = [
  { title: '张氏族谱（民国版）', year: '民国三年（1914）', editor: '张鸿渐', pages: '186页' },
  { title: '清河张氏宗谱（清）', year: '清光绪二十年（1894）', editor: '张景行', pages: '240页' },
  { title: '张氏家规（抄本）', year: '清道光十五年（1835）', editor: '张文远', pages: '32页' },
  { title: '张氏迁徙图考', year: '2018', editor: '张明远', pages: '48页' },
  { title: '家风家训汇编', year: '2022', editor: '张建国', pages: '76页' },
  { title: '口述史采访记录', year: '2024', editor: '张子涵', pages: '120页' },
];

export default function GenealogyDocuments() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<typeof documents[0] | null>(null);
  const filtered = documents.filter((d) => d.title.includes(search));

  return (
    <div className="detail-page genealogy-documents-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">家谱文献库（86）</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">全部文献</h3>
          <label className="btn btn-primary">
            <Plus size={14} /> 上传文献
            <input type="file" hidden onChange={() => addToast('文献上传成功', 'success')} />
          </label>
        </div>
        <div className="card-body">
          <div className="documents-toolbar">
            <div className="documents-search">
              <Search size={14} />
              <input type="text" placeholder="搜索文献名称" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="documents-list">
            {filtered.map((d, i) => (
              <div className="document-item" key={i} onClick={() => setPreview(d)}>
                <div className="document-thumb"><FileText size={24} /></div>
                <div className="document-main">
                  <div className="document-title">{d.title}</div>
                  <div className="document-meta">{d.year} · 修谱人：{d.editor} · {d.pages}</div>
                </div>
                <button className="btn btn-outline" onClick={(e) => {
                  e.stopPropagation();
                  const blob = new Blob([`${d.title}\n${d.year}\n修谱人：${d.editor}\n页数：${d.pages}`], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${d.title}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  addToast('文献已下载', 'success');
                }}><Download size={14} /> 下载</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{preview.title}</h4><button className="modal-close" onClick={() => setPreview(null)}>关闭</button></div>
            <div className="modal-body preview-body">
              <div className="preview-doc"><FileText size={48} /></div>
              <p>{preview.year} · 修谱人：{preview.editor} · {preview.pages}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
