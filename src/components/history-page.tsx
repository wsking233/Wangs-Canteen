import { History, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PantryStore } from '@/lib/use-pantry'
export function HistoryPage({ store }: { store: PantryStore }) {
  return <>
    <section className="space-y-3"><Badge variant="secondary">我的用餐记录</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">好好吃饭的日子。</h1><p className="text-sm leading-6 text-muted-foreground">记下吃过什么，也把库存记清楚。</p></section>
    {!store.blocked && !store.pantry.records.length ? <Card className="border-dashed py-10 text-center"><CardContent className="space-y-4"><History aria-hidden="true" className="mx-auto size-10 text-primary" /><h2 className="text-xl font-semibold">第一顿饭，还没记下</h2><p className="text-sm text-muted-foreground">在今天吃什么里确认开饭，就会出现在这里。</p><Button asChild><a href="#today">决定今天吃什么 <ArrowRight /></a></Button></CardContent></Card> : !store.blocked && <div className="grid gap-4 sm:grid-cols-2">{store.pantry.records.map(record => <Card key={record.id} aria-label={`用餐：${record.name}`}><CardHeader><p className="text-xs text-muted-foreground"><time dateTime={record.eatenAt}>{new Date(record.eatenAt).toLocaleString('zh-CN')}</time></p><CardTitle className="break-words text-lg">{record.name}</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm">{record.items.map(item => <li key={item.foodId} className="flex justify-between gap-3"><span className="min-w-0 break-words">{item.name}</span><span className="shrink-0 text-muted-foreground">{item.quantity} {item.unit}</span></li>)}</ul></CardContent></Card>)}</div>}
  </>
}
