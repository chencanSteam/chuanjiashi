export interface ReviewInvite {
  id: string;
  name: string;
  relation: string;
  note: string;
  status: '待接受' | '已接受' | '已补充' | '已撤销';
  createdAt: string;
  demo?: boolean;
}

// 仅用于校审稿邀请弹窗的本地演示，不发送真实邀请。
export const reviewInviteExamples: ReviewInvite[] = [
  { id: 'review-demo-1', name: '周晓晨', relation: '子女', note: '帮忙核对工作经历中的年份和地名。', status: '待接受', createdAt: '2026-09-16T09:00:00', demo: true },
  { id: 'review-demo-2', name: '李淑芳', relation: '配偶', note: '补充婚后生活和孩子成长的细节。', status: '已接受', createdAt: '2026-09-15T14:30:00', demo: true },
  { id: 'review-demo-3', name: '陈志强', relation: '朋友', note: '已提供共同工作时的回忆，待传主核实。', status: '已补充', createdAt: '2026-09-14T10:00:00', demo: true },
];
