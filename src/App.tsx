import { useEffect, useState } from 'react'
import { CookingPot, Moon, Sun, RefreshCw, PackageOpen, UtensilsCrossed, Sparkles, History, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InventoryPage } from '@/components/inventory-page'
import { CombinationsPage } from '@/components/combinations-page'
import { TodayPage } from '@/components/today-page'
import { DataPage } from '@/components/data-page'
import { HistoryPage } from '@/components/history-page'
import { usePantry } from '@/lib/use-pantry'

function App() {
  const store = usePantry()
  const [dark, setDark] = useState(false)
  function readPage() { return location.hash.slice(1).split('/')[0] || 'today' }
  const [page, setPage] = useState(readPage)
  const [requestedId, setRequestedId] = useState(() => location.hash.split('/')[1])
  useEffect(() => {
    function navigate() { const next = readPage(); if (['today', 'inventory', 'meals', 'history', 'data'].includes(next)) { setPage(next); setRequestedId(location.hash.split('/')[1]) } }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  return <>
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4">跳转到主要内容</a>
    <header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8"><a href="#today" className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring"><span className="rounded-xl bg-primary p-2.5 text-primary-foreground"><CookingPot aria-hidden="true" className="size-5" /></span><span className="font-semibold">小王食堂<span className="block text-xs font-normal text-muted-foreground">Wang’s Canteen</span></span></a><Button variant="outline" size="icon" aria-label={dark ? '切换为浅色主题' : '切换为深色主题'} onClick={() => { document.documentElement.classList.toggle('dark', !dark); setDark(!dark) }}>{dark ? <Sun /> : <Moon />}</Button></div></header>
    <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-8"><nav aria-label="主导航" className="flex flex-wrap gap-1 sm:gap-2">{[['today', '今天吃什么', Sparkles], ['inventory', '我的库存', PackageOpen], ['meals', '常用搭配', UtensilsCrossed], ['history', '用餐记录', History], ['data', '我的数据', Database]].map(([id, label, Icon]) => <Button key={String(id)} asChild size="sm" variant={page === id ? 'secondary' : 'ghost'}><a href={`#${id}`} aria-current={page === id ? 'page' : undefined}><Icon aria-hidden="true" />{String(label)}</a></Button>)}</nav></div>
    <main id="main" tabIndex={-1} className="mx-auto max-w-5xl space-y-7 px-5 py-8 sm:px-8 sm:py-10">
      {store.error && <div role="alert" className="space-y-3 rounded-lg border border-destructive/40 bg-card p-4"><p className="text-sm text-destructive">{store.error}</p><Button variant="outline" size="sm" onClick={store.reload}><RefreshCw />重新读取</Button></div>}
      <p role="status" className="sr-only">{store.message}</p>{store.message && <p aria-hidden="true" className="text-sm text-primary">{store.message}</p>}
      {page === 'data' ? <DataPage key={`data-${store.revision}`} store={store} /> : page === 'today' ? <TodayPage key={`today-${store.revision}-${requestedId}`} requestedId={requestedId} store={store} /> : page === 'history' ? <HistoryPage key={`history-${store.revision}`} store={store} /> : page === 'meals' ? <CombinationsPage key={`meals-${store.revision}`} store={store} /> : <InventoryPage key={`inventory-${store.revision}`} store={store} />}
      <footer className="border-t pt-5 text-xs leading-6 text-muted-foreground">数据只保存在当前浏览器，刷新后仍在；不同设备不会同步，清除站点数据会丢失记录。</footer>
    </main>
  </>
}
export default App
