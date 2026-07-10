export async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        options: {
          updateViaCache: 'none',
        },
      },
    })
  }
  return Promise.resolve()
}
