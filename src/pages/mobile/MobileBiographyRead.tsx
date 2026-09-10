import { ArrowLeft, BookOpen, ChevronRight, List, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadLegacyArchives } from '../../utils/mobileArchives'
import './MobileCommerce.css'
import './MobileBiographyRead.css'

interface ReadChapter {
  title: string;
  content: string;
}

const fallbackChapters = (name: string): ReadChapter[] => [
  { title: '故里童年 · 初心萌芽', content: `<p>${name}出生在一个普通而温暖的家庭。那些关于家人、故乡和童年生活的记忆，成为一生最初的底色。</p><p>家人常说，日子可以过得清简，但做人要踏实、待人要厚道。这些朴素的话，后来一直伴随着他走过人生。</p>` },
  { title: '求学成长 · 岁月积淀', content: '<p>求学时期，他遇到了几位影响深远的老师，也在一次次尝试和坚持中找到了自己的方向。</p><p>回头看，少年时期养成的好习惯，成为后来面对工作和生活挑战时最可靠的力量。</p>' },
  { title: '人生回望 · 家风传承', content: '<p>走过半生，他最想留给家人的不是财富，而是正直、担当、勤俭和善良。</p><p>一个人的故事会翻到最后一页，但家风会继续写下去。</p>' },
];

export default function MobileBiographyRead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const archive = useMemo(() => loadLegacyArchives().find((item) => item.id === id), [id]);
  const chapters = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`cj_biography_chapters_${id}`) || '[]') as Array<{ title?: string; content?: string }>;
      const readable = saved
        .filter((chapter) => chapter.title && chapter.content?.trim())
        .map((chapter) => ({ title: chapter.title as string, content: chapter.content as string }));
      return readable.length ? readable : fallbackChapters(archive?.name || '主人公');
    } catch {
      return fallbackChapters(archive?.name || '主人公');
    }
  }, [archive?.name, id]);

  const scrollToChapter = (index: number) => {
    document.getElementById(`mobile-read-chapter-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mobile-commerce mobile-biography-read">
      <div className="mobile-subpage-bar mobile-read-bar">
        <button type="button" onClick={() => navigate(`/m/works/${id}`)}><ArrowLeft size={18} /></button>
        <strong>阅读传记</strong>
        <button type="button" onClick={() => document.getElementById('mobile-read-toc')?.scrollIntoView({ behavior: 'smooth' })} aria-label="查看目录"><List size={18} /></button>
      </div>

      <section className="mobile-read-cover">
        <div className="mobile-read-book-mark"><BookOpen size={30} /></div>
        <div className="mobile-read-cover-title">《{archive?.name || '我的'}传》</div>
        <p>一生的故事，写给家人和未来</p>
        <div className="mobile-read-cover-meta"><span>已完成</span><span>共 {chapters.length} 章</span></div>
      </section>

      <section className="mobile-read-intro">
        <div className="mobile-read-intro-icon"><Sparkles size={16} /></div>
        <div><strong>这是一本关于人生的传记</strong><p>从故乡、求学到事业与家风，记录值得被记住的每一个片段。</p></div>
      </section>

      <section className="mobile-read-toc" id="mobile-read-toc">
        <div className="mobile-read-section-title"><span><List size={16} />目录</span><small>{chapters.length} 个章节</small></div>
        <div className="mobile-read-toc-list">
          {chapters.map((chapter, index) => (
            <button type="button" key={`${chapter.title}-${index}`} onClick={() => scrollToChapter(index)}>
              <span className="mobile-read-toc-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{chapter.title}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </section>

      <div className="mobile-read-progress"><span style={{ width: '100%' }} /></div>
      <div className="mobile-read-progress-label"><span>阅读进度</span><strong>已完成</strong></div>

      <section className="mobile-read-content">
        {chapters.map((chapter, index) => (
          <article className="mobile-biography-chapter" id={`mobile-read-chapter-${index}`} key={`${chapter.title}-${index}`}>
            <div className="mobile-read-chapter-kicker">CHAPTER {String(index + 1).padStart(2, '0')}</div>
            <h2>{chapter.title}</h2>
            <div className="mobile-read-chapter-text" dangerouslySetInnerHTML={{ __html: chapter.content }} />
          </article>
        ))}
      </section>
    </div>
  );
}
