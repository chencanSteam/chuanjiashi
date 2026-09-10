import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  BookOpen,
  FileText,
  Image,
  Sparkles,
  Wand2,
  Save,
  CheckCircle2,
  Circle,
  Upload,
  Music,
  Video,
  File,
  RefreshCw,
  Copy,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
  PenLine,
  Plus,
  Trash2,
  UserPlus,
  MessagesSquare,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useVersion } from '../hooks/useVersion';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/ui/Modal';

import { generateImageDataUrl, generateVideoPoster, generateAudioUrl } from '../utils/mediaPlaceholder';
import { biographyChapterTitles, chapterMockContents, loadJson, saveJson, type ChapterData } from '../data/aiMock';
import { loadConfirmedOutline } from '../utils/biographyOutline';
import { loadReviewStates } from '../utils/biographyWorkflow';
import { htmlToText, splitSentences, replaceSentence } from '../utils/sentences';
import {
  loadSuggestions,
  saveSuggestions,
  makeSuggestion,
  type EditSuggestion,
} from '../data/biographyCollaboration';
import {
  loadCollaborators,
  removeCollaborator,
  createCollabInvite,
  invitesForArchive,
  revokeCollabInvite,
  findAccountByPhoneOrIdCard,
  findCollaboratingArchives,
} from '../data/interviewCollaboration';
import { relationTypeOptions } from '../utils/familyRelations';
import { getWorkStatus } from '../utils/works';
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

function mockChapterHtml(title: string): string {
  const text = chapterMockContents[title]
    || `本章内容根据「${title}」的采访记录同步生成，可在此基础上继续润色完善。`;
  return text.split(/\n{2,}/).map((p) => `<p>${p.trim()}</p>`).join('');
}

