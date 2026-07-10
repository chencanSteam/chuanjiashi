export async function enableMocking() {
  // 在开发环境和生产静态部署环境下均启用 MSW，以提供 mock API 数据
  const { worker } = await import('./browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
      options: {
        updateViaCache: 'none',
        scope: '/',
      },
    },
  })
}
