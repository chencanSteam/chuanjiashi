import type { FamilyRelation } from '../mocks/types'

export const relationTypeOptions = [
  '配偶',
  '父子',
  '父女',
  '母子',
  '母女',
  '祖孙',
  '兄弟姐妹',
  '朋友',
  '同事',
  '同学',
  '师生',
  '邻居',
  '战友',
  '其他',
]

export interface RelationNode {
  role: string
  name: string
  side: 'left' | 'right'
  group: 'direct' | 'spouse' | 'child' | 'other'
  x: number
  y: number
}

function relationGroup(relation: string): RelationNode['group'] {
  const r = relation.trim()
  if (['父亲', '母亲', '祖父', '祖母', '爷爷', '奶奶', '外公', '外婆'].some((k) => r.includes(k))) return 'direct'
  if (['配偶', '妻子', '丈夫', '老婆', '老公'].some((k) => r.includes(k))) return 'spouse'
  if (['儿子', '女儿', '长子', '长女', '次子', '次女', '孩子', '子女'].some((k) => r.includes(k))) return 'child'
  return 'other'
}

export function getRelationCategory(relation: string): 'family' | 'social' {
  const r = relation.trim()
  const familyKeys = ['配偶', '父', '母', '祖父', '祖母', '爷爷', '奶奶', '外公', '外婆', '子', '女', '孙', '兄弟', '姐妹', '叔', '伯', '姑', '姨', '舅', '侄', '甥', '堂', '表']
  return familyKeys.some((k) => r.includes(k)) ? 'family' : 'social'
}

export function invertRelation(relation: string): string {
  const map: Record<string, string> = {
    '父子': '父亲',
    '父女': '父亲',
    '母子': '母亲',
    '母女': '母亲',
    '祖孙': '孙子',
    '祖父母': '孙子',
    '配偶': '配偶',
    '朋友': '朋友',
    '同事': '同事',
    '同学': '同学',
    '师生': '学生',
    '邻居': '邻居',
    '战友': '战友',
  }
  return map[relation.trim()] || relation
}

export function buildRelationNodes(centerName: string, relations: FamilyRelation[]): RelationNode[] {
  const relevant = relations.filter((r) => r.from === centerName || r.to === centerName)
  const grouped: Record<RelationNode['group'], FamilyRelation[]> = { direct: [], spouse: [], child: [], other: [] }

  relevant.forEach((r) => {
    const isFromCenter = r.from === centerName
    const relText = isFromCenter ? r.relation : invertRelation(r.relation)
    const group = relationGroup(relText)
    grouped[group].push({ ...r, relation: relText })
  })

  const nodes: RelationNode[] = []

  const place = (group: RelationNode['group'], items: FamilyRelation[], side: 'left' | 'right') => {
    const count = items.length
    items.forEach((r, i) => {
      const otherName = r.from === centerName ? r.to : r.from
      const y = count === 1 ? 50 : 18 + (i * (64 / (count - 1)))
      const x = side === 'left' ? 18 : 82
      nodes.push({ role: r.relation, name: otherName, side, group, x, y })
    })
  }

  place('direct', grouped.direct, 'left')
  place('spouse', grouped.spouse, 'right')
  place('child', grouped.child, 'right')
  place('other', grouped.other, 'right')

  return nodes
}
