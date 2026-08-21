import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  BookOpen,
  FileText,
  FolderOpen,
  Image,
  Sparkles,
  Wand2,
  Download,
  FileType,
  Save,
  CheckCircle2,
  Circle,
  Upload,
  Music,
  Video,
  File,
  DollarSign,
  RefreshCw,
  Copy,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useVersion } from '../hooks/useVersion';
import { useAuth } from '../hooks/useAuth';
import { biographyApi } from '../api/biography';
import Modal from '../components/ui/Modal';
import { orderApi } from '../api/order';
import { paymentApi } from '../api/payment';
import { quotaApi } from '../api/quota';

import { generateImageDataUrl, generateVideoPoster, generateAudioUrl } from '../utils/mediaPlaceholder';
import { generateInterviewTopics } from '../utils/interviewTopics';
import { biographyChapterTitles, loadJson, saveJson, type ChapterData } from '../data/aiMock';
import { composeOutlineChapterContent, loadConfirmedOutline } from '../utils/biographyOutline';
import { loadTimelineEvents } from '../utils/eventSync';
import Annotate from '../components/annotation/Annotate';
import './AIBiography.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
  /** 资料完整度（百分比），未设置时按采访已答问题数计算 */
  completion?: number;
}

interface BiographyVersion {
  id: string;
  versionNumber: number;
  label: string;
  createdAt: string;
  chapters: ChapterData[];
  style: BiographyStyle;
  wordCountLevel: WordCountLevel;
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    const archives: Archive[] = JSON.parse(raw);
    return archives.find((a) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

function initChapters(archiveId: string): ChapterData[] {
  const outline = loadConfirmedOutline(archiveId);
  const titles = outline ? outline.chapters.map((c) => c.title) : biographyChapterTitles;
  return titles.map((title) => ({
    title,
    materials: title === '前言' || title === '后记' ? 2 : 5,
    status: 'notGenerated',
    updatedAt: null,
    content: '',
  }));
}

interface ArchiveMediaItem {
  id: string;
  title: string;
  date: string;
  type: 'image' | 'video' | 'audio' | 'doc';
  stage?: string;
}

function loadArchiveMediaItems(archiveId: string): ArchiveMediaItem[] {
  try {
    const raw = localStorage.getItem(`cj_media_${archiveId}`);
    if (raw) return JSON.parse(raw) as ArchiveMediaItem[];
  } catch {
    // ignore
  }
  return [];
}

type DerivedTab = 'quotes' | 'motto' | 'letter' | 'timeline';

type BiographyStyle = 'plain' | 'warm' | 'classical' | 'news';
type WordCountLevel = 'short' | 'standard' | 'long';

const styleOptions: { key: BiographyStyle; label: string }[] = [
  { key: 'plain', label: '朴实自然' },
  { key: 'warm', label: '温情叙事' },
  { key: 'classical', label: '典雅文言' },
  { key: 'news', label: '新闻纪实' },
];

const wordCountOptions: { key: WordCountLevel; label: string }[] = [
  { key: 'short', label: '短篇 · 约5000字' },
  { key: 'standard', label: '标准 · 约15000字' },
  { key: 'long', label: '长篇 · 约30000字' },
];

const derivedTabLabels: Record<DerivedTab, string> = {
  quotes: '人生金句',
  motto: '家风总结',
  letter: '写给后人的话',
  timeline: '人生时间线',
};

function buildDerivedVariants(tab: DerivedTab, name: string, birthYear: string): string[][] {
  const year = birthYear || '1958';
  switch (tab) {
    case 'quotes':
      return [
        [
          '人这一辈子，吃的是苦，留下的是甜。',
          '手上有茧，心里才不慌。',
          '日子再难，也不能丢了诚信二字。',
          '家和万事兴，不是一句口号，是一辈子的事。',
        ],
        [
          '做人要实在，做事要踏实。',
          '吃亏是福，忍让是德。',
          '书可以不读多，但理不能不懂。',
          '对上要敬，对下要慈，对己要严。',
        ],
      ];
    case 'motto':
      return [
        [
          `${name}一生勤勉正直、节俭持家。他/她常教导子女：做人先立德，做事先尽心。家里不富裕时，宁可自己省吃俭用，也要供孩子读书；邻里有难，总是第一个伸手。这种「勤、俭、诚、善」的家风，是这个家庭最宝贵的财富。`,
        ],
        [
          `${name}用一生诠释了「忠厚传家久，诗书继世长」。无论顺境逆境，始终坚守诚信本分，孝顺长辈、疼爱晚辈、友善待人。他/她留下的不只是回忆，更是一种可以代代相传的处世之道。`,
        ],
      ];
    case 'letter':
      return [
        [
          `亲爱的孩子们：我是${name}。人这一生，说长不长，说短不短。我没什么大道理留给你们，只希望你们记住三件事：一是堂堂正正做人，走到哪里都抬得起头；二是踏踏实实做事，天上不会掉馅饼；三是常回家看看，家人团聚比什么都重要。家里的故事，我都写在这本传记里了，想我的时候，就翻一翻。`,
        ],
        [
          `孩子们，当你们读到这段话时，我已把一生的经历都留在了这本书里。我经历过苦日子，也赶上了好时代。请记住：不要怕吃苦，苦尽自有甘来；不要忘本，根在哪里，心就在哪里。愿你们兄弟姊妹和睦，把咱们的家风一代代传下去。——${name}`,
        ],
      ];
    case 'timeline':
      return [
        [
          `${year}年 · 出生，在一个普通家庭中长大`,
          `${Number(year) + 18}年 · 青年时期，参加工作/务农，挑起家庭重担`,
          `${Number(year) + 26}年 · 成家立业，迎来人生新阶段`,
          `${Number(year) + 40}年 · 中年打拼，为子女教育与家庭奔波`,
          `${Number(year) + 60}年 · 退休生活，含饴弄孙，安享天伦`,
        ],
        [
          `${year}年 · 出生于故乡`,
          `${Number(year) + 16}年 · 求学/学徒，习得立身之本`,
          `${Number(year) + 24}年 · 婚姻大事，组建自己的小家庭`,
          `${Number(year) + 35}年 · 事业转折点，抓住时代机遇`,
          `${Number(year) + 55}年 · 子女成才，家庭渐趋圆满`,
          `${Number(year) + 65}年 · 回望一生，著此传记以飨后人`,
        ],
      ];
  }
}

export default function AIBiography() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isV1 } = useVersion();
  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const subjectName = archive?.name || '张明远';
  const isFinalized = (() => {
    try {
      const raw = localStorage.getItem(`cj_biography_${archiveId}`);
      if (!raw) return false;
      const snapshot = JSON.parse(raw) as { status?: string; completedAt?: string; chapters?: Array<{ content?: string }> };
      return snapshot.status === 'final' || !!snapshot.completedAt;
    } catch {
      return false;
    }
  })();

