import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  GitFork,
  Landmark,
  FileText,
  ChevronRight,
  Plus,
  ZoomOut,
  ZoomIn,
  Maximize2,
  Filter,
  Printer,
  Link,
  FileType,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import './Genealogy.css';

const tabs = [
  { key: 'tree', label: '家谱树' },
  { key: 'table', label: '世系表' },
  { key: 'migration', label: '迁徙图' },
  { key: 'culture', label: '姓氏文化' },
  { key: 'collab', label: '修谱协作' },
  { key: 'export', label: '家谱导出' },
];

const stats = [
  { icon: Users, label: '收录成员', value: '326', trend: '18' },
  { icon: GitFork, label: '家族分支', value: '12', trend: '2' },
  { icon: Landmark, label: '已补全世代', value: '8', trend: '1' },
  { icon: FileText, label: '文献资料', value: '86', trend: '9' },
  { icon: Users, label: '协作修谱人数', value: '23', trend: '4' },
];

const treeGens = [
  { gen: '第1代', members: [{ name: '张文远', years: '1860-1920' }] },
  { gen: '第2代', members: [{ name: '张鸿渐', years: '1888-1955' }, { name: '李氏', years: '1892-1971' }] },
  { gen: '第3代', members: [{ name: '张景行', years: '1915-1983' }, { name: '王淑兰', years: '1918-1998' }, { name: '张景明', years: '1920-1988' }, { name: '刘淑贞', years: '1923-2010' }] },
  { gen: '第4代', members: [{ name: '张一帆', years: '1942-' }, { name: '陈惠英', years: '1945-' }, { name: '张一鸣', years: '1946-' }, { name: '周淑娟', years: '1948-' }, { name: '张一舟', years: '1949-' }] },
  { gen: '第5代', members: [{ name: '张伟', years: '1968-' }, { name: '李娜', years: '1970-' }, { name: '张磊', years: '1972-' }, { name: '刘洋', years: '1974-' }, { name: '张敏', years: '1976-' }, { name: '赵强', years: '1978-' }] },
  { gen: '第6代', members: [{ name: '张子涵', years: '1995-' }, { name: '张子睿', years: '1998-' }, { name: '张子墨', years: '2000-' }, { name: '王启明', years: '2001-' }, { name: '张心怡', years: '2003-' }] },
];

const tableData = [
  ['第1代', '张文远', '1860-1920', '-', '3'],
  ['第2代', '张鸿渐', '1888-1955', '李氏', '3'],
  ['第3代', '张景行', '1915-1983', '王淑兰', '2'],
  ['第4代', '张一帆', '1942-', '陈惠英', '3'],
  ['第5代', '张伟', '1968-', '李娜', '2'],
];

const documents = [
  { title: '张氏族谱（民国版）', year: '民国三年（1914）', editor: '张鸿渐' },
  { title: '清河张氏宗谱（清）', year: '清光绪二十年（1894）', editor: '张景行' },
  { title: '张氏家规（抄本）', year: '清道光十五年（1835）', editor: '张文远' },
];

const pendingMembers = [
  { name: '张景行', desc: '孙子 约生于1944年 缺少配偶及子女信息' },
  { name: '张一舟', desc: '女儿 约生于1975年 缺少出生及配偶信息' },
  { name: '张心怡', desc: '配偶 约生于2002年 缺少姓名及家庭信息' },
  { name: '王淑兰', desc: '父亲 约1890-? 缺少姓名及生卒信息' },
];

