import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import './annotation.css';

interface AnnotationModeValue {
  enabled: boolean;
  toggle: () => void;
}

const AnnotationModeContext = createContext<AnnotationModeValue>({
  enabled: false,
  toggle: () => {},
});

const STORAGE_KEY = 'cj_annotation_mode';

/** 全局"逻辑标注模式"开关，状态持久化到 localStorage */
export default function AnnotationProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      // ignore
    }
  }, [enabled]);

  return (
    <AnnotationModeContext.Provider value={{ enabled, toggle: () => setEnabled((v) => !v) }}>
      {children}
    </AnnotationModeContext.Provider>
  );
}

export function useAnnotationMode() {
  return useContext(AnnotationModeContext);
}
