export async function enableMocking() {
  // 在开发环境和生产静态部署环境下均启用 MSW，以提供 mock API 数据
  const { worker } = await import('./browser')

  // 清理历史 Service Worker，避免旧版本缓存导致接口没有被 mock 拦截
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    } catch {
      // ignore
    }
  }

  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
      options: {
        updateViaCache: 'none',
      },
    },
  })
}
