import { StickyNote } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAnnotationMode } from './AnnotationProvider';
import { getPageByRoute } from '../../annotations';

/** 右下角浮动开关：切换逻辑标注模式，开启时显示当前页面的标注数量 */
export default function AnnotationToggle() {
  const { enabled, toggle } = useAnnotationMode();
  const { pathname } = useLocation();
  const page = getPageByRoute(pathname);

  return (
    <button
      type="button"
      className={`annotation-toggle${enabled ? ' on' : ''}`}
      onClick={toggle}
      title="开关页面逻辑标注（演示后台逻辑用）"
    >
      <StickyNote size={15} />
      <span>{enabled ? '逻辑标注：开' : '逻辑标注'}</span>
      {enabled && page && <span className="annotation-toggle-count">本页 {page.items.length} 条</span>}
    </button>
  );
}