  // 资料完整度：优先取档案 completion，否则按采访已答比例计算
  const completionPercent = useMemo(() => {
    const topics = generateInterviewTopics(archive, archiveId);
    const total = topics.reduce((sum, t) => sum + t.questions.length, 0);
    const session = loadJson<{ answeredIds?: string[] }>(`cj_interview_session_${archiveId}`, {});
    const progress = total > 0 ? Math.round(((session.answeredIds?.length ?? 0) / total) * 100) : 0;
    return Math.max(0, Math.min(100, Math.round(archive?.completion ?? progress)));
  }, [archive, archiveId]);

  const [showLowMaterial, setShowLowMaterial] = useState(false);

  // 已确认的传记大纲（草稿或未确认的大纲不影响生成）
  const confirmedOutline = useMemo(() => loadConfirmedOutline(archiveId), [archiveId]);

  // 选择传记：档案可以帮别人建，传记也可以帮别人生成；切换后重载页面载入对应档案数据
  const archiveOptions = useMemo(
    () => loadJson<Archive[]>('cj_archives', []).map((a) => ({ id: a.id, label: `${a.name} 的传记` })),
    []
  );
  const handleSwitchArchive = (id: string) => {
    if (id === archiveId) return;
    localStorage.setItem('cj_current_archive_id', id);
    window.location.reload();
  };

