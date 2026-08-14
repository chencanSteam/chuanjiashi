import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getAnnotation } from '../../annotations';
import { useAnnotationMode } from './AnnotationProvider';

interface AnnotateProps {
  /** 标注点 id，对应 src/annotations 里的配置 */
  id: string;
  /** 包裹行内元素（按钮、下拉框等）时使用，避免撑破 flex 行布局 */
  inline?: boolean;
  children: ReactNode;
}

const POPOVER_WIDTH = 320;

/**
 * 逻辑标注打点组件：标注模式关闭时原样渲染（不产生额外 DOM），
 * 开启后在目标右上角显示编号圆点，点击弹出逻辑说明气泡。
 */
export default function Annotate({ id, inline, children }: AnnotateProps) {
  const { enabled } = useAnnotationMode();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const ann = getAnnotation(id);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onClose = () => setOpen(false);
    document.addEventListener('mousedown', onMouseDown);
    // 滚动/缩放后固定定位的气泡会错位，直接关闭
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [open]);

  // 标注模式关闭，或该点没有配置标注：原样渲染，不影响页面
  if (!enabled || !ann) return <>{children}</>;

  const handleBadgeClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = badgeRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.max(8, Math.min(rect.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - 8));
      setPos({ top: rect.bottom + 6, left });
    }
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className={`annotate-wrap${inline ? ' inline' : ''}${open ? ' open' : ''}`}>
      {children}
      <button
        ref={badgeRef}
        type="button"
        className="annotate-badge"
        title={`逻辑标注 ${ann.number}｜${ann.target}`}
        onClick={handleBadgeClick}
      >
        {ann.number}
      </button>
      {open && pos &&
        createPortal(
          <div
            ref={popoverRef}
            className="annotate-popover"
            style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="annotate-popover-head">
              <span className="annotate-popover-no">{ann.number}</span>
              <span className="annotate-popover-target">{ann.target}</span>
              <span className="annotate-popover-page">{ann.pageName}</span>
            </div>
            <div className="annotate-popover-logic">{ann.logic}</div>
          </div>,
          document.body
        )}
    </div>
  );
}
