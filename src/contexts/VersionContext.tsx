import { createContext, useEffect, useState, type ReactNode } from 'react';

export type AppVersion = 'mvp' | 'full';

interface VersionContextValue {
  appVersion: AppVersion;
  setAppVersion: (version: AppVersion) => void;
  isMVP: boolean;
}

const VERSION_KEY = 'cj_app_version';

function loadVersion(): AppVersion {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    if (raw === 'mvp' || raw === 'full') return raw;
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
        isMVP: appVersion === 'mvp',
      }}
    >
      {children}
    </VersionContext.Provider>
  );
}

export { VersionContext };