function initChapters(archiveId: string): ChapterData[] {
  const outline = loadConfirmedOutline(archiveId);
  const titles = outline ? outline.chapters.map((c) => c.title) : biographyChapterTitles;
  // 各章内容在采访过程中已同步生成，进入本页时所有章节均带初稿内容
  const now = new Date().toLocaleString('zh-CN');
  return titles.map((title) => ({
    title,
    materials: 5,
    status: 'generated' as const,
    updatedAt: now,
    content: mockChapterHtml(title),
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

const styleOptions: { key: BiographyStyle; label: string }[] = [
  { key: 'plain', label: '朴实自然' },
  { key: 'warm', label: '温情叙事' },
  { key: 'classical', label: '典雅文言' },
  { key: 'news', label: '新闻纪实' },
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
  const { user } = useAuth();
  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  // 演示用：每次进入本页都把当前传记重置为最初状态（章节未生成、未校审、未合成、无历史版本），
  // 便于完整演示「生成章节 → 完成初稿 → 校审 → 终稿」的完整状态流转；仅首次渲染执行一次，重渲染不影响
  const demoResetRef = useRef(false);
  if (!demoResetRef.current) {
    demoResetRef.current = true;
    try {
      localStorage.removeItem(`cj_biography_chapters_${archiveId}`);
      localStorage.removeItem(`cj_biography_${archiveId}`);
      localStorage.removeItem(`cj_biography_review_${archiveId}`);
      localStorage.removeItem(`cj_biography_versions_${archiveId}`);
      localStorage.removeItem(`cj_biography_chapters_outline_v_${archiveId}`);
    } catch {
      // ignore
    }
  }
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



  // 已确认的传记大纲（草稿或未确认的大纲不影响生成）
  const confirmedOutline = useMemo(() => loadConfirmedOutline(archiveId), [archiveId]);

  // 选择传记：档案可以帮别人建，传记也可以帮别人生成；切换后重载页面载入对应档案数据
  // 末尾追加"我协助的传记"，选中后进入协助修改（只读 + 句级建议）模式
  const archiveOptions = useMemo(() => {
    const own = loadJson<Archive[]>('cj_archives', [])
      .filter((a) => getWorkStatus(a.id) !== '已完成')
      .map((a) => ({ id: a.id, label: `${a.name} 的传记` }));
    const collabs = findCollaboratingArchives(user?.name || '')
      .filter((c) => !own.some((o) => o.id === c.archiveId))
      .map((c) => ({ id: c.archiveId, label: `${c.archiveName} 的传记（协助）` }));
    return [...own, ...collabs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name]);

  // 协作身份：在档案协作者名单中即视为协助人（本人创建的档案不在名单中）
  const collabMode = useMemo(
    () => !!user?.name && loadCollaborators(archiveId).some((c) => c.name === user.name),
    [archiveId, user]
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
          materials: 5,
          status: 'generated' as const,
          updatedAt: new Date().toLocaleString('zh-CN'),
          content: mockChapterHtml(oc.title),
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
  const archiveMediaItems = useMemo(() => loadArchiveMediaItems(archiveId), [archiveId]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importingFile, setImportingFile] = useState(false);
  const [preview, setPreview] = useState<{ type: string; title: string } | null>(null);
  const [derivedTab, setDerivedTab] = useState<DerivedTab>('quotes');
  const [derivedResults, setDerivedResults] = useState<Partial<Record<DerivedTab, string[]>>>({});
  const [derivedGenerating, setDerivedGenerating] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  // ---- 协作修改（句级建议） ----
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>(() => loadSuggestions(archiveId));
  const [collaborators, setCollaborators] = useState(() => loadCollaborators(archiveId));
  const [invitesVersion, setInvitesVersion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestDraft, setSuggestDraft] = useState<{ sentenceIndex: number; original: string } | null>(null);
  const [suggestText, setSuggestText] = useState('');
  const [suggestNote, setSuggestNote] = useState('');
  const [showCollabInvite, setShowCollabInvite] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteFound, setInviteFound] = useState<{ phone: string; name?: string } | null>(null);
  const [inviteRelation, setInviteRelation] = useState('子女');

  useEffect(() => {
    saveSuggestions(archiveId, suggestions);
  }, [suggestions, archiveId]);

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  // 待对方同意的传记修改邀请：打开协助修改弹窗时按需读取，撤销后通过 invitesVersion 触发重读
  const pendingEditInvites = (() => {
    void invitesVersion;
    return invitesForArchive(archiveId).filter((i) => i.status === 'pending' && i.kind === 'collab' && i.scope === 'edit');
  })();
  const collabSuggestCount = (name: string) => suggestions.filter((s) => s.authorName === name).length;
  const collabAcceptedCount = (name: string) => suggestions.filter((s) => s.authorName === name && s.status === 'accepted').length;

  const handleRemoveCollaborator = (id: string) => {
    removeCollaborator(archiveId, id);
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    addToast('协作者已移除', 'info');
  };

  const handleRevokeInvite = (id: string) => {
    revokeCollabInvite(id);
    setInvitesVersion((v) => v + 1);
    addToast('邀请已撤销', 'info');
  };
  /** 协助人自己提交的建议 */
  const mySuggestions = suggestions.filter((s) => s.authorName === user?.name);
  // ---- 本人审阅模式：选择协助人后，正文按句标注其待处理建议 ----
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewPopover, setReviewPopover] = useState<{ sug: EditSuggestion; x: number; y: number } | null>(null);
  const reviewAuthors = useMemo(
    () => Array.from(new Set(pendingSuggestions.map((s) => s.authorName))),
    [pendingSuggestions]
  );
  const reviewSuggestions = reviewAuthor
    ? pendingSuggestions.filter((s) => s.authorName === reviewAuthor)
    : pendingSuggestions;
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('reviewAuthor');
    if (requested && reviewAuthors.includes(requested)) {
      setReviewAuthor(requested);
      setShowSuggestions(true);
    }
  }, [reviewAuthors]);

  const openSuggest = (sentenceIndex: number, original: string) => {
    setSuggestDraft({ sentenceIndex, original });
    setSuggestText(original);
    setSuggestNote('');
  };

  const submitSuggestion = () => {
    if (!suggestDraft || !user?.name) return;
    const suggested = suggestText.trim();
    if (!suggested) {
      addToast('请填写修改后的句子', 'error');
      return;
    }
    if (suggested === suggestDraft.original.trim()) {
      addToast('内容没有改动', 'info');
      return;
    }
    setSuggestions((prev) => [
      makeSuggestion({
        chapterIndex: activeIndex,
        chapterTitle: activeChapter.title,
        sentenceIndex: suggestDraft.sentenceIndex,
        original: suggestDraft.original,
        suggested,
        note: suggestNote.trim() || undefined,
        authorName: user.name || '协助人',
        collaboratorId: collabMode ? loadCollaborators(archiveId).find((c) => c.name === user.name)?.id : undefined,
        authorPhone: user.phone,
      }),
      ...prev,
    ]);
    setSuggestDraft(null);
    addToast('修改建议已提交，等待本人采纳', 'success');
  };

  const resolveSuggestion = (suggestion: EditSuggestion, accept: boolean) => {
    if (accept) {
      const chapter = chapters[suggestion.chapterIndex];
      const replaced = chapter
        ? replaceSentence(htmlToText(chapter.content), suggestion.sentenceIndex, suggestion.original, suggestion.suggested)
        : null;
      if (!replaced) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestion.id ? { ...s, status: 'outdated', resolvedAt: new Date().toISOString() } : s))
        );
        addToast('原文已被修改，该建议失效', 'info');
        return;
      }
      const nextChapters = chapters.map((c, i) =>
        i === suggestion.chapterIndex
          ? { ...c, content: replaced, status: 'edited' as const, updatedAt: new Date().toLocaleString('zh-CN') }
          : c
      );
      setChapters(nextChapters);
      // 已定稿的传记同步更新成品快照，保证打印预览/我的传记读到最新内容
      try {
        const raw = localStorage.getItem(`cj_biography_${archiveId}`);
        if (raw) {
          const snapshot = JSON.parse(raw) as { chapters?: unknown };
          snapshot.chapters = nextChapters.map((c) => ({ title: c.title, content: c.content }));
          localStorage.setItem(`cj_biography_${archiveId}`, JSON.stringify(snapshot));
        }
      } catch {
        // ignore
      }
      addToast('已采纳，正文已更新', 'success');
    }
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestion.id ? { ...s, status: accept ? 'accepted' : 'rejected', resolvedAt: new Date().toISOString() } : s
      )
    );
  };

  const handleFindInvitee = () => {
    const found = findAccountByPhoneOrIdCard(inviteQuery);
    if (!found) {
      addToast('没有找到该账号', 'error');
      return;
    }
    setInviteFound(found);
  };

  const handleSendCollabInvite = () => {
    if (!inviteFound) return;
    createCollabInvite({
      kind: 'collab',
      scope: 'edit',
      archiveId,
      archiveName: `${subjectName}的传记`,
      subjectName,
      inviterName: user?.name || '本人',
      targetPhone: inviteFound.phone,
      relation: inviteRelation,
    });
    addToast(`邀请已发送给 ${inviteFound.name || inviteFound.phone}，对方在首页接受后即可协助修改`, 'success');
    setShowCollabInvite(false);
    setInviteQuery('');
    setInviteFound(null);
  };

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
  const allChaptersCompleted = chapters.length > 0 && chapters.every(
    (chapter) => chapter.status !== 'notGenerated' && chapter.content.trim()
  );
  const statusBadge = (status: ChapterData['status']) => {
    if (status === 'generated') return <span className="chapter-status generated"><CheckCircle2 size={12} /> 已生成</span>;
    if (status === 'edited') return <span className="chapter-status edited"><Sparkles size={12} /> 已编辑</span>;
    return <span className="chapter-status not-generated"><Circle size={12} /> 未生成</span>;
  };

  const reviewStates = useMemo(() => loadReviewStates(archiveId), [archiveId]);
  const reviewStatusBadge = (chapter: ChapterData) => {
    const reviewStatus = reviewStates[chapter.title]?.status;
    if (reviewStatus === 'reviewed') return <span className="chapter-status generated"><CheckCircle2 size={12} /> 已校审</span>;
    if (reviewStatus === 'reviewing') return <span className="chapter-status edited"><PenLine size={12} /> 校审中</span>;
    return statusBadge(chapter.status);
  };

  const updateChapter = (index: number, patch: Partial<ChapterData>) => {
    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  // 章节目录编辑：改名、排序、增删，直接作用于章节目录
  const [treeEditing, setTreeEditing] = useState(false);

  const moveChapterItem = (index: number, delta: -1 | 1) => {
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
    setChapters((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => Math.max(0, prev > index ? prev - 1 : prev === index ? 0 : prev));
  };

  const addChapterItem = () => {
    setChapters((prev) => [
      ...prev,
      { title: '新章节', materials: 0, status: 'generated' as const, updatedAt: new Date().toLocaleString('zh-CN'), content: mockChapterHtml('新章节') },
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
    const shouldRestore = window.confirm('是否修复老照片？');
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const imgHtml = `<img src="${src}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:12px 0;display:block;" />`;
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, imgHtml);
      handleEditorInput();
      addToast(shouldRestore ? '老照片已修复并插入（演示）' : '图片已插入', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [biographyStyle, setBiographyStyle] = useState<BiographyStyle>(() =>
    loadJson<BiographyStyle>(`cj_biography_style_${archiveId}`, 'warm')
  );
  useEffect(() => {
    saveJson(`cj_biography_style_${archiveId}`, biographyStyle);
  }, [biographyStyle, archiveId]);


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
      addToast('传记已完成，不能继续编辑', 'info');
      navigate('/biography/print');
      return;
    }
    if (!allChaptersCompleted) {
      addToast(`请先完成全部章节（当前 ${generatedCount}/${chapters.length} 章）`, 'error');
      return;
    }
    localStorage.setItem(
      `cj_biography_${archiveId}`,
      JSON.stringify({
        title: `${subjectName}传记`,
        author: 'AI 整理',
        createdAt: new Date().toLocaleString('zh-CN'),
        status: 'draft',
        chapters: chapters.map((c) => ({ title: c.title, content: c.content })),
      })
    );
    setFinishOpen(false);
    addToast('初稿已生成，进入校审稿', 'success');
    navigate('/biography/review', { replace: true });
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
          {collabMode && <span className="biography-readonly-notice">协助修改模式 · 点击正文中的句子提出修改建议</span>}
          {collabMode && (
            <button className="btn btn-outline" onClick={() => setShowSuggestions(true)}>
              <MessagesSquare size={14} /> 我的建议{mySuggestions.length ? ` (${mySuggestions.length})` : ''}
            </button>
          )}
          {!collabMode && (
            <button className="btn btn-outline" onClick={() => setShowCollabInvite(true)}>
              <UserPlus size={14} /> 邀请协助
            </button>
          )}
          {!collabMode && pendingSuggestions.length > 0 && (
            <div className="review-select-wrap" title="选择协助人，正文将标注其建议修改的句子">
              <MessagesSquare size={14} />
              <select
                value={reviewAuthor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '__panel__') {
                    setShowSuggestions(true);
                    setReviewAuthor('');
                  } else {
                    setReviewAuthor(value);
                  }
                  setReviewPopover(null);
                }}
              >
                <option value="">协助修改（{pendingSuggestions.length}）</option>
                {reviewAuthors.map((name) => (
                  <option key={name} value={name}>
                    {name}（{pendingSuggestions.filter((s) => s.authorName === name).length}）
                  </option>
                ))}
                <option value="__panel__">查看全部建议记录</option>
              </select>
            </div>
          )}
          {!collabMode && pendingSuggestions.length === 0 && (
            <button className="btn btn-outline" onClick={() => setShowSuggestions(true)}>
              <MessagesSquare size={14} /> 协助修改
            </button>
          )}
          {!collabMode && <button className="btn btn-outline" onClick={() => setShowVersions(true)}>
            <RefreshCw size={14} /> 历史版本{versions.length ? ` (${versions.length})` : ''}
          </button>}
          {!collabMode && (
            <button className="btn btn-primary" onClick={() => setSaveVersionOpen(true)}>
              <Save size={14} /> 保存版本
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setPreviewOpen(true)}>
            <BookOpen size={14} /> 查看传记
          </button>
          {!collabMode && (
            <button className="btn btn-outline" onClick={() => navigate('/interview-review')}>
              <FileText size={14} /> 查看采访整理
            </button>
          )}
          <Annotate id="biography.save-works" inline>
          {!collabMode && !isFinalized && (
            <button
              className={`btn btn-primary ${allChaptersCompleted ? '' : 'is-disabled'}`}
              onClick={() => {
                if (!allChaptersCompleted) {
                  addToast(`请先完成全部章节（当前 ${generatedCount}/${chapters.length} 章）`, 'error');
                  return;
                }
                setFinishOpen(true);
              }}
              title={allChaptersCompleted ? '完成初稿' : `请先完成全部章节（${generatedCount}/${chapters.length}）`}
            >
              <BookOpen size={14} /> 完成初稿
            </button>
          )}
          </Annotate>
        </div>
      </header>
      <div className="biography-main">
        <Annotate id="biography.chapter-tree">
        <div className="card chapter-tree">
          <div className="card-header chapter-tree-header">
            <h3 className="card-title">章节目录</h3>
            {!isFinalized && !collabMode && !reviewAuthor && <button
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
                    {reviewStatusBadge(chapter)}
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
            <div className="progress-text">已完成 {generatedCount} / {chapters.length} 章</div>
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
            {collabMode ? (
              activeChapter.content ? (
                <div className="collab-reader">
                  {splitSentences(htmlToText(activeChapter.content)).map((sentence, i) => {
                    const hasPending = pendingSuggestions.some(
                      (s) => s.chapterIndex === activeIndex && s.sentenceIndex === i
                    );
                    return (
                      <span
                        key={i}
                        className={`collab-sentence ${hasPending ? 'has-suggestion' : ''}`}
                        title="点击提出修改建议"
                        onClick={() => openSuggest(i, sentence)}
                      >
                        {sentence}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="editor-empty">
                  <Sparkles size={40} color="#1B5E4B" />
                  <h3>本章还没有内容</h3>
                  <p>等本人生成或填写本章内容后，您就可以逐句提出修改建议。</p>
                </div>
              )
            ) : reviewAuthor && activeChapter.content ? (
              <div className="collab-reader review-reader">
                {splitSentences(htmlToText(activeChapter.content)).map((sentence, i) => {
                  const sug = reviewSuggestions.find(
                    (s) => s.chapterIndex === activeIndex && s.sentenceIndex === i
                  );
                  return (
                    <span
                      key={i}
                      className={sug ? 'review-mark' : 'review-plain'}
                      onClick={(e) => {
                        if (!sug) return;
                        setReviewPopover({
                          sug,
                          x: Math.min(e.clientX, window.innerWidth - 360),
                          y: e.clientY + 12,
                        });
                      }}
                    >
                      {sentence}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div
                ref={editorRef}
                className={`chapter-editor${isFinalized ? ' chapter-editor-readonly' : ''}`}
                contentEditable={!isFinalized}
                suppressContentEditableWarning
                onInput={isFinalized ? undefined : handleEditorInput}
                onBlur={isFinalized ? undefined : handleEditorInput}
                dangerouslySetInnerHTML={{ __html: activeChapter.content }}
                data-placeholder="在此编辑本章内容…"
              />
            )}
          </div>
          <div className="editor-toolbar">
            {isFinalized && <span className="generating-hint">传记已完成，仅支持查看、导出和排版</span>}
            {collabMode && <span className="generating-hint">协助修改模式：点击上方正文中的句子，即可对该句提出修改建议</span>}
            {!isFinalized && !collabMode && !reviewAuthor && <button className="btn btn-outline" onClick={handlePolish} disabled={generating || activeChapter.status === 'notGenerated'}>
              <Wand2 size={14} /> 润色本章
            </button>}
            {!isFinalized && !collabMode && !reviewAuthor && <button className="btn btn-outline" onClick={handleInsertImage}>
              <Image size={14} /> 插入图片
            </button>}
            {!isFinalized && !collabMode && !reviewAuthor && <>
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
            </div>
          </div>
          </Annotate>

          {!isV1 && (
            <div className="card quick-gen-card">
              <div className="card-header">
                <h3 className="card-title">快捷生成</h3>
              </div>
              <div className="card-body quick-gen-body">
                <button className="btn btn-outline" onClick={() => { setActiveIndex(0); }}>
                  生成第一章
                </button>
                <button className="btn btn-outline" onClick={() => { setActiveIndex(chapters.length - 1); }}>
                  生成末章
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

      <Modal open={finishOpen} title="确认完成初稿" onClose={() => setFinishOpen(false)} footer={
        <div className="version-modal-actions">
          <button className="btn btn-outline" onClick={() => setFinishOpen(false)}>再检查一下</button>
          <button className="btn btn-primary" onClick={saveToMyWorks}>完成初稿</button>
        </div>
      }>
        <div className="version-save-form">
          <p>确认后将把所有篇章整合串联，统一时间线、统一文风、统一叙事逻辑，生成完整连贯的人物传记初稿。</p>
          <p>初稿生成后，可邀请家人朋友共同补充完善。</p>
        </div>
      </Modal>

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

      {/* 协助人：对某一句提出修改建议 */}
      <Modal
        open={!!suggestDraft}
        title={`修改建议 · ${activeChapter.title}`}
        onClose={() => setSuggestDraft(null)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => setSuggestDraft(null)}>取消</button>
            <button className="btn btn-primary" onClick={submitSuggestion}>提交建议</button>
          </div>
        }
      >
        {suggestDraft && (
          <div className="suggest-form">
            <div className="suggest-original">
              <span className="suggest-label">原句</span>
              <p>{suggestDraft.original}</p>
            </div>
            <div className="suggest-field">
              <label>修改为</label>
              <textarea rows={3} value={suggestText} onChange={(e) => setSuggestText(e.target.value)} />
            </div>
            <div className="suggest-field">
              <label>修改说明（选填）</label>
              <input type="text" value={suggestNote} onChange={(e) => setSuggestNote(e.target.value)} placeholder="如：时间有误，应为 1984 年" />
            </div>
          </div>
        )}
      </Modal>

      {/* 修改建议面板：本人可采纳/拒绝，协助人可查看自己建议的状态 */}
      <Modal
        open={showSuggestions}
        title={collabMode ? '我提交的修改建议' : '协助修改'}
        onClose={() => setShowSuggestions(false)}
      >
        {collabMode ? (
          <div className="suggest-list">
            {mySuggestions.length === 0 ? (
              <div className="suggest-empty">您还没有提交过修改建议</div>
            ) : (
              mySuggestions.map((s) => (
                <div className={`suggest-item ${s.status}`} key={s.id}>
                  <div className="suggest-item-head">
                    <strong>{s.authorName}</strong>
                    <span className="suggest-item-chapter">{s.chapterTitle} · 第 {s.sentenceIndex + 1} 句</span>
                    <span className={`suggest-status suggest-status-${s.status}`}>
                      {s.status === 'pending' ? '待处理' : s.status === 'accepted' ? '已采纳' : s.status === 'rejected' ? '已拒绝' : '原文已变更'}
                    </span>
                  </div>
                  <div className="suggest-diff">
                    <p className="suggest-diff-old">{s.original}</p>
                    <p className="suggest-diff-new">{s.suggested}</p>
                  </div>
                  {s.note && <div className="suggest-note">说明：{s.note}</div>}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="suggest-list">
            {pendingSuggestions.length > 0 && (
              <div className="suggest-section">
                <div className="suggest-section-title">待处理修改建议（{pendingSuggestions.length}）</div>
                {pendingSuggestions.map((s) => (
                  <div className={`suggest-item ${s.status}`} key={s.id}>
                    <div className="suggest-item-head">
                      <strong>{s.authorName}</strong>
                      <span className="suggest-item-chapter">{s.chapterTitle} · 第 {s.sentenceIndex + 1} 句</span>
                    </div>
                    <div className="suggest-diff">
                      <p className="suggest-diff-old">{s.original}</p>
                      <p className="suggest-diff-new">{s.suggested}</p>
                    </div>
                    {s.note && <div className="suggest-note">说明：{s.note}</div>}
                    <div className="suggest-item-foot">
                      <span>{new Date(s.createdAt).toLocaleString('zh-CN')}</span>
                      <span className="suggest-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => resolveSuggestion(s, true)}>采纳</button>
                        <button className="btn btn-outline btn-sm" onClick={() => resolveSuggestion(s, false)}>拒绝</button>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {collaborators.length > 0 && (
              <div className="suggest-section">
                <div className="suggest-section-title">协作者</div>
                {collaborators.map((c) => (
                  <div className="collab-item" key={c.id}>
                    <div className="collab-info">
                      <strong>{c.name}</strong>
                      <span>{c.relation}</span>
                      <span className="collab-count">建议 {collabSuggestCount(c.name)} 条 · 已采纳 {collabAcceptedCount(c.name)} 条</span>
                    </div>
                    <div className="collab-actions">
                      <button className="btn btn-ghost btn-sm danger" onClick={() => handleRemoveCollaborator(c.id)}>移除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingEditInvites.length > 0 && (
              <div className="suggest-section">
                <div className="suggest-section-title">待对方同意</div>
                {pendingEditInvites.map((i) => (
                  <div className="collab-item" key={i.id}>
                    <div className="collab-info">
                      <strong>{i.targetPhone}</strong>
                      <span>{i.relation}</span>
                      <span className="collab-count">邀请协助修改传记 · 等待对方同意</span>
                    </div>
                    <div className="collab-actions">
                      <button className="btn btn-ghost btn-sm danger" onClick={() => handleRevokeInvite(i.id)}>撤销</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingSuggestions.length === 0 && collaborators.length === 0 && pendingEditInvites.length === 0 && (
              <div className="suggest-empty">暂无修改建议，可通过「邀请协助」让家人协助修改</div>
            )}
          </div>
        )}
      </Modal>

      {/* 邀请协助修改 */}
      <Modal
        open={showCollabInvite}
        title="邀请协助修改"
        onClose={() => setShowCollabInvite(false)}
        footer={
          <div className="import-modal-footer">
            <button className="btn btn-outline" onClick={() => setShowCollabInvite(false)}>取消</button>
          </div>
        }
      >
        <div className="suggest-form">
          <p className="import-modal-tip">输入对方注册的手机号或身份证号发出邀请，对方在首页接受后，即可对传记逐句提出修改建议。</p>
          <div className="suggest-field">
            <label>手机号 / 身份证号</label>
            <div className="invite-search-row">
              <input
                type="text"
                value={inviteQuery}
                onChange={(e) => { setInviteQuery(e.target.value); setInviteFound(null); }}
                placeholder="请输入对方注册的手机号或身份证号"
              />
              <button className="btn btn-outline" onClick={handleFindInvitee}>查找</button>
            </div>
          </div>
          {inviteFound && (
            <div className="invite-found-row">
              <strong>{inviteFound.name || '未设置姓名的用户'}</strong>
              <span>{inviteFound.phone}</span>
              <select value={inviteRelation} onChange={(e) => setInviteRelation(e.target.value)}>
                {relationTypeOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleSendCollabInvite}>发送邀请</button>
            </div>
          )}
        </div>
      </Modal>

      {/* 审阅模式：点击正文标注句子，弹出修改对比，本人决定是否替换 */}
      {reviewPopover && (
        <div className="review-popover-backdrop" onClick={() => setReviewPopover(null)}>
          <div
            className="review-popover"
            style={{ left: reviewPopover.x, top: reviewPopover.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="review-popover-head">
              <strong>{reviewPopover.sug.authorName}</strong>
              <span>{reviewPopover.sug.chapterTitle} · 第 {reviewPopover.sug.sentenceIndex + 1} 句</span>
            </div>
            <div className="suggest-diff">
              <p className="suggest-diff-old">{reviewPopover.sug.original}</p>
              <p className="suggest-diff-new">{reviewPopover.sug.suggested}</p>
            </div>
            {reviewPopover.sug.note && <div className="suggest-note">说明：{reviewPopover.sug.note}</div>}
            <div className="review-popover-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setReviewPopover(null)}>再看看</button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { const sug = reviewPopover.sug; setReviewPopover(null); resolveSuggestion(sug, false); }}
              >
                拒绝
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { const sug = reviewPopover.sug; setReviewPopover(null); resolveSuggestion(sug, true); }}
              >
                采纳替换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