export default function Genealogy() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('tree');
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedOrigin, setExpandedOrigin] = useState(false);
  const [extraMembers, setExtraMembers] = useState<{ name: string; years: string }[]>([]);
  const [exporting, setExporting] = useState<Record<string, boolean>>({});

  const zoomIn = () => setScale((s) => Math.min(2, Number((s + 0.1).toFixed(1))));
  const zoomOut = () => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(1))));
  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  const addMember = () => {
    const name = window.prompt('请输入新成员姓名');
    if (!name) return;
    setExtraMembers((prev) => [...prev, { name, years: '待完善' }]);
    addToast(`已添加成员：${name}`, 'success');
  };

  const completeMember = (name: string) => {
    addToast(`开始补全 ${name} 的信息`, 'info');
  };

  const exportFile = (type: string) => {
    setExporting((prev) => ({ ...prev, [type]: true }));
    addToast(`${type} 处理中…`, 'info');
    setTimeout(() => {
      setExporting((prev) => ({ ...prev, [type]: false }));
      addToast(`${type} 已完成`, 'success');
    }, 1200);
  };

  return (
    <div className="genealogy-page">
      <header className="page-header"><h1 className="page-title">数字家谱</h1></header>

      <div className="tabs">
        {tabs.map((t) => <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      <div className="genealogy-stats-row">
        {stats.map((s, i) => (
          <div className="card genealogy-stat" key={i} onClick={() => {
            const paths = ['/family/members', '/family/relations', '/family', '/genealogy/documents', '/family/relations'];
            navigate(paths[i]);
          }}>
            <div className="card-body">
              <div className="genealogy-stat-icon"><s.icon size={20} color="#1B5E4B" /></div>
              <div className="genealogy-stat-label">{s.label}</div>
              <div className="genealogy-stat-value">{s.value}</div>
              <div className="genealogy-stat-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'tree' && (
        <div className="tree-layout">
          <div className="card search-card">
            <div className="card-header"><h3 className="card-title">家谱检索</h3></div>
            <div className="card-body">
              <div className="genealogy-search"><Search size={14} /><input type="text" placeholder="搜索姓名、字、号或称谓" /></div>
              <div className="surname-filter"><span>按姓氏筛选</span><select><option>张</option></select></div>
              <button className="advanced-search" onClick={() => setShowAdvanced((v) => !v)}>{showAdvanced ? '收起' : '高级检索'}</button>
              {showAdvanced && (
                <div className="advanced-search-panel">
                  <input type="text" placeholder="字、号、籍贯" />
                  <select><option>全部性别</option><option>男</option><option>女</option></select>
                  <button className="btn btn-primary btn-sm" onClick={() => addToast('开始高级检索', 'info')}>检索</button>
                </div>
              )}
              <div className="surname-origin">
                <div className="surname-title"><span className="surname-badge">张</span> 张氏</div>
                <div className="surname-meta"><span>郡望</span> 清河郡（河北清河）</div>
                <div className="surname-meta"><span>堂号</span> 清河堂、百忍堂、孝友堂</div>
                <div className="surname-meta"><span>祖籍</span> 河南濮阳（古帝丘）</div>
                <p className="surname-desc" onClick={() => setExpandedOrigin((v) => !v)}>
                  {expandedOrigin
                    ? '出自姬姓与张姓等，源于黄帝之孙挥公造弓，赐姓“张”，至今三千余年，人才辈出，望族相承。张姓为中国第三大姓，分布广泛，历史上涌现无数名人志士。'
                    : '出自姬姓与张姓等，源于黄帝之孙挥公造弓，赐姓“张”，至今三千余年，人才辈出，望族相承。'}
                  <span className="expand-hint">{expandedOrigin ? ' 收起' : ' 展开'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className={`card big-tree-card ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="card-header">
              <h3 className="card-title">家谱树 <span>（张氏家族）</span></h3>
              <div className="tree-tools">
                <button className="icon-btn" onClick={zoomOut}><ZoomOut size={14} /></button>
                <button className="icon-btn" onClick={zoomIn}><ZoomIn size={14} /></button>
                <button className="icon-btn" onClick={toggleFullscreen}><Maximize2 size={14} /> {isFullscreen ? '退出' : '全屏'}</button>
                <button className={`icon-btn ${showFilter ? 'active' : ''}`} onClick={() => setShowFilter((v) => !v)}><Filter size={14} /> 筛选</button>
              </div>
            </div>
            {showFilter && (
              <div className="tree-filter-bar">
                <span>显示：</span>
                <label><input type="checkbox" defaultChecked /> 男性</label>
                <label><input type="checkbox" defaultChecked /> 女性</label>
                <label><input type="checkbox" defaultChecked /> 已故</label>
              </div>
            )}
            <div className="card-body big-tree-body" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              {treeGens.map((g, i) => (
                <div className="big-tree-gen" key={i}>
                  <div className="big-gen-label">{g.gen}</div>
                  <div className="big-gen-members">
                    {g.members.map((m, j) => (
                      <div className="big-tree-member" key={j} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                        <Avatar name={m.name} size={44} />
                        <div className="big-tree-name">{m.name}</div>
                        <div className="big-tree-years">{m.years}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {extraMembers.length > 0 && (
                <div className="big-tree-gen extra-members">
                  <div className="big-gen-label">新录入</div>
                  <div className="big-gen-members">
                    {extraMembers.map((m, i) => (
                      <div className="big-tree-member" key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(m.name)}`)}>
                        <Avatar name={m.name} size={44} />
                        <div className="big-tree-name">{m.name}</div>
                        <div className="big-tree-years">{m.years}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="add-member" onClick={addMember}>+ 添加成员</div>
            </div>
          </div>

          <div className="card migration-card">
            <div className="card-header"><h3 className="card-title">迁徙图 <span>（张氏家族迁徙轨迹）</span></h3></div>
            <div className="card-body migration-body">
              <div className="map-placeholder">迁徙地图</div>
              <div className="migration-list">
                {[
                  { place: '山西洪洞', time: '明初（约1368年）' },
                  { place: '河南濮阳', time: '唐代（约618年）' },
                  { place: '江苏常州', time: '清中期（约1750年）' },
                  { place: '上海奉贤', time: '近代（约1900年）' },
                ].map((m, i) => (
                  <div key={i} onClick={() => addToast(`迁徙节点：${m.place} · ${m.time}`, 'info')}><span>{m.place}</span> {m.time}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="card pending-card">
            <div className="card-header"><h3 className="card-title">待补全成员</h3></div>
            <div className="card-body pending-body">
              {pendingMembers.map((p, i) => (
                <div className="pending-item" key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(p.name)}`)}>
                  <Avatar name={p.name} size={36} />
                  <div className="pending-main">
                    <div className="pending-name">{p.name}</div>
                    <div className="pending-desc">{p.desc}</div>
                  </div>
                  <button className="pending-btn" onClick={(e) => { e.stopPropagation(); completeMember(p.name); }}>补全信息</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'table' && (
        <div className="card table-card">
          <div className="card-header"><h3 className="card-title">世系表预览</h3><button className="btn btn-outline" onClick={() => navigate('/genealogy/table')}>查看完整世系表 <ChevronRight size={14} /></button></div>
          <div className="card-body table-body">
            <table className="genealogy-table">
              <thead><tr><th>世代</th><th>代表人物</th><th>生卒年</th><th>配偶</th><th>子女数</th></tr></thead>
              <tbody>{tableData.map((row, i) => <tr key={i} onClick={() => navigate(`/family/members/${encodeURIComponent(row[1])}`)}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="card export-genealogy-card">
          <div className="card-header"><h3 className="card-title">家谱输出</h3></div>
          <div className="card-body export-genealogy-body">
            <div className="export-option"><FileType size={24} color="#ef4444" /><div><div className="export-title">PDF导出</div><div className="export-desc">导出完整家谱树与世系表（含图片）</div></div><button className="btn btn-outline" onClick={() => exportFile('PDF')} disabled={exporting.PDF}>{exporting.PDF ? '导出中…' : '导出'}</button></div>
            <div className="export-option"><Printer size={24} color="#1B5E4B" /><div><div className="export-title">印刷排版</div><div className="export-desc">生成精美家谱排版文件，支持印刷</div></div><button className="btn btn-outline" onClick={() => exportFile('印刷排版')} disabled={exporting['印刷排版']}>{exporting['印刷排版'] ? '生成中…' : '排版'}</button></div>
            <div className="export-option"><Link size={24} color="#2D7A66" /><div><div className="export-title">分享链接</div><div className="export-desc">生成家谱分享链接，授权查看</div></div><button className="btn btn-outline" onClick={() => exportFile('分享链接')} disabled={exporting['分享链接']}>{exporting['分享链接'] ? '生成中…' : '生成链接'}</button></div>
          </div>
        </div>
      )}

      {['migration', 'culture', 'collab'].includes(activeTab) && (
        <div className="card docs-card">
          <div className="card-header"><h3 className="card-title">家谱文献库</h3><button className="btn btn-outline" onClick={() => navigate('/genealogy/documents')}>查看全部（86）</button></div>
          <div className="card-body docs-body">
            {documents.map((d, i) => (
              <div className="doc-item" key={i} onClick={() => navigate('/genealogy/documents')}>
                <div className="doc-thumb"><FileText size={24} /></div>
                <div className="doc-main">
                  <div className="doc-title">{d.title}</div>
                  <div className="doc-meta">{d.year} · 修谱人：{d.editor}</div>
                </div>
              </div>
            ))}
            <button className="upload-doc" onClick={() => { const file = window.prompt('请输入文献名称'); if (file) addToast(`已上传文献：${file}`, 'success'); }}><Plus size={18} /> 上传文献</button>
          </div>
        </div>
      )}
    </div>
  );
}
