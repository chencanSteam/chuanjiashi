import { createContext, useEffect, useState, type ReactNode } from 'react';

export type AppVersion = 'v1.0' | 'full';

interface VersionContextValue {
  appVersion: AppVersion;
  setAppVersion: (version: AppVersion) => void;
  isV1: boolean;
}

const VERSION_KEY = 'cj_app_version';

function loadVersion(): AppVersion {
  // 当前产品阶段固定展示 V1.0，暂不向用户开放其他版本内容。
  return 'v1.0';
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
