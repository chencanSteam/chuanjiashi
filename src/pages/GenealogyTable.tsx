import { useState } from 'react';
import { ArrowLeft, Printer, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import './GenealogyTable.css';

const tableData = [
  ['第1代', '张文远', '1860-1920', '-', '3'],
  ['第2代', '张鸿渐', '1888-1955', '李氏', '3'],
  ['第2代', '李氏', '1892-1971', '张鸿渐', '3'],
  ['第3代', '张景行', '1915-1983', '王淑兰', '2'],
  ['第3代', '王淑兰', '1918-1998', '张景行', '2'],
  ['第3代', '张景明', '1920-1988', '刘淑贞', '2'],
  ['第3代', '刘淑贞', '1923-2010', '张景明', '2'],
  ['第4代', '张一帆', '1942-', '陈惠英', '3'],
  ['第4代', '陈惠英', '1945-', '张一帆', '3'],
  ['第4代', '张一鸣', '1946-', '周淑娟', '2'],
  ['第4代', '周淑娟', '1948-', '张一鸣', '2'],
  ['第4代', '张一舟', '1949-', '-', '0'],
  ['第5代', '张伟', '1968-', '李娜', '2'],
  ['第5代', '李娜', '1970-', '张伟', '2'],
  ['第5代', '张磊', '1972-', '刘洋', '2'],
  ['第5代', '刘洋', '1974-', '张磊', '2'],
  ['第6代', '张子涵', '1995-', '-', '0'],
  ['第6代', '张子墨', '2000-', '-', '0'],
];

export default function GenealogyTable() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const filtered = tableData.filter((row) => row[1].includes(search));

  return (
    <div className="detail-page genealogy-table-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">完整世系表</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">张氏家族世系表</h3>
          <div className="table-actions">
            <div className="genealogy-search">
              <Search size={14} />
              <input type="text" placeholder="搜索姓名" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-outline" onClick={() => window.print()}><Printer size={14} /> 打印</button>
            <button className="btn btn-outline" onClick={() => {
              const csv = [['世代', '姓名', '生卒年', '配偶', '子女数'].join(','), ...tableData.map((r) => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '世系表.csv';
              a.click();
              URL.revokeObjectURL(url);
              addToast('世系表已导出', 'success');
            }}><Download size={14} /> 导出</button>
          </div>
        </div>
        <div className="card-body table-body">
          <table className="genealogy-table full-table">
            <thead><tr><th>世代</th><th>姓名</th><th>生卒年</th><th>配偶</th><th>子女数</th><th>状态</th></tr></thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(row[1])}`)}>
                  <td>{row[0]}</td>
                  <td><Avatar name={row[1]} size={28} /><span>{row[1]}</span></td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                  <td>{row[4]}</td>
                  <td><span className={`status-tag ${row[2].includes('-') && !row[2].endsWith('-') ? 'deceased' : ''}`}>{row[2].includes('-') && !row[2].endsWith('-') ? '已故' : '健在'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
