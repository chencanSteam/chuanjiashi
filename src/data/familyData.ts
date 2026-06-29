export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  tag?: string;
  gen?: string;
  phone?: string;
  email?: string;
  location?: string;
  birth?: string;
  bio?: string;
}

export interface FamilyRelation {
  id: string;
  from: string;
  to: string;
  relation: string;
}

export interface Place {
  id: string;
  place: string;
  year: string;
  event: string;
  left?: number;
  top?: number;
  count?: number;
}

const defaultMembers: FamilyMember[] = [
  { id: 'm1', name: '张明远', role: '我', tag: '家主', gen: '第1代', phone: '138****1234', email: 'zhang@example.com', location: '江苏省苏州市', birth: '1975-08-15', bio: '张氏家庭现任家主，明远机械有限公司创始人，致力于家族档案数字化与家风传承。' },
  { id: 'm2', name: '李婉如', role: '配偶', gen: '第1代', phone: '139****5678', email: 'li@example.com', location: '江苏省苏州市', birth: '1978-03-22', bio: '家庭主妇，热心家族公益事业，擅长整理家族老照片与口述史资料。' },
  { id: 'm3', name: '张子涵', role: '长子', gen: '第2代', phone: '137****9012', email: 'zihan@example.com', location: '上海市', birth: '2003-05-12', bio: '在校大学生，机械工程专业，积极参与家族故事共创与数字纪念馆建设。' },
  { id: 'm4', name: '张若曦', role: '儿媳', gen: '第2代', phone: '136****3456', email: 'ruoxi@example.com', location: '上海市', birth: '2006-11-08', bio: '设计师，负责家风馆视觉设计与家族相册整理。' },
  { id: 'm5', name: '张浩然', role: '孙子', gen: '第3代', phone: '135****7890', email: 'haoran@example.com', location: '江苏省苏州市', birth: '2009-09-01', bio: '初中生，喜欢听爷爷讲家族故事，是家族未来的传承希望。' },
  { id: 'm6', name: '张志远', role: '祖父', tag: '已故', gen: '第1代', phone: '-', email: '-', location: '江苏省苏州市', birth: '1920-02-10', bio: '家族始祖，从教40年，一生勤勉正直，为家族奠定了重视教育的家风。' },
  { id: 'm7', name: '王淑兰', role: '祖母', tag: '已故', gen: '第1代', phone: '-', email: '-', location: '江苏省苏州市', birth: '1923-06-18', bio: '家族始祖配偶，擅长苏绣与烹饪，奶奶的拿手菜是家族共同的记忆。' },
  { id: 'm8', name: '张建国', role: '父亲', gen: '第2代' },
  { id: 'm9', name: '李秀英', role: '母亲', gen: '第2代' },
  { id: 'm10', name: '张建军', role: '叔叔', gen: '第2代' },
  { id: 'm11', name: '刘芳', role: '婶婶', gen: '第2代' },
  { id: 'm12', name: '张伟', role: '堂兄', gen: '第3代' },
  { id: 'm13', name: '陈静', role: '堂嫂', gen: '第3代' },
];

const defaultRelations: FamilyRelation[] = [
  { id: 'r1', from: '张明远', to: '李婉如', relation: '配偶' },
  { id: 'r2', from: '张明远', to: '张子涵', relation: '父子' },
  { id: 'r3', from: '张明远', to: '张浩然', relation: '祖孙' },
  { id: 'r4', from: '张建国', to: '张明远', relation: '父子' },
  { id: 'r5', from: '张志远', to: '张建国', relation: '父子' },
  { id: 'r6', from: '张建军', to: '刘芳', relation: '配偶' },
  { id: 'r7', from: '张子涵', to: '张若曦', relation: '配偶' },
];

const defaultPlaces: Place[] = [
  { id: 'p1', place: '江苏苏州', year: '1958', event: '出生、成长', left: 72, top: 58, count: 1 },
  { id: 'p2', place: '南京', year: '1984', event: '进修企业管理', left: 68, top: 56, count: 1 },
  { id: 'p3', place: '上海', year: '1992', event: '拓展业务', left: 76, top: 60, count: 1 },
  { id: 'p4', place: '广东深圳', year: '2008', event: '分公司成立', left: 66, top: 78, count: 1 },
];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function membersKey(archiveId: string) {
  return `cj_family_members_${archiveId}`;
}

