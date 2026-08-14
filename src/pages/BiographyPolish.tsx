import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { quotaApi } from '../api/quota';
import { loadJson, saveJson } from '../data/aiMock';
import { readDocumentText, splitIntoChapters } from '../utils/documentImport';
import Annotate from '../components/annotation/Annotate';
import './BiographyPolish.css';

interface PolishChapter {
  title: string;
  original: string;
  content: string;
  status: 'original' | 'polished' | 'edited';
}

interface PolishDoc {
  docName: string;
  updatedAt: string;
  chapters: PolishChapter[];
}

interface Archive {
  id: string;
  name: string;
}

interface TextSelection {
  start: number;
  end: number;
  text: string;
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const archives: Archive[] = loadJson('cj_archives', []);
    return archives.find((a) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

const POLISH_STYLES = [
  { key: 'warm', label: '温情叙事' },
  { key: 'plain', label: '朴实自然' },
  { key: 'classic', label: '典雅文雅' },
  { key: 'news', label: '新闻纪实' },
];

/** 原型阶段的「AI 润色」：用词与句式层面的模拟改写 */
const POLISH_RULES: Array<[RegExp, string]> = [
  [/然后/g, '此后'],
  [/但是/g, '然而'],
  [/所以/g, '因此'],
  [/特别/g, '格外'],
  [/非常/g, '十分'],
  [/高兴/g, '欣慰'],
  [/难过/g, '伤感'],
  [/心里/g, '心底'],
];

function mockPolish(text: string): { result: string; changes: number } {
  let result = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  let changes = 0;
  POLISH_RULES.forEach(([pattern, replacement]) => {
    const count = (result.match(pattern) || []).length;
    if (count > 0) {
      changes += count;
      result = result.replace(pattern, replacement);
    }
  });
  return { result, changes };
}

function countWords(text: string): number {
  return text.replace(/\s/g, '').length;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function BiographyPolish() {
  const { addToast } = useToast();
  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const archiveName = archive?.name || '张明远';
  const storageKey = `cj_polish_doc_${archiveId}`;

  const [doc, setDoc] = useState<PolishDoc | null>(() => loadJson<PolishDoc | null>(storageKey, null));
  const [activeIndex, setActiveIndex] = useState(0);
  const [style, setStyle] = useState('warm');
  const [polishing, setPolishing] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [selection, setSelection] = useState<TextSelection>({ start: 0, end: 0, text: '' });

  const chapters = doc?.chapters ?? [];
  const activeChapter = chapters[activeIndex] ?? null;
  const isUnsplitText = chapters.length === 1 && chapters[0]?.title === '全文';

  const loadText = (text: string, docName: string) => {
    const parsed = splitIntoChapters(text);
    if (parsed.length === 0) {
      addToast('没有读到文字，请重新上传或粘贴传记内容', 'error');
      return;
    }
    const isSingleUnsplitChapter = parsed.length === 1 && ['全文', '开篇'].includes(parsed[0].title);
    setDoc({
      docName,
      updatedAt: new Date().toLocaleString('zh-CN'),
      chapters: parsed.map((chapter) => ({
        title: isSingleUnsplitChapter ? '全文' : chapter.title,
        original: chapter.content,
        content: chapter.content,
        status: 'original',
      })),
    });
    setActiveIndex(0);
    addToast(
      isSingleUnsplitChapter
        ? '文字已放入“全文”，暂时没有找到明显的章节标题，您可以手动新增章节'
        : `已整理出 ${parsed.length} 个章节，请先检查章节内容`,
      'success'
    );
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await readDocumentText(file);
      loadText(text, file.name.replace(/\.[^.]+$/, ''));
    } catch (err: unknown) {
      addToast(getErrorMessage(err, '这个文件暂时无法读取，请换成 Word 或 TXT 文件'), 'error');
    }
  };

  const updateChapter = (index: number, patch: Partial<PolishChapter>) => {
    setDoc((prev) =>
      prev
        ? {
            ...prev,
            updatedAt: new Date().toLocaleString('zh-CN'),
            chapters: prev.chapters.map((chapter, i) => (i === index ? { ...chapter, ...patch } : chapter)),
          }
        : prev
    );
  };

  const addChapter = () => {
    if (!doc) return;
    const newIndex = chapters.length;
    setDoc((prev) =>
      prev
        ? {
            ...prev,
            updatedAt: new Date().toLocaleString('zh-CN'),
            chapters: [
              ...prev.chapters,
              {
                title: `新章节 ${newIndex + 1}`,
                original: '',
                content: '',
                status: 'original',
              },
            ],
          }
        : prev
    );
    setActiveIndex(newIndex);
    setSelection({ start: 0, end: 0, text: '' });
    addToast('已新增一个空白章节，请填写章节名称和内容', 'success');
  };

  const deleteChapter = (index: number) => {
    if (chapters.length <= 1) {
      addToast('至少保留一个章节，不能删除最后一章', 'info');
      return;
    }
    const chapter = chapters[index];
    if (!chapter) return;
    const title = chapter.title || `第 ${index + 1} 章`;
    if (!window.confirm(`确定删除“${title}”吗？这一章的文字也会被删除。`)) return;

    const nextChapters = chapters.filter((_, chapterIndex) => chapterIndex !== index);
    setDoc((prev) =>
      prev
        ? {
            ...prev,
            updatedAt: new Date().toLocaleString('zh-CN'),
            chapters: prev.chapters.filter((_, chapterIndex) => chapterIndex !== index),
          }
        : prev
    );
    setActiveIndex((currentIndex) =>
      currentIndex > index ? currentIndex - 1 : Math.min(currentIndex, nextChapters.length - 1)
    );
    setSelection({ start: 0, end: 0, text: '' });
    addToast(`已删除“${title}”`, 'success');
  };

  const consumeQuota = async (): Promise<boolean> => {
    try {
      await quotaApi.consume('biographyGenerate');
      return true;
    } catch (err: unknown) {
      addToast(getErrorMessage(err, '暂时不能润色，请稍后再试'), 'error');
      return false;
    }
  };

  const polishOne = async (index: number) => {
    const chapter = chapters[index];
    if (!chapter || !chapter.content.trim()) {
      addToast('这一章还没有内容，请先补充文字', 'info');
      return;
    }
    if (!(await consumeQuota())) return;
    const styleLabel = POLISH_STYLES.find((item) => item.key === style)?.label || '温情叙事';
    setPolishing(true);
    setTimeout(() => {
      const { result, changes } = mockPolish(chapter.content);
      updateChapter(index, { content: result, status: 'polished' });
      setPolishing(false);
      addToast(
        changes > 0
          ? `“${chapter.title}”已完成${styleLabel}润色，优化了 ${changes} 处表达`
          : `“${chapter.title}”的文字已经比较顺了，暂时没有改动`,
        'success'
      );
    }, 900);
  };

  const polishSelection = async () => {
    const chapter = chapters[activeIndex];
    const selectedText = selection.text;
    if (!chapter || !selectedText.trim()) {
      addToast('请先在正文中拖动选中一段文字', 'info');
      return;
    }
    if (!(await consumeQuota())) return;
    const styleLabel = POLISH_STYLES.find((item) => item.key === style)?.label || '温情叙事';
    const { start, end } = selection;
    setPolishing(true);
    setTimeout(() => {
      const { result, changes } = mockPolish(selectedText);
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              updatedAt: new Date().toLocaleString('zh-CN'),
              chapters: prev.chapters.map((item, index) =>
                index === activeIndex
                  ? {
                      ...item,
                      content: item.content.slice(0, start) + result + item.content.slice(end),
                      status: 'polished',
                    }
                  : item
              ),
            }
          : prev
      );
      setSelection({ start: 0, end: 0, text: '' });
      setPolishing(false);
      addToast(
        changes > 0
          ? `选中的内容已完成${styleLabel}润色，优化了 ${changes} 处表达`
          : '选中的文字已经比较顺了，暂时没有改动',
        'success'
      );
    }, 900);
  };

