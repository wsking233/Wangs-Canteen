import { useRef, useState } from 'react'
import { History, ArrowRight, Undo2, Search, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { RecordForm } from './record-form'
import { cancelMeal, type MealRecord } from '@/lib/pantry'
import type { PantryStore } from '@/lib/use-pantry'

export function HistoryPage({ store }: { store: PantryStore }) {
  const [undo, setUndo] = useState<MealRecord | null>(null)
  const [edit, setEdit] = useState<MealRecord | null>(null)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('all')
  const [limit, setLimit] = useState(20)
  const opener = useRef<HTMLElement | null>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const active = store.pantry.records.filter(record => !record.cancelledAt)
  const [now, setNow] = useState(() => Date.now())
  const records = store.pantry.records.filter(record => (record.name + record.items.map(item => item.name).join(' ')).toLowerCase().includes(query.trim().toLowerCase()) && (period === 'all' || (Date.parse(record.eatenAt) >= now - 7 * 86400000 && Date.parse(record.eatenAt) <= now))).sort((a, b) => Date.parse(b.eatenAt) - Date.parse(a.eatenAt))
  return <>
    <section className="space-y-3"><Badge variant="secondary">我的用餐记录</Badge><h1 ref={title} tabIndex={-1} className="text-3xl font-semibold tracking-tight sm:text-4xl">好好吃饭的日子。</h1><p className="text-sm leading-6 text-muted-foreground">记下吃过什么，也把库存记清楚。记错了，可以撤销并返还用量。</p></section>
    {!store.blocked && !store.pantry.records.length ? <Card className="border-dashed py-10 text-center"><CardContent className="space-y-4"><History aria-hidden="true" className="mx-auto size-10 text-primary" /><h2 className="text-xl font-semibold">第一顿饭，还没记下</h2><p className="text-sm text-muted-foreground">在今天吃什么里确认开饭，就会出现在这里。</p><Button asChild><a href="#today">决定今天吃什么 <ArrowRight /></a></Button></CardContent></Card> : !store.blocked && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">已记录 {active.length} 顿 · 已撤销 {store.pantry.records.length - active.length} 顿</p><div className="relative w-full sm:w-64"><Search aria-hidden="true" className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="搜索用餐记录" className="pl-9" value={query} onChange={event => { setQuery(event.target.value); setLimit(20); setNow(Date.now()) }} placeholder="搜索搭配或食物" /></div></div>
      <div className="flex gap-2" role="group" aria-label="用餐时间筛选">{[['all', '全部时间'], ['week', '最近 7 天']].map(([id, label]) => <Button key={id} variant={period === id ? 'secondary' : 'ghost'} size="sm" aria-pressed={period === id} onClick={() => { setPeriod(id); setLimit(20); setNow(Date.now()) }}>{label}</Button>)}</div>
      {!records.length ? <Card className="py-8 text-center"><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">这段时间还没有匹配的用餐记录。</p><Button variant="outline" onClick={() => { setQuery(''); setPeriod('all') }}>清除记录筛选</Button></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2">{records.slice(0, limit).map(record => <Card role="group" key={record.id} aria-label={`用餐：${record.name}`}><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground"><time dateTime={record.eatenAt}>{new Date(record.eatenAt).toLocaleString('zh-CN')}</time></p><div className="flex gap-2">{!record.combinationId && <Badge variant="secondary">自由搭配</Badge>}{record.cancelledAt && <Badge variant="outline">已撤销</Badge>}</div></div><CardTitle className="wrap-anywhere text-lg">{record.name}</CardTitle></CardHeader><CardContent className="space-y-4"><ul className="space-y-2 text-sm">{record.items.map(item => <li key={item.foodId} className="flex justify-between gap-3"><span className="min-w-0 wrap-anywhere">{item.name}</span><span className="shrink-0 text-muted-foreground">{item.quantity} {item.unit}</span></li>)}</ul>{record.cancelledAt ? <p className="text-xs text-muted-foreground">库存已返还 · {new Date(record.cancelledAt).toLocaleString('zh-CN')}</p> : <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" aria-label={`修正记录：${record.name}`} onClick={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; store.clearError(); setEdit(record) }}><Pencil />修正记录</Button><Button variant="ghost" size="sm" aria-label={`撤销这顿：${record.name}`} onClick={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; store.clearError(); setUndo(record) }}><Undo2 />撤销这顿</Button></div>}{record.editedAt && <p className="text-xs text-muted-foreground">已修改 · {new Date(record.editedAt).toLocaleString('zh-CN')}</p>}</CardContent></Card>)}</div>}
      {records.length > limit && <Button variant="outline" className="w-full" onClick={() => setLimit(limit + 20)}>再看 20 条（还有 {records.length - limit} 条）</Button>}
    </>}
    <Dialog open={undo !== null || edit !== null} onOpenChange={open => { if (!open && !store.pending) { setUndo(null); setEdit(null) } }}><DialogContent showCloseButton={!store.pending} className="max-h-[85dvh] overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); (opener.current?.isConnected ? opener.current : title.current)?.focus() }}>{edit ? <RecordForm key={edit.id} record={edit} store={store} onClose={() => setEdit(null)} /> : undo && <>
      <DialogHeader><DialogTitle>撤销「{undo.name}」？</DialogTitle><DialogDescription>返还这顿饭实际使用的数量，并保留一条已撤销记录。不会重复返还。若食物已删除，会恢复为本次返还的数量。</DialogDescription></DialogHeader>
      <ul className="space-y-2 text-sm">{undo.items.map(item => <li key={item.foodId} className="flex justify-between gap-3"><span className="min-w-0 wrap-anywhere">{item.name}</span><span className="shrink-0">+{item.quantity} {item.unit}</span></li>)}</ul>
      {store.error && <p role="alert" className="text-sm text-destructive">{store.error}</p>}
      <DialogFooter><Button variant="outline" disabled={store.pending} onClick={() => setUndo(null)}>保留记录</Button><Button disabled={store.pending} onClick={async () => { if (await store.commit(current => cancelMeal(current, undo.id, new Date().toISOString()), `已撤销「${undo.name}」，用量已返还库存。`)) setUndo(null) }}>确认撤销并返还</Button></DialogFooter>
    </>}</DialogContent></Dialog>
  </>
}