export function relationsKey(archiveId: string) {
  return `cj_family_relations_${archiveId}`;
}

export function placesKey(archiveId: string) {
  return `cj_places_${archiveId}`;
}

export function loadFamilyMembers(archiveId: string): FamilyMember[] {
  return loadJson<FamilyMember[]>(membersKey(archiveId), archiveId === 'default' ? defaultMembers : []);
}

export function saveFamilyMembers(archiveId: string, members: FamilyMember[]) {
  saveJson(membersKey(archiveId), members);
}

export function loadFamilyRelations(archiveId: string): FamilyRelation[] {
  return loadJson<FamilyRelation[]>(relationsKey(archiveId), archiveId === 'default' ? defaultRelations : []);
}

export function saveFamilyRelations(archiveId: string, relations: FamilyRelation[]) {
  saveJson(relationsKey(archiveId), relations);
}

export function loadPlaces(archiveId: string): Place[] {
  return loadJson<Place[]>(placesKey(archiveId), archiveId === 'default' ? defaultPlaces : []);
}

export function savePlaces(archiveId: string, places: Place[]) {
  saveJson(placesKey(archiveId), places);
}

export function addOrUpdateMember(
  archiveId: string,
  member: Omit<FamilyMember, 'id'> & { id?: string }
): FamilyMember {
  const members = loadFamilyMembers(archiveId);
  const id = member.id || `m_${Date.now()}`;
  const next: FamilyMember = { ...member, id } as FamilyMember;
  const index = members.findIndex((m) => m.id === id || m.name === next.name);
  const updated = index >= 0
    ? members.map((m, i) => (i === index ? { ...m, ...next, id: m.id || id } : m))
    : [...members, next];
  saveFamilyMembers(archiveId, updated);
  return next;
}

export function removeMember(archiveId: string, id: string) {
  const members = loadFamilyMembers(archiveId);
  const target = members.find((m) => m.id === id);
  if (!target) return;
  const nextMembers = members.filter((m) => m.id !== id);
  saveFamilyMembers(archiveId, nextMembers);
  const relations = loadFamilyRelations(archiveId);
  const nextRelations = relations.filter((r) => r.from !== target.name && r.to !== target.name);
  saveFamilyRelations(archiveId, nextRelations);
}

export function addRelation(archiveId: string, relation: Omit<FamilyRelation, 'id'>): FamilyRelation {
  const relations = loadFamilyRelations(archiveId);
  const id = `r_${Date.now()}`;
  const next = { ...relation, id };
  saveFamilyRelations(archiveId, [...relations, next]);
  return next;
}

export function removeRelation(archiveId: string, id: string) {
  const relations = loadFamilyRelations(archiveId);
  saveFamilyRelations(archiveId, relations.filter((r) => r.id !== id));
}

export function addPlace(archiveId: string, place: Omit<Place, 'id'>): Place {
  const places = loadPlaces(archiveId);
  const id = `p_${Date.now()}`;
  const existing = places.find((p) => p.place === place.place);
  let next: Place;
  if (existing) {
    next = { ...existing, count: (existing.count || 1) + 1 };
    const updated = places.map((p) => (p.id === existing.id ? next : p));
    savePlaces(archiveId, updated);
  } else {
    next = { ...place, id, count: place.count || 1 };
    savePlaces(archiveId, [next, ...places]);
  }
  return next;
}

export function removePlace(archiveId: string, id: string) {
  const places = loadPlaces(archiveId);
  savePlaces(archiveId, places.filter((p) => p.id !== id));
}

export function syncPlaceFromText(archiveId: string, text: string, year?: string, event?: string) {
  if (!text.trim()) return;
  const place = text.trim();
  addPlace(archiveId, {
    place,
    year: year || '',
    event: event || '相关事件',
    left: 40 + Math.round(Math.random() * 40),
    top: 30 + Math.round(Math.random() * 45),
  });
}

export interface RelationNode {
  role: string;
  name: string;
  side: 'left' | 'right';
  group: 'direct' | 'spouse' | 'child' | 'other';
  x: number;
  y: number;
}

