import { useEffect, useRef, useState } from 'react'
import { CookingPot, Moon, Sun, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppNavigation } from '@/components/app-navigation'
import { PAGE_TITLES, parseRoute } from '@/lib/navigation'
import { InventoryPage } from '@/components/inventory-page'
import { CombinationsPage } from '@/components/combinations-page'
import { TodayPage } from '@/components/today-page'
import { DataPage } from '@/components/data-page'
import { HistoryPage } from '@/components/history-page'
import { useTheme } from '@/lib/use-theme'
import { usePantry } from '@/lib/use-pantry'

function App() {
  const store = usePantry()
  const theme = useTheme()
  const { dark } = theme
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  const { page, itemId: requestedId } = route
  const main = useRef<HTMLElement>(null)
  const initial = useRef(true)
  useEffect(() => {
    function navigate() { if (location.hash !== '#main') setRoute(parseRoute(location.hash)) }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  useEffect(() => {
    document.title = `${PAGE_TITLES[page]} · 小王食堂`
    if (initial.current) { initial.current = false; return }
    const frame = requestAnimationFrame(() => {
      const heading = main.current?.querySelector('h1')
      heading?.setAttribute('tabindex', '-1')
      heading?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
    return () => cancelAnimationFrame(frame)
  }, [page, requestedId])
  return <>
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4">跳转到主要内容</a>
    <header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8"><a href="#today" className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring"><span className="rounded-xl bg-primary p-2.5 text-primary-foreground"><CookingPot aria-hidden="true" className="size-5" /></span><span className="font-semibold">小王食堂<span className="block text-xs font-normal text-muted-foreground">Wang’s Canteen</span></span></a><Button variant="outline" size="icon" aria-label={dark ? '切换为浅色主题' : '切换为深色主题'} onClick={theme.toggle}>{dark ? <Sun /> : <Moon />}</Button></div></header>
    <AppNavigation page={page} pending={store.pending} />
    <main ref={main} id="main" tabIndex={-1} className="mx-auto max-w-5xl space-y-7 px-5 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-10 sm:pb-10">
      {store.error && <div role="alert" className="space-y-3 rounded-lg border border-destructive/40 bg-card p-4"><p className="text-sm wrap-anywhere text-destructive">{store.error}</p><Button variant="outline" size="sm" disabled={store.pending} onClick={store.reload}><RefreshCw />重新读取</Button></div>}
      {theme.notice && <p role="status" className="text-sm text-muted-foreground">{theme.notice}</p>}
      <p role="status" className="sr-only">{store.message}</p>{store.message && <p aria-hidden="true" className="text-sm wrap-anywhere text-primary">{store.message}</p>}
      {page === 'data' ? <DataPage key={`data-${store.revision}`} store={store} theme={theme} /> : page === 'today' ? <TodayPage key={`today-${store.revision}-${requestedId}`} requestedId={requestedId} store={store} /> : page === 'history' ? <HistoryPage key={`history-${store.revision}`} store={store} /> : page === 'meals' ? <CombinationsPage key={`meals-${store.revision}`} store={store} /> : <InventoryPage key={`inventory-${store.revision}-${requestedId}`} initialFilter={requestedId === 'low' ? 'low' : 'all'} store={store} />}
      <footer className="border-t pt-5 text-xs leading-6 text-muted-foreground">数据只保存在当前浏览器，刷新后仍在；不同设备不会同步，清除站点数据会丢失记录。</footer>
    </main>
  </>
}
export default App
