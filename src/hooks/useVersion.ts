import { useContext } from 'react';
import { VersionContext, type AppVersion } from '../contexts/VersionContext';

export type { AppVersion };

export function useVersion() {
  const ctx = useContext(VersionContext);
  if (!ctx) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return ctx;
}
