import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { VersionProvider } from './contexts/VersionContext'
import './index.css'
import { enableMocking } from './mocks'

enableMocking()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('[msw] 启动失败，应用将在无 mock 状态下运行', err)
  })
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <VersionProvider>
          <App />
        </VersionProvider>
      </React.StrictMode>,
    )
  })