  const [chapters, setChapters] = useState<ChapterData[]>(() => {
    const saved = loadJson<ChapterData[]>(`cj_biography_chapters_${archiveId}`, initChapters(archiveId));
    const outline = loadConfirmedOutline(archiveId);
    if (!outline) return saved;
    // 目录已被人工编辑过且大纲未升版时，以人工目录为准
    const savedOutlineV = loadJson<number>(`cj_biography_chapters_outline_v_${archiveId}`, -1);
    if (savedOutlineV === outline.version) return saved;
    // 大纲升版：按新大纲重建章节结构，同名章节保留已生成的内容与状态
    return outline.chapters.map((oc) => {
      const existing = saved.find((c) => c.title === oc.title);
      return (
        existing || {
          title: oc.title,
          materials: oc.title === '前言' || oc.title === '后记' ? 2 : 5,
          status: 'notGenerated' as const,
          updatedAt: null,
          content: '',
        }
      );
    });
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [versions, setVersions] = useState<BiographyVersion[]>(() => loadJson<BiographyVersion[]>(`cj_biography_versions_${archiveId}`, []));
  const [showVersions, setShowVersions] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState<Record<string, boolean>>({});
  const archiveMediaItems = useMemo(() => loadArchiveMediaItems(archiveId), [archiveId]);
  const { user } = useAuth();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importingFile, setImportingFile] = useState(false);
  const [preview, setPreview] = useState<{ type: string; title: string } | null>(null);
  const [derivedTab, setDerivedTab] = useState<DerivedTab>('quotes');
  const [derivedResults, setDerivedResults] = useState<Partial<Record<DerivedTab, string[]>>>({});
  const [derivedGenerating, setDerivedGenerating] = useState(false);

  const handleDerivedGenerate = () => {
    setDerivedGenerating(true);
    setTimeout(() => {
      const variants = buildDerivedVariants(derivedTab, subjectName, archive?.birthYear || '');
      const current = derivedResults[derivedTab];
      let next = variants[Math.floor(Math.random() * variants.length)];
      if (variants.length > 1 && current && JSON.stringify(next) === JSON.stringify(current)) {
        next = variants[(variants.indexOf(next) + 1) % variants.length];
      }
      setDerivedResults((prev) => ({ ...prev, [derivedTab]: next }));
      setDerivedGenerating(false);
      addToast(`「${derivedTabLabels[derivedTab]}」已生成`, 'success');
    }, 800);
  };

  const handleDerivedCopy = async () => {
    const content = derivedResults[derivedTab];
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content.join('\n'));
      addToast('已复制到剪贴板', 'success');
    } catch {
      addToast('复制失败，请手动选择文本复制', 'error');
    }
  };

  const activeChapter = chapters[activeIndex];
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 切换章节或 AI 生成内容后，同步编辑器内容，但不破坏光标
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== activeChapter.content) {
      el.innerHTML = activeChapter.content;
    }
  }, [activeChapter.content, activeIndex]);

  useEffect(() => {
    saveJson(`cj_biography_chapters_${archiveId}`, chapters);
    saveJson(`cj_biography_chapters_outline_v_${archiveId}`, loadConfirmedOutline(archiveId)?.version ?? -1);
  }, [chapters, archiveId]);

  useEffect(() => {
    saveJson(`cj_biography_versions_${archiveId}`, versions);
  }, [versions, archiveId]);

  const generatedCount = chapters.filter((c) => c.status !== 'notGenerated').length;

  const statusBadge = (status: ChapterData['status']) => {
    if (status === 'generated') return <span className="chapter-status generated"><CheckCircle2 size={12} /> 已生成</span>;
    if (status === 'edited') return <span className="chapter-status edited"><Sparkles size={12} /> 已编辑</span>;
    return <span className="chapter-status not-generated"><Circle size={12} /> 未生成</span>;
  };

  const updateChapter = (index: number, patch: Partial<ChapterData>) => {
    if (isFinalized) {
      addToast('传记已完成，无法再次编辑', 'error');
      return;
    }
    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  // 章节目录编辑：改名、排序、增删，直接作用于章节目录
  const [treeEditing, setTreeEditing] = useState(false);

  const moveChapterItem = (index: number, delta: -1 | 1) => {
    if (isFinalized) return;
    const target = index + delta;
    if (target < 0 || target >= chapters.length) return;
    setChapters((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setActiveIndex((prev) => (prev === index ? target : prev === target ? index : prev));
  };

  const removeChapterItem = (index: number) => {
    if (isFinalized) return;
    setChapters((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => Math.max(0, prev > index ? prev - 1 : prev === index ? 0 : prev));
  };

  const addChapterItem = () => {
    if (isFinalized) return;
    setChapters((prev) => [
      ...prev,
      { title: '新章节', materials: 0, status: 'notGenerated' as const, updatedAt: null, content: '' },
    ]);
  };

  const handleEditorInput = () => {
    const html = editorRef.current?.innerHTML || '';
    updateChapter(activeIndex, {
      content: html,
      status: activeChapter.status === 'notGenerated' ? 'edited' : activeChapter.status,
    });
  };

  const handleInsertImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('请上传图片文件', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('图片大小不能超过 2MB', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const imgHtml = `<img src="${src}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:12px 0;display:block;" />`;
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, imgHtml);
      handleEditorInput();
      addToast('图片已插入', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [biographyStyle, setBiographyStyle] = useState<BiographyStyle>(() =>
    loadJson<BiographyStyle>(`cj_biography_style_${archiveId}`, 'warm')
  );
  const [wordCountLevel, setWordCountLevel] = useState<WordCountLevel>(() =>
    loadJson<WordCountLevel>(`cj_biography_word_count_${archiveId}`, 'standard')
  );

  useEffect(() => {
    saveJson(`cj_biography_style_${archiveId}`, biographyStyle);
  }, [biographyStyle, archiveId]);

  useEffect(() => {
    saveJson(`cj_biography_word_count_${archiveId}`, wordCountLevel);
  }, [wordCountLevel, archiveId]);

  const styleLabel = styleOptions.find((s) => s.key === biographyStyle)?.label || '温情叙事';
  const wordCountLabel = wordCountOptions.find((w) => w.key === wordCountLevel)?.label || '标准 · 约15000字';

  const runGenerate = async () => {
    try {
      await quotaApi.consume('biographyGenerate');
    } catch (err: any) {
      addToast(err.message || '额度不足', 'error');
      return;
    }
    setGenerating(true);
    addToast(`以「${styleLabel}」文风、${wordCountLabel}档位生成`, 'info');

    try {
      const isFirstGenerate = chapters.every((c) => c.status === 'notGenerated');
      if (confirmedOutline) {
        // 大纲模式：按已确认的章节结构与关联素材组装正文，不走 mock 接口
        const events = loadTimelineEvents(archiveId);
        const now = new Date().toLocaleString('zh-CN');
        const buildContent = (title: string) => {
          const oc = confirmedOutline.chapters.find((c) => c.title === title);
          return oc ? composeOutlineChapterContent(subjectName, oc, events) : '';
        };
        await new Promise((r) => setTimeout(r, 800));
        if (isFirstGenerate) {
          setChapters(
            chapters.map((c) => ({
              ...c,
              content: buildContent(c.title),
              status: 'generated' as const,
              updatedAt: now,
            }))
          );
          addToast(`已按大纲 v${confirmedOutline.version} 生成全部章节（${styleLabel} · ${wordCountLabel}）`, 'success');
        } else {
          updateChapter(activeIndex, {
            status: 'generated',
            content: buildContent(activeChapter.title),
            updatedAt: now,
          });
          addToast(`「${activeChapter.title}」已按大纲 v${confirmedOutline.version} 与${styleLabel}文风重新生成`, 'success');
        }
        return;
      }
      if (isFirstGenerate) {
        const biography = await biographyApi.generate(archiveId, biographyStyle, wordCountLevel);
        setChapters(
          biography.chapters.map((ch) => ({
            title: ch.title,
            content: ch.content,
            status: 'generated' as const,
            materials: ch.images.length || (ch.title === '前言' || ch.title === '后记' ? 2 : 5),
            updatedAt: new Date().toLocaleString('zh-CN'),
          }))
        );
        addToast(`传记全部章节已生成（${styleLabel} · ${wordCountLabel}）`, 'success');
      } else {
        const biography = await biographyApi.regenerateChapter(archiveId, activeChapter.title);
        const regenerated = biography.chapters.find((c) => c.title === activeChapter.title);
        if (regenerated) {
          updateChapter(activeIndex, {
            status: 'generated',
            content: regenerated.content,
            updatedAt: new Date().toLocaleString('zh-CN'),
          });
          addToast(`「${activeChapter.title}」已按${styleLabel}文风重新生成`, 'success');
        }
      }
    } catch (err: any) {
      addToast(err.message || '生成失败', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // 首次生成且材料不足时，先提示但不拦截
  const handleGenerate = () => {
    const isFirstGenerate = chapters.every((c) => c.status === 'notGenerated');
    if (isFirstGenerate && completionPercent < 40) {
      setShowLowMaterial(true);
      return;
    }
    runGenerate();
  };

  const handlePolish = () => {
    setGenerating(true);
    setTimeout(() => {
      const addition = `\n\n[AI 润色] 本章语言已进一步打磨，叙事更加流畅，情感表达也更为温暖。`;
      const content = activeChapter.content + addition;
      updateChapter(activeIndex, {
        status: 'edited',
        content,
        updatedAt: new Date().toLocaleString('zh-CN'),
      });
      setGenerating(false);
      addToast(`「${activeChapter.title}」润色完成`, 'success');
    }, 800);
  };

  const saveDraft = () => {
    updateChapter(activeIndex, {
      status: activeChapter.status === 'notGenerated' ? 'edited' : activeChapter.status,
      updatedAt: new Date().toLocaleString('zh-CN'),
    });
    addToast('本章内容已保存', 'success');
  };

  const saveVersion = () => {
    const now = new Date();
    const versionNumber = versions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;
    const version: BiographyVersion = {
      id: `bv_${Date.now()}_${versionNumber}`,
      versionNumber,
      label: versionLabel.trim(),
      createdAt: now.toISOString(),
      chapters: chapters.map((chapter) => ({ ...chapter })),
      style: biographyStyle,
      wordCountLevel,
    };
    setVersions((prev) => [...prev, version]);
    setActiveVersionId(version.id);
    setVersionLabel('');
    setSaveVersionOpen(false);
    addToast(`已保存为${version.label}`, 'success');
  };

  const restoreVersion = (version: BiographyVersion) => {
    if (!window.confirm(`切换到“${version.label}”会覆盖当前未保存的修改，是否继续？`)) return;
    setChapters(version.chapters.map((chapter) => ({ ...chapter })));
    setBiographyStyle(version.style);
    setWordCountLevel(version.wordCountLevel);
    setActiveIndex(0);
    setActiveVersionId(version.id);
    setShowVersions(false);
    addToast(`已切换到${version.label}，可继续修改`, 'success');
  };

  const deleteVersion = (version: BiographyVersion) => {
    if (!window.confirm(`确定删除“${version.label}”吗？历史版本删除后无法恢复。`)) return;
    setVersions((prev) => prev.filter((item) => item.id !== version.id));
    if (activeVersionId === version.id) setActiveVersionId(null);
    addToast('历史版本已删除', 'success');
  };

  const previewChapters = versions.find((version) => version.id === activeVersionId)?.chapters || chapters;

  const saveToMyWorks = async () => {
    if (isFinalized) {
      addToast('传记已完成，无法再次编辑', 'info');
      navigate('/my-works');
      return;
    }
    if (!chapters.some((chapter) => chapter.content.trim())) {
      addToast('请先生成或填写传记内容', 'error');
      return;
    }
    // mock 定稿接口仅覆盖「在线生成」路径；大纲/导入等本地路径没有对应记录，
    // 失败时不阻塞完成流程，以本地快照为准
    try {
      await biographyApi.finalize(archiveId);
    } catch {
      // ignore
    }
    localStorage.setItem(
      `cj_biography_${archiveId}`,
      JSON.stringify({
        title: `${subjectName}传记`,
        author: 'AI 整理',
        createdAt: new Date().toLocaleString('zh-CN'),
        completedAt: new Date().toISOString(),
        status: 'final',
        chapters: chapters.map((c) => ({ title: c.title, content: c.content })),
      })
    );
    addToast('传记已完成并保存', 'success');
    navigate('/my-works');
  };

  const exportFile = (type: string) => {
    setExporting((prev) => ({ ...prev, [type]: true }));
    addToast(`${type} 导出中…`, 'info');
    setTimeout(() => {
      setExporting((prev) => ({ ...prev, [type]: false }));
      addToast(`${type} 导出完成`, 'success');
    }, 1200);
  };

  const simulatePayment = async () => {
    if (!user?.phone) {
      addToast('请先登录', 'error');
      return;
    }
    try {
      const archiveId = localStorage.getItem('cj_current_archive_id') || undefined;
      const order = await orderApi.create({
        type: 'biography',
        productId: 'prod_biography_99',
        productName: 'AI 传记标准版',
        amount: 99,
        archiveId,
      });
      const { payment } = await paymentApi.pay(order.id, 'wechat');
      addToast(`模拟支付成功，订单号 ${payment.transactionId.slice(-8)}`, 'success');
    } catch (err: any) {
      addToast(err.message || '支付失败', 'error');
    }
  };

  const selectChapter = (i: number) => {
    setActiveIndex(i);
  };

  const parseImportedBiography = (text: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const titles = biographyChapterTitles;
    const titlePattern = new RegExp(`^(\\s*[第前后]?\\s*(?:${titles.join('|')})\\s*[：:、\\s])`, 'm');
    if (!titlePattern.test(text)) {
      result[activeChapter.title] = text.trim();
      return result;
    }
    const lines = text.split(/\r?\n/);
    let currentTitle = '';
    const buffers: Record<string, string[]> = {};
    for (const line of lines) {
      const matchedTitle = titles.find((t) => {
        const reg = new RegExp(`^\\s*(?:第[一二三四五六七八九十\\d]+[章节]\\s*[、:：\\s])?\\s*${t}\\s*[：:、\\s]?`);
        return reg.test(line);
      });
      if (matchedTitle) {
        currentTitle = matchedTitle;
        buffers[currentTitle] = buffers[currentTitle] || [];
        continue;
      }
      if (currentTitle) {
        buffers[currentTitle].push(line);
      }
    }
    titles.forEach((t) => {
      if (buffers[t]?.length) {
        result[t] = buffers[t].join('\n').trim();
      }
    });
    if (Object.keys(result).length === 0) {
      result[activeChapter.title] = text.trim();
    }
    return result;
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImportText((reader.result as string) || '');
      setImportingFile(false);
      addToast('文件读取成功，请确认导入', 'success');
    };
    reader.onerror = () => {
      setImportingFile(false);
      addToast('文件读取失败，请尝试复制文本后粘贴', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    const text = importText.trim();
    if (!text) {
      addToast('请先粘贴或上传传记内容', 'error');
      return;
    }
    const parsed = parseImportedBiography(text);
    const now = new Date().toLocaleString('zh-CN');
    setChapters((prev) =>
      prev.map((c) => {
        const content = parsed[c.title];
        if (!content) return c;
        return {
          ...c,
          content,
          status: 'edited',
          updatedAt: now,
        };
      })
    );
    setShowImportModal(false);
    setImportText('');
    addToast('已有传记导入成功', 'success');
  };



  return (
    <div className="biography-page">
      <header className="page-header biography-header">
        <h1 className="page-title">AI传记生成</h1>
        <div className="page-actions">
          <Annotate id="biography.archive-switch" inline>
          <div className="archive-switch-row biography-archive-switch">
            <span className="biography-switch-label">选择传记</span>
            <select value={archiveId} onChange={(e) => handleSwitchArchive(e.target.value)}>
              {archiveOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          </Annotate>
          {!isFinalized && <button className="btn btn-outline" onClick={() => setShowVersions(true)}>
            <RefreshCw size={14} /> 历史版本{versions.length ? ` (${versions.length})` : ''}
          </button>}
          {!isFinalized && (
            <button className="btn btn-primary" onClick={() => setSaveVersionOpen(true)}>
              <Save size={14} /> 保存版本
            </button>
          )}
          {isFinalized && <span className="biography-readonly-notice">已完成 · 只读</span>}
          <button className="btn btn-outline" onClick={() => setPreviewOpen(true)}>
            <BookOpen size={14} /> 查看传记
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/archive')}>
            <FolderOpen size={14} /> 完善人生档案
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/interview-review')}>
            <FileText size={14} /> 查看采访整理
          </button>
          <Annotate id="biography.save-works" inline>
          {!isFinalized && (
            <button className="btn btn-primary" onClick={saveToMyWorks}>
              <BookOpen size={14} /> 完成传记
            </button>
          )}
          </Annotate>
          <Annotate id="biography.simulate-pay" inline>
          <button className="btn btn-accent" onClick={simulatePayment}>
            <DollarSign size={14} /> 模拟支付 ¥99
          </button>
          </Annotate>
        </div>
      </header>

      <div className="biography-main">
        <Annotate id="biography.chapter-tree">
        <div className="card chapter-tree">
          <div className="card-header chapter-tree-header">
            <h3 className="card-title">章节目录</h3>
            {!isFinalized && <button
              className="chapter-edit-toggle"
              title={treeEditing ? '完成编辑' : '编辑目录'}
              onClick={() => setTreeEditing((v) => !v)}
            >
              {treeEditing ? <Check size={14} /> : <Pencil size={14} />}
              {treeEditing ? '完成' : '编辑'}
            </button>}
          </div>
          <div className="card-body chapter-tree-body">
            {chapters.map((chapter, i) =>
              treeEditing ? (
                <div className="chapter-item editing" key={`${chapter.title}-${i}`}>
                  <input
                    className="chapter-edit-input"
                    value={chapter.title}
                    onChange={(e) => updateChapter(i, { title: e.target.value })}
                  />
                  <div className="chapter-edit-actions">
                    <button className="chapter-icon-btn" title="上移" disabled={i === 0} onClick={() => moveChapterItem(i, -1)}>
                      <ChevronUp size={13} />
                    </button>
                    <button className="chapter-icon-btn" title="下移" disabled={i === chapters.length - 1} onClick={() => moveChapterItem(i, 1)}>
                      <ChevronDown size={13} />
                    </button>
                    <button className="chapter-icon-btn danger" title="删除" onClick={() => removeChapterItem(i)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`chapter-item ${activeIndex === i ? 'active' : ''}`}
                  key={`${chapter.title}-${i}`}
                  onClick={() => selectChapter(i)}
                >
                  <div className="chapter-item-left">
                    <BookOpen size={16} />
                    <span>{chapter.title}</span>
                  </div>
                  <div className="chapter-item-right">
                    {statusBadge(chapter.status)}
                    <ChevronRight size={14} className="chapter-arrow" />
                  </div>
                </div>
              )
            )}
            {treeEditing && (
              <button className="btn btn-outline chapter-add-btn" onClick={addChapterItem}>
                <Plus size={13} /> 添加章节
              </button>
            )}
          </div>
          <div className="chapter-progress">
            <div className="progress-text">完成度 {Math.round((generatedCount / chapters.length) * 100)}%</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${(generatedCount / chapters.length) * 100}%` }} /></div>
            {confirmedOutline && (
              <div className="progress-text">大纲 v{confirmedOutline.version} · 已确认</div>
            )}
          </div>
        </div>
        </Annotate>

        <Annotate id="biography.editor">
        <div className="card editor-card">
          <div className="card-header">
            <h3 className="card-title">{activeChapter.title}</h3>
            <div className="editor-meta">
              {activeChapter.updatedAt && <span>最后更新：{activeChapter.updatedAt}</span>}
              <span>字数：{activeChapter.content.replace(/<[^>]+>/g, '').replace(/\s/g, '').length}</span>
            </div>
          </div>
          <div className="editor-body">
            {activeChapter.status === 'notGenerated' && !activeChapter.content ? (
              <div className="editor-empty">
                <Sparkles size={40} color="#1B5E4B" />
                <h3>本章尚未生成</h3>
                <p>点击「生成本章」，AI 将基于人生档案、采访素材和本章上传的素材生成初稿。</p>
              </div>
            ) : (
              <div
                ref={editorRef}
                className={`chapter-editor ${isFinalized ? 'readonly' : ''}`}
                contentEditable={!isFinalized}
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onBlur={handleEditorInput}
                dangerouslySetInnerHTML={{ __html: activeChapter.content }}
                data-placeholder="在此编辑本章内容…"
              />
            )}
          </div>
          <div className="editor-toolbar">
            {!isFinalized && <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              <Sparkles size={14} /> {activeChapter.status === 'notGenerated' ? '生成本章' : '重新生成本章'}
            </button>}
            {!isFinalized && <button className="btn btn-outline" onClick={handlePolish} disabled={generating || activeChapter.status === 'notGenerated'}>
              <Wand2 size={14} /> 润色本章
            </button>}
            {!isFinalized && <button className="btn btn-outline" onClick={handleInsertImage}>
              <Image size={14} /> 插入图片
            </button>}
            {!isFinalized && <>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileChange}
              />
              <button className="btn btn-outline" onClick={saveDraft} disabled={!activeChapter.content.trim()}>
                <Save size={14} /> 保存本章
              </button>
            </>}
            {generating && <span className="generating-hint">AI 生成中…</span>}
          </div>
        </div>
        </Annotate>

        <div className="biography-side">
          <Annotate id="biography.materials-settings">
          <div className="card settings-card">
            <div className="card-header">
              <h3 className="card-title"><BookOpen size={14} /> 本章参考素材</h3>
              <span
                className="card-extra"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/archive')}
              >
                <Upload size={12} /> 去上传
              </span>
            </div>
            <div className="card-body settings-body">
              {archiveMediaItems.length === 0 ? (
                <div className="material-empty">
                  暂无人生档案素材，上传后可作为本章生成参考
                </div>
              ) : (
                <div className="material-groups">
                  {[
                    { type: 'image' as const, label: '照片', icon: Image },
                    { type: 'video' as const, label: '视频', icon: Video },
                    { type: 'audio' as const, label: '音频', icon: Music },
                    { type: 'doc' as const, label: '文档', icon: File },
                  ].map((g) => {
                    const items = archiveMediaItems.filter((m) => m.type === g.type);
                    if (items.length === 0) return null;
                    return (
                      <div className="material-group" key={g.type}>
                        <div className="material-group-header">
                          <span className="material-group-title">
                            <g.icon size={14} /> {g.label}
                          </span>
                          <span className="material-group-count">{items.length}</span>
                        </div>
                        <div className="material-group-list">
                          {items.map((m) => (
                            <div
                              className="material-item"
                              key={m.id}
                              title={m.title}
                              onClick={() => setPreview({ type: m.type, title: m.title })}
                            >
                              <span className="material-item-name">{m.title}</span>
                              <span className="material-item-stage">{m.stage || m.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="setting-row setting-row-chips">
                <label>文风选择</label>
                <div className="option-chips">
                  {styleOptions.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={`option-chip ${biographyStyle === s.key ? 'active' : ''}`}
                      onClick={() => setBiographyStyle(s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row setting-row-chips">
                <label>字数档位</label>
                <div className="option-chips">
                  {wordCountOptions.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      className={`option-chip ${wordCountLevel === w.key ? 'active' : ''}`}
                      onClick={() => setWordCountLevel(w.key)}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </Annotate>

          <div className="card export-card">
            <div className="card-header">
              <h3 className="card-title"><Download size={14} /> 导出</h3>
            </div>
            <div className="card-body export-body">
              <button className="export-btn" onClick={() => exportFile('Word')} disabled={exporting.Word}>
                <FileType size={18} /> {exporting.Word ? '导出中…' : '导出 Word'}
              </button>
              <button className="export-btn" onClick={() => exportFile('PDF')} disabled={exporting.PDF}>
                <Download size={18} /> {exporting.PDF ? '导出中…' : '导出 PDF'}
              </button>
              <button className="export-btn" onClick={() => navigate('/biography/print')}>
                <BookOpen size={18} /> 实体书排版
              </button>
            </div>
          </div>

          {!isV1 && (
            <div className="card quick-gen-card">
              <div className="card-header">
                <h3 className="card-title">快捷生成</h3>
              </div>
              <div className="card-body quick-gen-body">
                <button className="btn btn-outline" onClick={() => { setActiveIndex(0); }}>
                  生成前言
                </button>
                <button className="btn btn-outline" onClick={() => { setActiveIndex(chapters.length - 1); }}>
                  生成后记
                </button>
                <button className="btn btn-outline" onClick={() => { navigate('/digital-person'); }}>
                  <Sparkles size={14} /> 创建数字人
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isV1 && (
      <Annotate id="biography.derived">
      <div className="card derived-card">
        <div className="card-header">
          <h3 className="card-title"><Sparkles size={14} /> 衍生内容</h3>
          <span className="card-extra">基于已生成传记智能提炼</span>
        </div>
        <div className="card-body derived-body">
          <div className="derived-tabs">
            {(Object.keys(derivedTabLabels) as DerivedTab[]).map((t) => (
              <button
                key={t}
                className={`derived-tab ${derivedTab === t ? 'active' : ''}`}
                onClick={() => setDerivedTab(t)}
                type="button"
              >
                {derivedTabLabels[t]}
              </button>
            ))}
          </div>
          <div className="derived-result">
            {derivedGenerating ? (
              <div className="derived-empty">AI 正在提炼「{derivedTabLabels[derivedTab]}」…</div>
            ) : derivedResults[derivedTab] ? (
              derivedResults[derivedTab]!.map((text, i) => <p key={i}>{text}</p>)
            ) : (
              <div className="derived-empty">
                点击下方「生成」按钮，AI 将基于传记内容提炼{derivedTabLabels[derivedTab]}。
              </div>
            )}
          </div>
          <div className="derived-actions">
            <button className="btn btn-primary" onClick={handleDerivedGenerate} disabled={derivedGenerating}>
              <RefreshCw size={14} /> {derivedGenerating ? '生成中…' : derivedResults[derivedTab] ? '重新生成' : '生成'}
            </button>
            <button className="btn btn-outline" onClick={handleDerivedCopy} disabled={!derivedResults[derivedTab]}>
              <Copy size={14} /> 复制
            </button>
          </div>
        </div>
      </div>
      </Annotate>
      )}

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{preview.title}</h4>
              <button className="modal-close" onClick={() => setPreview(null)}>
                关闭
              </button>
            </div>
            <div className="modal-body preview-body">
              {preview.type === 'image' && (
                <img className="preview-image" src={generateImageDataUrl(preview.title)} alt={preview.title} />
              )}
              {preview.type === 'video' && <video className="preview-video" controls poster={generateVideoPoster(preview.title)} />}
              {preview.type === 'audio' && <audio className="preview-audio" controls src={generateAudioUrl()} />}
              {preview.type === 'doc' && (
                <div className="preview-doc">
                  <FileText size={48} />
                </div>
              )}
              <p>正在预览：{preview.title}</p>
            </div>
          </div>
        </div>
      )}

      <Modal open={saveVersionOpen} title="保存当前版本" onClose={() => setSaveVersionOpen(false)} footer={
        <div className="version-modal-actions">
          <button className="btn btn-outline" onClick={() => setSaveVersionOpen(false)}>取消</button>
          <button className="btn btn-primary" onClick={saveVersion}>保存版本</button>
        </div>
      }>
        <div className="version-save-form">
          <label htmlFor="biography-version-label">版本名称（可选）</label>
          <input id="biography-version-label" value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="如：完成初稿、补充童年章节（可不填）" autoFocus />
          <p>系统将自动按顺序命名为 V{versions.length + 1}，也可以补充本次版本描述。将保存当前全部 {chapters.length} 个章节。</p>
        </div>
      </Modal>

      <Modal open={showVersions} title="历史版本" onClose={() => setShowVersions(false)}>
        <div className="biography-version-list">
          {versions.length === 0 ? (
            <div className="biography-version-empty"><RefreshCw size={30} /><p>还没有保存过版本</p><span>点击“保存版本”创建第一个可回溯版本。</span></div>
          ) : versions.slice().reverse().map((version) => (
            <div className={`biography-version-item ${activeVersionId === version.id ? 'active' : ''}`} key={version.id}>
              <div className="biography-version-main">
                <div className="biography-version-title"><strong>V{version.versionNumber}</strong>{version.label && <span>{version.label}</span>}{activeVersionId === version.id && <em>当前版本</em>}</div>
                <small>{new Date(version.createdAt).toLocaleString('zh-CN')} · {version.chapters.length} 章</small>
              </div>
              <div className="biography-version-actions">
                <button className="btn btn-outline btn-sm" onClick={() => restoreVersion(version)}>继续编辑</button>
                <button className="icon-btn" title="删除版本" onClick={() => deleteVersion(version)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal className="biography-preview-modal" open={previewOpen} title={`《${subjectName}传记》预览`} onClose={() => setPreviewOpen(false)}>
        <div className="biography-preview">
          <div className="biography-preview-cover"><BookOpen size={36} /><h2>{subjectName}传记</h2><span>{activeVersionId ? versions.find((version) => version.id === activeVersionId)?.label : '当前编辑版本'}</span></div>
          <div className="biography-preview-content">
            {previewChapters.length === 0 ? <p className="biography-preview-empty">暂无章节内容</p> : previewChapters.map((chapter, index) => (
              <article key={`${chapter.title}-${index}`}>
                <h3>第 {index + 1} 章　{chapter.title}</h3>
                {chapter.content ? <div dangerouslySetInnerHTML={{ __html: chapter.content }} /> : <p className="biography-preview-empty">本章暂无内容</p>}
              </article>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={showLowMaterial}
        title="材料还比较少"
        onClose={() => setShowLowMaterial(false)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => { setShowLowMaterial(false); navigate('/interview'); }}>
              去补充采访
            </button>
            <button className="btn btn-primary" onClick={() => { setShowLowMaterial(false); runGenerate(); }}>
              仍然生成
            </button>
          </div>
        }
      >
        <div className="import-modal-body">
          <p className="import-modal-tip">
            当前资料完整度仅 {completionPercent}%，材料较少时生成的传记会比较单薄。建议先继续采访补充素材，也可以直接生成。
          </p>
        </div>
      </Modal>

      <Modal
        open={showImportModal}
        title="导入已有传记"
        onClose={() => setShowImportModal(false)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowImportModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={confirmImport} disabled={!importText.trim() || importingFile}>
              <Upload size={14} /> 确认导入
            </button>
          </div>
        }
      >
        <div className="import-modal-body">
          <p className="import-modal-tip">
            如果您已有写好的传记内容，可粘贴文本或上传文件。系统会尝试根据章节标题自动拆分到对应章节；若未识别到章节标题，则将内容导入当前选中的「{activeChapter.title}」。
          </p>
          <textarea
            className="import-modal-textarea"
            rows={10}
            placeholder="请粘贴传记全文…"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="import-modal-upload">
            <label className="btn btn-outline" htmlFor="biography-import-file">
              {importingFile ? '读取中…' : '上传文本文件'}
            </label>
            <input
              id="biography-import-file"
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
