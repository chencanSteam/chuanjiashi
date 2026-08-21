import { loadCollaborators } from '../data/interviewCollaboration';

export interface ArchiveOption {
  id: string;
  label: string;
}

export interface ArchiveLike {
  id: string;
  name: string;
}

// 各端「传记/档案选择」下拉的统一选项：创建人与协助身份标注保持一致
// 创建人 →「xx 的传记 · 创建人」；协作者 →「xx 的传记 · 协助（我是{关系}）」
export function buildArchiveOptions(archives: ArchiveLike[], userName?: string): ArchiveOption[] {
  return archives.map((a) => {
    const collab = userName ? loadCollaborators(a.id).find((c) => c.name === userName) : undefined;
    return {
      id: a.id,
      label: collab
        ? `${a.name} 的传记 · 协助（我是${collab.relation || '协作人'}）`
        : `${a.name} 的传记 · 创建人`,
    };
  });
}
