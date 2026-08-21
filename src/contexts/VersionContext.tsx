import { createContext, useEffect, useState, type ReactNode } from 'react';

export type AppVersion = 'v1.0' | 'full';

interface VersionContextValue {
  appVersion: AppVersion;
  setAppVersion: (version: AppVersion) => void;
  isV1: boolean;
}

const VERSION_KEY = 'cj_app_version';

function loadVersion(): AppVersion {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    if (raw === 'full') return 'full';
    // 旧的 'mvp' 值迁移为 'v1.0'
    if (raw === 'v1.0' || raw === 'mvp') return 'v1.0';
  } catch {
    // ignore
  }
  return 'full';
}

const VersionContext = createContext<VersionContextValue | null>(null);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [appVersion, setAppVersionState] = useState<AppVersion>(() => loadVersion());

  useEffect(() => {
    localStorage.setItem(VERSION_KEY, appVersion);
  }, [appVersion]);

  const setAppVersion = (version: AppVersion) => {
    setAppVersionState(version);
  };

  return (
    <VersionContext.Provider
      value={{
        appVersion,
        setAppVersion,
        isV1: appVersion === 'v1.0',
      }}
    >
      {children}
    </VersionContext.Provider>
  );
}

export { VersionContext };
