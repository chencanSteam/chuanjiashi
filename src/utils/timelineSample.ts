// 人生时间轴样例数据与读取逻辑（Web 端人生档案与移动端档案页共用）
// 存储 key：cj_events_${archiveId}；默认档案（张明远）无存储时回退到内置样例数据

export interface StoredTimelineEventData {
  year: string;
  endYear?: string;
  title: string;
  desc: string;
  icon?: string;
  color?: string;
  bg?: string;
  tags?: { label: string; color: string; bg: string }[];
}

export const DEFAULT_ARCHIVE_ID = 'default';

export const defaultTimelineEvents: StoredTimelineEventData[] = [
  { year: '1958', title: '出生', desc: '1958年3月12日出生于江苏苏州，父亲是中学教师，母亲操持家务，家中书香气息浓厚。', icon: 'Baby', color: '#D97706', bg: '#FEF3C7', tags: [{ label: '苏州', color: '#6b7280', bg: '#f3f4f6' }, { label: '童年', color: '#D97706', bg: '#FEF3C7' }] },
  { year: '1965', endYear: '1970', title: '启蒙', desc: '进入苏州市立实验小学，开始接受正规教育，班主任王老师对其影响深远。', icon: 'GraduationCap', color: '#DB2777', bg: '#FCE7F3', tags: [{ label: '小学', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '1970', endYear: '1976', title: '小学', desc: '在苏州市立实验小学完成学业，养成良好学习习惯，成绩名列前茅。', icon: 'GraduationCap', color: '#DB2777', bg: '#FCE7F3', tags: [{ label: '小学', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '1976', endYear: '1980', title: '中学', desc: '考入苏州市中学，对机械产生浓厚兴趣，常拆卸家中闹钟和收音机。', icon: 'BookOpen', color: '#7C3AED', bg: '#EDE9FE', tags: [{ label: '中学', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '1980', title: '婚姻', desc: '与相恋多年的李晓如结婚，在简朴的婚礼中许下承诺，携手开启家庭生活。', icon: 'Heart', color: '#DC2626', bg: '#FEE2E2', tags: [{ label: '家庭', color: '#D97706', bg: '#FEF3C7' }, { label: '婚姻', color: '#DC2626', bg: '#FEE2E2' }] },
  { year: '1982', title: '长子出生', desc: '长子张子涵出生，家庭迎来新成员，责任与喜悦并存。', icon: 'Baby', color: '#D97706', bg: '#FEF3C7', tags: [{ label: '家庭', color: '#D97706', bg: '#FEF3C7' }] },
  { year: '1985', title: '女儿出生', desc: '女儿张雨桐出生，儿女双全，家庭更加圆满。', icon: 'Baby', color: '#D97706', bg: '#FEF3C7', tags: [{ label: '家庭', color: '#D97706', bg: '#FEF3C7' }] },
  { year: '1988', endYear: '1992', title: '工作', desc: '从苏州大学机械工程专业毕业后，进入国营机械厂担任技术员，踏实肯干。', icon: 'Briefcase', color: '#2563EB', bg: '#DBEAFE', tags: [{ label: '职业', color: '#2563EB', bg: '#DBEAFE' }] },
  { year: '1992', endYear: '1998', title: '创业', desc: '辞去稳定工作，创立明远机械有限公司，专注精密零部件加工与设备研发。', icon: 'Rocket', color: '#1B5E4B', bg: 'rgba(27,94,75,0.12)', tags: [{ label: '创业', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }, { label: '转型', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '1998', endYear: '2003', title: '企业转型', desc: '引进数控设备，推动工厂技术升级，产品开始出口海外。', icon: 'Rocket', color: '#1B5E4B', bg: 'rgba(27,94,75,0.12)', tags: [{ label: '创业', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }, { label: '创新', color: '#2563EB', bg: '#DBEAFE' }] },
  { year: '2003', title: '搬迁新居', desc: '从老城区搬入新家，生活条件改善，也为子女提供更好的成长环境。', icon: 'Home', color: '#059669', bg: '#D1FAE5', tags: [{ label: '家庭', color: '#D97706', bg: '#FEF3C7' }] },
  { year: '2008', endYear: '2015', title: '公益助学', desc: '在家乡设立明远助学基金，资助贫困学生完成学业，回馈社会。', icon: 'Award', color: '#DC2626', bg: '#FEE2E2', tags: [{ label: '公益', color: '#DC2626', bg: '#FEE2E2' }] },
  { year: '2015', endYear: '2018', title: '子女成家', desc: '长子张子涵成家立业，女儿张雨桐也步入婚姻殿堂，家庭开枝散叶。', icon: 'Users', color: '#7C3AED', bg: '#EDE9FE', tags: [{ label: '家庭', color: '#D97706', bg: '#FEF3C7' }] },
  { year: '2018', title: '金婚纪念', desc: '与配偶携手走过三十八载，举办金婚纪念，家人团聚共庆。', icon: 'Heart', color: '#DC2626', bg: '#FEE2E2', tags: [{ label: '婚姻', color: '#DC2626', bg: '#FEE2E2' }] },
  { year: '2020', title: '退休', desc: '正式退休，将公司交给年轻一代打理，开始整理人生档案与家风故事。', icon: 'Umbrella', color: '#059669', bg: '#D1FAE5', tags: [{ label: '退休', color: '#6b7280', bg: '#f3f4f6' }] },
  { year: '2022', endYear: '2024', title: '整理家风', desc: '开始系统整理家族故事与家训，希望将正直、担当、勤俭、善良传承给后人。', icon: 'BookOpen', color: '#7C3AED', bg: '#EDE9FE', tags: [{ label: '家风', color: '#1B5E4B', bg: 'rgba(27,94,75,0.08)' }] },
  { year: '2024', title: '当下', desc: '坚持每日读书、练字，通过「传家世」平台记录人生故事，传承家风。', icon: 'Sprout', color: '#059669', bg: '#D1FAE5', tags: [{ label: '当下', color: '#6b7280', bg: '#f3f4f6' }] },
];

// 读取指定档案的时间轴事件；默认档案无存储时返回内置样例数据
export function loadStoredEventsForArchive(archiveId: string): StoredTimelineEventData[] {
  try {
    const raw = localStorage.getItem(`cj_events_${archiveId}`);
    if (raw) return JSON.parse(raw) as StoredTimelineEventData[];
  } catch {
    // ignore
  }
  return archiveId === DEFAULT_ARCHIVE_ID ? defaultTimelineEvents : [];
}