  const polishAll = async () => {
    if (chapters.length === 0) return;
    if (!(await consumeQuota())) return;
    const styleLabel = POLISH_STYLES.find((item) => item.key === style)?.label || '温情叙事';
    setPolishing(true);
    setTimeout(() => {
      let total = 0;
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              updatedAt: new Date().toLocaleString('zh-CN'),
              chapters: prev.chapters.map((chapter) => {
                if (!chapter.content.trim()) return chapter;
                const { result, changes } = mockPolish(chapter.content);
                total += changes;
                return { ...chapter, content: result, status: 'polished' };
              }),
            }
          : prev
      );
      setPolishing(false);
      addToast(`全文已完成${styleLabel}润色，共优化 ${total} 处表达`, 'success');
    }, 1500);
  };

  const restoreOriginal = (index: number) => {
    const chapter = chapters[index];
    if (!chapter) return;
    updateChapter(index, { content: chapter.original, status: 'original' });
    addToast(`“${chapter.title}”已恢复到最初的文字`, 'info');
  };

  const saveDoc = () => {
    if (!doc) return;
    saveJson(storageKey, doc);
    addToast('当前进度已保存，下次打开还能继续', 'success');
  };

  const resetDoc = () => {
    if (!window.confirm('要换一份传记吗？当前还没有保存的修改会被清掉。')) return;
    setDoc(null);
    setPasteText('');
    setActiveIndex(0);
    localStorage.removeItem(storageKey);
  };

  const exportWord = () => {
    if (!doc) return;
    const body = chapters
      .map(
        (chapter) =>
          `<h2>${escapeHtml(chapter.title)}</h2>` +
          chapter.content
            .split(/\n+/)
            .filter((paragraph) => paragraph.trim())
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join('')
      )
      .join('');
    const html = `<html><head><meta charset="utf-8" /></head><body>${body}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.docName || `${archiveName}传记`}_润色稿.doc`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('润色稿已导出，可以在 Word 里继续修改', 'success');
  };

  const statusBadge = (status: PolishChapter['status']) => {
    if (status === 'polished') return <span className="polish-status polished"><Sparkles size={11} /> 已润色</span>;
    if (status === 'edited') return <span className="polish-status edited"><CheckCircle2 size={11} /> 手动修改</span>;
    return <span className="polish-status original"><Circle size={11} /> 待处理</span>;
  };

  return (
    <div className="polish-page">
      <header className="page-header polish-page-header">
        <div>
          <h1 className="page-title">传记润色</h1>
        </div>
        <div className="page-actions">
          {doc && (
            <>
              <Annotate id="biography-polish.reupload" inline>
                <button className="btn btn-outline" onClick={resetDoc}>
                  <Upload size={14} /> 换一份传记
                </button>
              </Annotate>
              <Annotate id="biography-polish.export-word" inline>
                <button className="btn btn-outline" onClick={exportWord}>
                  <Download size={14} /> 导出润色稿
                </button>
              </Annotate>
              <Annotate id="biography-polish.save" inline>
                <button className="btn btn-primary" onClick={saveDoc}>
                  <Save size={14} /> 保存进度
                </button>
              </Annotate>
            </>
          )}
        </div>
      </header>

      {!doc ? (
        <div className="polish-start-layout">
          <section className="polish-start-copy" aria-label="使用步骤">
            <span className="polish-eyebrow">从手写稿开始</span>
            <h2>先放入故事，<br />再慢慢把它写得更好。</h2>
            <p>不需要提前整理格式。上传或粘贴传记后，系统会尽量帮您找出章节；如果没有找到，也会先保留成一整篇。</p>
            <div className="polish-steps">
              <div className="polish-step">
                <span className="polish-step-no">01</span>
                <div><strong>放入传记</strong><span>上传文件，或直接粘贴文字</span></div>
              </div>
              <div className="polish-step">
                <span className="polish-step-no">02</span>
                <div><strong>检查章节</strong><span>系统能识别就自动分章，也可以手动新增</span></div>
              </div>
              <div className="polish-step">
                <span className="polish-step-no">03</span>
                <div><strong>选择内容润色</strong><span>一次处理一章，也可以处理全文</span></div>
              </div>
            </div>
          </section>

          <Annotate id="biography-polish.upload">
            <section className="card polish-upload-card">
              <div className="card-header polish-upload-header">
                <div>
                  <h3 className="card-title"><FileText size={17} /> 上传您的传记</h3>
                  <p>支持 Word 文档、TXT 文本，也可以直接粘贴。</p>
                </div>
                <span className="polish-upload-badge">第 1 步</span>
              </div>
              <div className="card-body polish-upload-body">
                <label
                  className="polish-dropzone"
                  htmlFor="polish-file-input"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFile(event.dataTransfer.files?.[0]);
                  }}
                >
                  <span className="polish-upload-icon"><Upload size={24} /></span>
                  <span className="polish-dropzone-title">把传记文件拖到这里，或点击选择</span>
                  <span className="polish-dropzone-tip">支持 .docx、.txt、.md 文件</span>
                  <input
                    id="polish-file-input"
                    type="file"
                    accept=".docx,.txt,.md"
                    className="polish-file-input"
                    onChange={(event) => {
                      handleFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>

                <div className="polish-or"><span>或者</span></div>

                <div className="polish-paste">
                  <label className="polish-paste-label" htmlFor="polish-paste-input">直接粘贴传记文字</label>
                  <textarea
                    id="polish-paste-input"
                    value={pasteText}
                    onChange={(event) => setPasteText(event.target.value)}
                    rows={7}
                    placeholder="把手写传记全文粘贴到这里……"
                  />
                  <button
                    className="btn btn-primary polish-start-button"
                    disabled={!pasteText.trim()}
                    onClick={() => loadText(pasteText, '粘贴的传记')}
                  >
                    <ArrowRight size={15} /> 开始整理传记
                  </button>
                </div>

              </div>
            </section>
          </Annotate>
        </div>
      ) : (
        <div className="polish-workspace">
          <div className="polish-main">
            <Annotate id="biography-polish.chapter-tree">
              <aside className="card polish-tree">
                <div className="card-header polish-tree-header">
                  <div>
                    <h3 className="card-title">章节</h3>
                    <span className="polish-tree-count">共 {chapters.length} 章</span>
                  </div>
                  <Annotate id="biography-polish.add-chapter" inline>
                    <button className="icon-btn polish-add-chapter" title="新增章节" aria-label="新增章节" onClick={addChapter}>
                      <Plus size={17} />
                    </button>
                  </Annotate>
                </div>
                <div className="card-body polish-tree-body">
                  {isUnsplitText && (
                    <div className="polish-manual-note">
                      <BookOpen size={15} />
                      <p>暂时没有找到章节。可以先点击右上角“+”新增章节，再把文字分别放进去。</p>
                    </div>
                  )}
                  <div className="polish-chapter-list">
                    {chapters.map((chapter, index) => (
                      <div className="polish-chapter-row" key={`${chapter.title}-${index}`}>
                        <button
                          type="button"
                          className={`polish-chapter-item ${activeIndex === index ? 'active' : ''}`}
                          onClick={() => {
                            setActiveIndex(index);
                            setSelection({ start: 0, end: 0, text: '' });
                          }}
                        >
                          <span className="polish-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                          <span className="polish-chapter-left">
                            <span className="polish-chapter-title">{chapter.title || '未命名章节'}</span>
                            {statusBadge(chapter.status)}
                          </span>
                        </button>
                        <Annotate id="biography-polish.delete-chapter" inline>
                          <button
                            type="button"
                            className="icon-btn polish-delete-chapter"
                            title={chapters.length <= 1 ? '至少保留一个章节' : '删除章节'}
                            aria-label={chapters.length <= 1 ? '至少保留一个章节' : `删除${chapter.title || '这一章'}`}
                            disabled={chapters.length <= 1}
                            onClick={() => deleteChapter(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </Annotate>
                      </div>
                    ))}
                  </div>
                  <button className="polish-add-link" onClick={addChapter}>
                    <Plus size={14} /> 新增一个章节
                  </button>
                </div>
              </aside>
            </Annotate>

            <Annotate id="biography-polish.editor">
              <section className="card polish-editor-card">
                {activeChapter && (
                  <>
                    <div className="card-header polish-editor-header">
                      <div className="polish-editor-title-wrap">
                        <span className="polish-editor-kicker">正在编辑第 {activeIndex + 1} 章</span>
                        <input
                          className="polish-title-input"
                          aria-label="章节名称"
                          value={activeChapter.title}
                          placeholder="给这一章起个名字"
                          onChange={(event) => updateChapter(activeIndex, { title: event.target.value, status: 'edited' })}
                          onBlur={() => {
                            if (!activeChapter.title.trim()) updateChapter(activeIndex, { title: `第 ${activeIndex + 1} 章` });
                          }}
                        />
                      </div>
                      <span className="polish-words">{countWords(activeChapter.content)} 字</span>
                    </div>
                    <textarea
                      className="polish-editor"
                      value={activeChapter.content}
                      onChange={(event) => updateChapter(activeIndex, { content: event.target.value, status: 'edited' })}
                      onSelect={(event) => {
                        const { selectionStart, selectionEnd, value } = event.currentTarget;
                        setSelection({
                          start: selectionStart,
                          end: selectionEnd,
                          text: value.slice(selectionStart, selectionEnd),
                        });
                      }}
                      placeholder="把这一章的文字写在这里……"
                    />
                    <div className="polish-toolbar">
                      <div className="polish-style-select">
                        <span>希望文字感觉</span>
                        <div className="polish-style-options">
                          {POLISH_STYLES.map((item) => (
                            <button
                              key={item.key}
                              className={`polish-style-chip ${style === item.key ? 'active' : ''}`}
                              onClick={() => setStyle(item.key)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="polish-toolbar-actions">
                        <button className="btn btn-primary" disabled={polishing} onClick={polishSelection}>
                          <Sparkles size={14} /> {polishing ? '正在润色……' : 'AI 润色选中内容'}
                        </button>
                        <button className="btn btn-outline" disabled={polishing} onClick={() => polishOne(activeIndex)}>
                          <Wand2 size={14} /> 润色这一章
                        </button>
                        <button className="btn btn-outline" disabled={polishing} onClick={polishAll}>
                          <Wand2 size={14} /> 润色全文
                        </button>
                        <button
                          className="btn btn-ghost"
                          disabled={polishing || activeChapter.status === 'original'}
                          onClick={() => restoreOriginal(activeIndex)}
                        >
                          <RotateCcw size={14} /> 恢复最初文字
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </Annotate>
          </div>
        </div>
      )}
    </div>
  );
}
