import { Database, History, PackageOpen, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PageName } from '@/lib/navigation'

const destinations = [
  { id: 'today', label: '今天吃什么', short: '今天', icon: Sparkles },
  { id: 'inventory', label: '我的库存', short: '库存', icon: PackageOpen },
  { id: 'meals', label: '常用搭配', short: '搭配', icon: UtensilsCrossed },
  { id: 'history', label: '用餐记录', short: '记录', icon: History },
  { id: 'data', label: '我的数据', short: '数据', icon: Database },
] as const
export function AppNavigation({ page, pending }: { page: PageName; pending: boolean }) {
  return <>
    <div className="mx-auto hidden max-w-5xl px-8 pt-6 sm:block"><nav aria-label="主导航" className="flex flex-wrap gap-2">{destinations.map(({ id, label, icon: Icon }) => <Button key={id} asChild size="sm" variant={page === id ? 'secondary' : 'ghost'}><a href={`#${id}`} aria-label={label} onClick={event => { if (pending) event.preventDefault() }} aria-disabled={pending || undefined} aria-current={page === id ? 'page' : undefined}><Icon aria-hidden="true" />{label}</a></Button>)}</nav></div>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-sm backdrop-blur sm:hidden"><nav aria-label="主导航" className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">{destinations.map(({ id, label, short, icon: Icon }) => <Button key={id} asChild variant={page === id ? 'secondary' : 'ghost'} className="h-auto min-h-12 flex-col gap-1 rounded-lg px-1 py-2 text-xs leading-none"><a href={`#${id}`} aria-label={label} onClick={event => { if (pending) event.preventDefault() }} aria-disabled={pending || undefined} aria-current={page === id ? 'page' : undefined}><Icon aria-hidden="true" className="size-5" /><span>{short}</span></a></Button>)}</nav></div>
  </>
}
