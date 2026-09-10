import { useMemo, useState } from 'react';
import { BookOpen, Calendar, Eye, Search, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './BiographyShelfManagement.css';

type ShelfBook = {
  id: string;
  title: string;
  author: string;
  price: number;
  publishedAt: string;
  status: 'active' | 'inactive';
  sales: number;
  favorites: number;
  category: string;
  summary: string;
};

const initialBooks: ShelfBook[] = [
  { id: 'shelf-001', title: '张明远：一位苏州企业家的六十年', author: '张立群', price: 0, publishedAt: '2026-08-22', status: 'active', sales: 236, favorites: 42, category: '企业家', summary: '从苏州老巷到创业舞台，记录一个普通中国家庭的奋斗与传承。' },
  { id: 'shelf-002', title: '山村教师王桂芬', author: '王建华', price: 9.9, publishedAt: '2026-08-18', status: 'active', sales: 45, favorites: 12, category: '教师', summary: '四十年讲台生涯，用知识点亮山村孩子的未来。' },
  { id: 'shelf-003', title: '铁血芳华：老兵陈建国', author: '陈志远', price: 12.9, publishedAt: '2026-08-11', status: 'active', sales: 128, favorites: 35, category: '军人', summary: '从战火纷飞到和平年代，一位老兵六十年不变的信仰与坚守。' },
  { id: 'shelf-004', title: '粉笔人生：特级教师赵文渊', author: '赵启明', price: 8.9, publishedAt: '2026-08-06', status: 'active', sales: 187, favorites: 46, category: '教师', summary: '三尺讲台四十载，桃李满天下的人民教师人生实录。' },
  { id: 'shelf-005', title: '商海沉浮：民营企业家吴国栋', author: '吴晓波', price: 19.9, publishedAt: '2026-07-29', status: 'active', sales: 312, favorites: 78, category: '企业家', summary: '从摆地摊到上市公司董事长，一部改革开放后的民营经济个人史。' },
  { id: 'shelf-006', title: '医者仁心：李华亭回忆录', author: '李文静', price: 19.9, publishedAt: '2026-07-20', status: 'inactive', sales: 76, favorites: 18, category: '医生', summary: '从赤脚医生到医院专家，五十载悬壶济世的动人故事。' },
  { id: 'shelf-007', title: '匠心五十年：木匠徐长顺', author: '徐晓东', price: 6.9, publishedAt: '2026-07-14', status: 'active', sales: 73, favorites: 18, category: '工匠', summary: '一把刨子、一根墨线，老木匠用双手丈量半个世纪的时光。' },
  { id: 'shelf-008', title: '我的母亲周秀英', author: '周国强', price: 0, publishedAt: '2026-07-02', status: 'inactive', sales: 21, favorites: 9, category: '家庭', summary: '一位普通农村母亲养育五个子女的艰辛与慈爱。' },
];

type PriceFilter = 'all' | 'free' | 'paid';
type SalesFilter = 'all' | 'under50' | '50to200' | 'over200';

function inPriceRange(price: number, filter: PriceFilter) {
  if (filter === 'free') return price === 0;
  if (filter === 'paid') return price > 0;
  return true;
}

function inSalesRange(sales: number, filter: SalesFilter) {
  if (filter === 'under50') return sales < 50;
  if (filter === '50to200') return sales >= 50 && sales <= 200;
  if (filter === 'over200') return sales > 200;
  return true;
}

export default function BiographyShelfManagement() {
  const { addToast } = useToast();
  const [books, setBooks] = useState(initialBooks);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | ShelfBook['status']>('all');
  const [price, setPrice] = useState<PriceFilter>('all');
  const [sales, setSales] = useState<SalesFilter>('all');
  const [selectedBook, setSelectedBook] = useState<ShelfBook | null>(null);
  const [previewBook, setPreviewBook] = useState<ShelfBook | null>(null);

  const visibleBooks = useMemo(() => books.filter((book) => {
    const query = keyword.trim().toLowerCase();
    const matchesKeyword = !query || book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query);
    return matchesKeyword && (status === 'all' || book.status === status) && inPriceRange(book.price, price) && inSalesRange(book.sales, sales);
  }), [books, keyword, status, price, sales]);

  const toggleShelf = (book: ShelfBook) => {
    const nextStatus = book.status === 'active' ? 'inactive' : 'active';
    setBooks((items) => items.map((item) => item.id === book.id ? { ...item, status: nextStatus } : item));
    addToast(nextStatus === 'active' ? `《${book.title}》已上架` : `《${book.title}》已下架`, 'success');
  };

  return (
    <div className="shelf-management-page">
      <header className="page-header shelf-management-header"><div><h1 className="page-title">传记书城管理</h1></div></header>

      <section className="card shelf-management-list-card">
        <div className="shelf-management-toolbar"><div className="shelf-management-search"><Search size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="根据书名、作者名查询" /></div><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | ShelfBook['status'])}><option value="all">全部状态</option><option value="active">上架中</option><option value="inactive">已下架</option></select><select value={price} onChange={(event) => setPrice(event.target.value as PriceFilter)}><option value="all">全部价格</option><option value="free">免费</option><option value="paid">付费</option></select><select value={sales} onChange={(event) => setSales(event.target.value as SalesFilter)}><option value="all">全部销量</option><option value="under50">50 本以下</option><option value="50to200">50–200 本</option><option value="over200">200 本以上</option></select></div>
        <div className="shelf-management-list-head"><div><h2>书城传记列表</h2><span>共 {visibleBooks.length} 本</span></div></div>
        <div className="admin-table-wrap"><table className="admin-table shelf-management-table"><thead><tr><th>书名</th><th>作者</th><th>价格</th><th>上架时间</th><th>当前状态</th><th>销量</th><th>收藏</th><th>操作</th></tr></thead><tbody>{visibleBooks.length === 0 ? <tr><td colSpan={8} className="admin-table-empty">暂无符合条件的传记</td></tr> : visibleBooks.map((book) => <tr key={book.id} className={book.status === 'inactive' ? 'shelf-row-inactive' : ''}><td className="admin-table-text-left"><div className="shelf-book-title"><span className="shelf-book-cover"><BookOpen size={15} /></span><div><strong>{book.title}</strong><small>{book.category}</small></div></div></td><td>{book.author}</td><td><strong>{book.price === 0 ? '免费' : `¥${book.price.toFixed(2)}`}</strong></td><td><span className="shelf-time"><Calendar size={13} /> {book.publishedAt}</span></td><td><span className={`shelf-status ${book.status}`}>{book.status === 'active' ? '上架中' : '已下架'}</span></td><td>{book.sales.toLocaleString()}</td><td>{book.favorites.toLocaleString()}</td><td><button className="admin-table-link" onClick={() => setSelectedBook(book)}><Eye size={13} /> 查看详情</button><button className={`admin-table-link ${book.status === 'active' ? 'danger' : ''}`} onClick={() => toggleShelf(book)}>{book.status === 'active' ? '下架' : '上架'}</button></td></tr>)}</tbody></table></div>
      </section>

      {selectedBook && <div className="modal-overlay" onClick={() => setSelectedBook(null)}><div className="modal-content shelf-detail-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h4>{selectedBook.title}</h4></div><button className="modal-close" onClick={() => setSelectedBook(null)}><X size={16} /></button></div><div className="shelf-detail-body"><div className="shelf-detail-cover"><BookOpen size={34} /><span>{selectedBook.category}</span></div><div className="shelf-detail-info"><div><span>作者</span><strong>{selectedBook.author}</strong></div><div><span>售价</span><strong>{selectedBook.price === 0 ? '免费' : `¥${selectedBook.price.toFixed(2)}`}</strong></div><div><span>上架时间</span><strong>{selectedBook.publishedAt}</strong></div><div><span>当前状态</span><strong>{selectedBook.status === 'active' ? '上架中' : '已下架'}</strong></div><div><span>销量</span><strong>{selectedBook.sales.toLocaleString()} 本</strong></div><div><span>收藏</span><strong>{selectedBook.favorites.toLocaleString()} 次</strong></div></div></div><div className="shelf-detail-footer"><button className="btn btn-outline" onClick={() => setSelectedBook(null)}>关闭</button><button className="btn btn-primary" onClick={() => setPreviewBook(selectedBook)}>预览书籍</button><button className={`btn ${selectedBook.status === 'active' ? 'btn-danger' : 'btn-primary'}`} onClick={() => { toggleShelf(selectedBook); setSelectedBook(null); }}>{selectedBook.status === 'active' ? '下架传记' : '重新上架'}</button></div></div></div>}

      {previewBook && <div className="modal-overlay" onClick={() => setPreviewBook(null)}><div className="modal-content shelf-preview-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h4>{previewBook.title}</h4><span className="shelf-preview-author">作者：{previewBook.author}</span></div><button className="modal-close" onClick={() => setPreviewBook(null)}><X size={16} /></button></div><div className="shelf-preview-body"><aside><strong>目录</strong><button className="shelf-preview-chapter active">第一章　故乡与童年</button><button className="shelf-preview-chapter">第二章　求学与成长</button><button className="shelf-preview-chapter">第三章　工作与创业</button><button className="shelf-preview-chapter">第四章　家庭与传承</button></aside><article><h3>第一章　故乡与童年</h3><p>每个人的故事，都从一片熟悉的土地开始。这里记录主人公的出生、家庭、童年记忆，以及那些影响一生的亲人和往事。</p><p>从老街、学校到第一次离开家乡，平凡的生活片段串起了人生最初的底色，也留下了家风传承的温度。</p><p>本章节内容为书城预览展示，完整内容需进入传记阅读页面查看。</p></article></div><div className="shelf-detail-footer"><button className="btn btn-outline" onClick={() => setPreviewBook(null)}>关闭预览</button></div></div></div>}
    </div>
  );
}
