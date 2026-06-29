import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import { generateImageDataUrl, generateVideoPoster, generateAudioUrl } from '../utils/mediaPlaceholder';
import {
  biographyChapterTitles,
  loadQuota,
  consumeBiographyGenerate,
  loadJson,
  saveJson,
  type AIQuota,
  type ChapterData,
  type ReviewEvent,
} from '../data/aiMock';
import { assembleBiography, loadInterviewAnswers } from '../utils/biographyAssembler';
import './AIBiography.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
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

function initChapters(): ChapterData[] {
  return biographyChapterTitles.map((title) => ({
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

export default function AIBiography() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const subjectName = archive?.name || '张明远';

  const [quota, setQuota] = useState<AIQuota>(() => loadQuota());
  const [chapters, setChapters] = useState<ChapterData[]>(() =>
    loadJson<ChapterData[]>(`cj_biography_chapters_${archiveId}`, initChapters())
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<Record<string, boolean>>({});
  const archiveMediaItems = useMemo(() => loadArchiveMediaItems(archiveId), [archiveId]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importingFile, setImportingFile] = useState(false);
  const [preview, setPreview] = useState<{ type: string; title: string } | null>(null);

  const activeChapter = chapters[activeIndex];

  useEffect(() => {
    saveJson(`cj_biography_chapters_${archiveId}`, chapters);
  }, [chapters, archiveId]);

  const generatedCount = chapters.filter((c) => c.status !== 'notGenerated').length;

  const statusBadge = (status: ChapterData['status']) => {
    if (status === 'generated') return <span className="chapter-status generated"><CheckCircle2 size={12} /> 已生成</span>;
    if (status === 'edited') return <span className="chapter-status edited"><Sparkles size={12} /> 已编辑</span>;
    return <span className="chapter-status not-generated"><Circle size={12} /> 未生成</span>;
  };

  const updateChapter = (index: number, patch: Partial<ChapterData>) => {
    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const handleGenerate = async () => {
    if (activeChapter.status !== 'notGenerated') {
      // re-generate path: still consume quota
    }
    const nextQuota = consumeBiographyGenerate(quota);
    setQuota(nextQuota);
    setGenerating(true);

    setTimeout(() => {
      const reviewEvents = loadJson<ReviewEvent[]>(`cj_review_events_${archiveId}`, []);
      const highlights = loadJson<string[]>(`cj_review_highlights_${archiveId}`, []);
      const answers = loadInterviewAnswers(archiveId);
      const assembled = assembleBiography({
        archiveName: subjectName,
        events: reviewEvents,
        highlights,
        answers,
      });
      const content = assembled[activeChapter.title] || `${subjectName}的${activeChapter.title}内容待补充。`;
      updateChapter(activeIndex, {
        status: 'generated',
        content,
        updatedAt: new Date().toLocaleString('zh-CN'),
      });
      setGenerating(false);
      addToast(`「${activeChapter.title}」生成完成`, 'success');
    }, 1000);
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

  const saveToMyWorks = () => {
    const reviewEvents = loadJson<ReviewEvent[]>(`cj_review_events_${archiveId}`, []);
    const highlights = loadJson<string[]>(`cj_review_highlights_${archiveId}`, []);
    const answers = loadInterviewAnswers(archiveId);
    const assembled = assembleBiography({
      archiveName: subjectName,
      events: reviewEvents,
      highlights,
      answers,
    });
    localStorage.setItem(
      `cj_biography_${archiveId}`,
      JSON.stringify({
        title: `${subjectName}传记`,
        author: 'AI 整理',
        createdAt: new Date().toLocaleString('zh-CN'),
        chapters: assembled,
      })
    );
    addToast('传记已保存至「我的传记」', 'success');
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
      <header className="page-header">
        <div>
          <h1 className="page-title">AI传记生成</h1>
          <div className="breadcrumb">
            <span>首页</span> / <span className="active">AI传记生成</span>
          </div>
          <p className="page-subtitle">基于人生档案与采访素材，自动生成传记章节</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => setShowImportModal(true)}>
            <Upload size={14} /> 导入已有传记
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/archive')}>
            <FolderOpen size={14} /> 完善人生档案
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/interview-review')}>
            <FileText size={14} /> 查看采访整理
          </button>
          <button className="btn btn-primary" onClick={saveToMyWorks}>
            <BookOpen size={14} /> 保存到我的传记
          </button>
        </div>
      </header>

      <div className="biography-main">
        <div className="card chapter-tree">
          <div className="card-header">
            <h3 className="card-title">章节目录</h3>
          </div>
          <div className="card-body chapter-tree-body">
            {chapters.map((chapter, i) => (
              <div
                className={`chapter-item ${activeIndex === i ? 'active' : ''}`}
                key={chapter.title}
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
            ))}
          </div>
          <div className="chapter-progress">
            <div className="progress-text">完成度 {Math.round((generatedCount / chapters.length) * 100)}%</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${(generatedCount / chapters.length) * 100}%` }} /></div>
          </div>
        </div>

        <div className="card editor-card">
          <div className="card-header">
            <h3 className="card-title">{activeChapter.title}</h3>
            <div className="editor-meta">
              {activeChapter.updatedAt && <span>最后更新：{activeChapter.updatedAt}</span>}
              <span>字数：{activeChapter.content.replace(/\s/g, '').length}</span>
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
              <textarea
                className="chapter-editor"
                value={activeChapter.content}
                onChange={(e) =>
                  updateChapter(activeIndex, {
                    content: e.target.value,
                    status: activeChapter.status === 'notGenerated' ? 'edited' : activeChapter.status,
                  })
                }
                placeholder="在此编辑本章内容…"
              />
            )}
          </div>
          <div className="editor-toolbar">
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              <Sparkles size={14} /> {activeChapter.status === 'notGenerated' ? '生成本章' : '重新生成本章'}
            </button>
            <button className="btn btn-outline" onClick={handlePolish} disabled={generating || activeChapter.status === 'notGenerated'}>
              <Wand2 size={14} /> 润色本章
            </button>
            <button className="btn btn-outline" onClick={saveDraft} disabled={!activeChapter.content.trim()}>
              <Save size={14} /> 保存本章
            </button>
            {generating && <span className="generating-hint">AI 生成中…</span>}
          </div>
        </div>

        <div className="biography-side">
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
              <div className="setting-row">
                <label>叙事风格</label>
                <select className="setting-select">
                  <option>温馨叙事风</option>
                  <option>纪实简洁风</option>
                  <option>文学散文风</option>
                </select>
              </div>
              <div className="setting-row">
                <label>章节长度</label>
                <select className="setting-select">
                  <option>适中</option>
                  <option>精简</option>
                  <option>详细</option>
                </select>
              </div>
            </div>
          </div>

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
              <button className="export-btn" onClick={() => exportFile('实体书排版')} disabled={exporting['实体书排版']}>
                <BookOpen size={18} /> {exporting['实体书排版'] ? '生成中…' : '实体书排版'}
              </button>
            </div>
          </div>

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
        </div>
      </div>

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
            如果您已有写好的传记内容，可粘贴文本或上传 .txt 文件。系统会尝试根据章节标题自动拆分到对应章节；若未识别到章节标题，则将内容导入当前选中的「{activeChapter.title}」。
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
            <span className="import-modal-hint">推荐 .txt；Word/PDF 可能因格式原因无法正确读取</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
