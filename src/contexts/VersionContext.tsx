import { createContext, useEffect, useState, type ReactNode } from 'react';

export type AppVersion = 'v1.0' | 'v1.1' | 'full';

interface VersionContextValue {
  appVersion: AppVersion;
  setAppVersion: (version: AppVersion) => void;
  isV1: boolean;
  isFull: boolean;
}

const VERSION_KEY = 'cj_app_version';

function loadVersion(): AppVersion {
  // 当前演示分支展示 V1.1：合并原计划 V1.1 人生档案与 V1.2 家庭记忆。
  return 'v1.1';
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
        isFull: appVersion === 'full',
      }}
    >
      {children}
    </VersionContext.Provider>
  );
}

export { VersionContext };
