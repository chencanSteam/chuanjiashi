import { createContext } from 'react';
import type { ToastItem } from '../components/ui/Toast';

export interface ToastContextValue {
  addToast: (message: string, type?: ToastItem['type']) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
