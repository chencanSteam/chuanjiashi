/** 章节文本的句级工具：协作修改建议按"句"定位 */

/** contentEditable 存的是 innerHTML，转成纯文本（保留段落换行）再做句子处理 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 按句读标点（。！？；…!?）和换行切句，分隔符保留在句尾 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？；!?…])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 按"下标 + 原文"双重校验替换某一句；对不上（正文已被改动）返回 null
 * 返回值为纯文本（编辑器以 white-space: pre-wrap 渲染，换行不丢失）
 */
export function replaceSentence(text: string, index: number, original: string, next: string): string | null {
  const sentences = splitSentences(text)
  if (sentences[index] === undefined || sentences[index] !== original.trim()) return null
  sentences[index] = next.trim()
  return sentences.join('\n')
}