function relationGroup(relation: string): RelationNode['group'] {
  const r = relation.trim();
  if (['父亲', '母亲', '祖父', '祖母', '爷爷', '奶奶', '外公', '外婆'].some((k) => r.includes(k))) return 'direct';
  if (['配偶', '妻子', '丈夫', '老婆', '老公'].some((k) => r.includes(k))) return 'spouse';
  if (['儿子', '女儿', '长子', '长女', '次子', '次女', '孩子', '子女'].some((k) => r.includes(k))) return 'child';
  return 'other';
}

export function buildRelationNodes(centerName: string, relations: FamilyRelation[]): RelationNode[] {
  const relevant = relations.filter((r) => r.from === centerName || r.to === centerName);
  const grouped: Record<RelationNode['group'], FamilyRelation[]> = { direct: [], spouse: [], child: [], other: [] };

  relevant.forEach((r) => {
    const isFromCenter = r.from === centerName;
    const relText = isFromCenter ? r.relation : invertRelation(r.relation);
    const group = relationGroup(relText);
    grouped[group].push({ ...r, relation: relText });
  });

  const nodes: RelationNode[] = [];

  const place = (group: RelationNode['group'], items: FamilyRelation[], side: 'left' | 'right') => {
    const count = items.length;
    items.forEach((r, i) => {
      const otherName = r.from === centerName ? r.to : r.from;
      const y = count === 1 ? 50 : 18 + (i * (64 / (count - 1)));
      const x = side === 'left' ? 18 : 82;
      nodes.push({ role: r.relation, name: otherName, side, group, x, y });
    });
  };

  place('direct', grouped.direct, 'left');
  place('spouse', grouped.spouse, 'right');
  place('child', grouped.child, 'right');
  place('other', grouped.other, 'right');

  return nodes;
}

function invertRelation(relation: string): string {
  const map: Record<string, string> = {
    '父子': '父亲',
    '父女': '父亲',
    '母子': '母亲',
    '母女': '母亲',
    '祖孙': '孙子',
    '祖父母': '孙子',
    '配偶': '配偶',
  };
  return map[relation.trim()] || relation;
}

export function ensureMemberExists(archiveId: string, name: string, role = '家庭成员') {
  const members = loadFamilyMembers(archiveId);
  if (members.some((m) => m.name === name)) return;
  addOrUpdateMember(archiveId, { name, role, gen: '其他' });
}

export function syncRelationFromEvent(
  archiveId: string,
  subjectName: string,
  eventTitle: string,
  eventSummary: string
) {
  const text = `${eventTitle} ${eventSummary}`;
  const relationPatterns = [
    { pattern: /(?:与|和)([^，,。]{2,8}?)(?:女士|先生|女士|妻子|丈夫|配偶)?(?:结为夫妻|结婚|成婚|成亲)/, relation: '配偶' },
    { pattern: /(?:妻子|配偶|夫人|老婆|丈夫|老公)(?:是|为)([^，,。]{2,8})/, relation: '配偶' },
    { pattern: /(?:儿子|长子|次子)([^，,。]{2,8})(?:出生|出生|出生|出生|出生)/, relation: '父子' },
    { pattern: /(?:女儿|长女|次女)([^，,。]{2,8})(?:出生|出生|出生|出生|出生)/, relation: '父女' },
    { pattern: /父亲(?:是|为)([^，,。]{2,8})/, relation: '父亲' },
    { pattern: /母亲(?:是|为)([^，,。]{2,8})/, relation: '母亲' },
  ];

  const relations = loadFamilyRelations(archiveId);
  let added = false;

  relationPatterns.forEach(({ pattern, relation }) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (!name) return;
      ensureMemberExists(archiveId, name, relation.includes('父亲') || relation.includes('母亲') ? '长辈' : '家庭成员');
      const exists = relations.some(
        (r) =>
          (r.from === subjectName && r.to === name) ||
          (r.from === name && r.to === subjectName)
      );
      if (!exists) {
        addRelation(archiveId, { from: subjectName, to: name, relation });
        added = true;
      }
    }
  });

  return added;
}
