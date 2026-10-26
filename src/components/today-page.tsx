import { useRef, useState } from 'react'
import { ArrowRight, CookingPot, Shuffle, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CombinationForm } from './combination-form'
import { MealConfirmation } from './meal-confirmation'
import { availability, chooseMeal, type Combination } from '@/lib/pantry'
import { needsRestock } from '@/lib/inventory'
import type { PantryStore } from '@/lib/use-pantry'

export function TodayPage({ store, requestedId }: { store: PantryStore; requestedId?: string }) {
  const [selectedId, setSelectedId] = useState(() => requestedId ?? chooseMeal(store.pantry)?.id ?? '')
  const [confirm, setConfirm] = useState<Combination | null>(null)
  const [building, setBuilding] = useState(false)
  const [draft, setDraft] = useState<Combination | undefined>()
  const builderTrigger = useRef<HTMLButtonElement>(null)
  const [custom, setCustom] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const lowStock = store.pantry.foods.filter(needsRestock).length
  const ready = store.pantry.combinations.filter(meal => !availability(meal, store.pantry.foods).length)
  const latestRecord = store.pantry.records.filter(record => !record.cancelledAt).sort((a, b) => Date.parse(b.eatenAt) - Date.parse(a.eatenAt))[0]
  const selected = ready.find(meal => meal.id === selectedId) ?? ready[0]
  return <>
    <section className="space-y-5"><div className="max-w-xl space-y-3"><Badge variant="secondary"><Sparkles aria-hidden="true" /> 今天吃什么</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">少纠结一会儿，<br />好好吃一顿饭。</h1><p className="text-sm leading-6 text-muted-foreground">从家里已有的食物里，挑一顿刚刚好的搭配。</p><p className="text-xs leading-5 text-muted-foreground">会参考最近 3 顿，尽量换着吃。也可以到常用搭配里，主动选择喜欢的那一顿。</p></div><Button ref={builderTrigger} variant="outline" disabled={store.blocked || !store.pantry.foods.some(food => food.enabled && food.quantity > 0)} onClick={() => { store.clearError(); setDraft(undefined); setCustom(true); setBuilding(true) }}><Plus />自己搭一顿</Button></section>
    {!store.blocked && selected ? <Card className="overflow-hidden border-primary/20" aria-label="今日推荐"><CardHeader className="bg-secondary/60 pb-6"><div className="flex flex-wrap items-center gap-2"><Badge>库存足够</Badge><span className="text-xs text-muted-foreground">{ready.length} 个可用搭配里，先试试这一顿</span></div><CardTitle className="break-words text-2xl sm:text-3xl">{selected.name}</CardTitle></CardHeader><CardContent className="space-y-6 pt-2"><ul className="divide-y">{selected.items.map(item => <li key={item.foodId} className="flex items-start justify-between gap-4 py-3"><span className="min-w-0 break-words">{store.pantry.foods.find(food => food.id === item.foodId)?.name}</span><span className="shrink-0 font-medium">{item.quantity} {item.unit}</span></li>)}</ul><div className="flex flex-wrap gap-3"><Button ref={trigger} size="lg" onClick={() => { store.clearError(); setCustom(false); setConfirm(selected) }}><CookingPot />就吃这个</Button><Button variant="outline" size="lg" disabled={ready.length < 2} onClick={() => setSelectedId(chooseMeal(store.pantry, selected.id)?.id ?? '')}><Shuffle />换一个</Button></div>{ready.length === 1 && <p className="text-xs leading-5 text-muted-foreground">目前只有这个搭配库存足够。多保存几个常用搭配，就能换着吃。</p>}</CardContent></Card> : !store.blocked && <Card className="border-dashed py-10 text-center"><CardContent className="mx-auto max-w-lg space-y-4"><CookingPot aria-hidden="true" className="mx-auto size-10 text-primary" /><h2 className="text-xl font-semibold">{!store.pantry.foods.length ? '先看看家里有什么' : !store.pantry.combinations.length ? '把喜欢的食物搭在一起' : '先补一点食物，再开饭'}</h2><p className="text-sm leading-6 text-muted-foreground">{!store.pantry.foods.length ? '记下已有食物，再保存一两个常用搭配，就能开始推荐。' : !store.pantry.combinations.length ? '可以保存常用搭配，也可以直接点“自己搭一顿”，临时决定这一餐。' : '现在没有库存足够的搭配。去常用搭配查看缺少什么，补货或调整用量。'}</p><Button asChild><a href={!store.pantry.foods.length ? '#inventory' : '#meals'}>{!store.pantry.foods.length ? '添加家中食物' : '去常用搭配'}<ArrowRight /></a></Button></CardContent></Card>}
    {!store.blocked && lowStock > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">有 {lowStock} 样食物到了补货提醒线。</p><Button asChild variant="outline" size="sm"><a href="#inventory/low">看看该补什么 <ArrowRight /></a></Button></div>}
    {latestRecord && <div className="rounded-xl bg-secondary p-5"><p className="text-sm font-medium">上一顿吃了 {latestRecord.name}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(latestRecord.eatenAt).toLocaleString('zh-CN')}</p><Button asChild variant="link" className="mt-2 h-auto px-0"><a href="#history">看看吃过什么 <ArrowRight /></a></Button></div>}
    <Dialog open={building || confirm !== null} onOpenChange={open => { if (!open && !store.pending) { setBuilding(false); setConfirm(null) } }}><DialogContent showCloseButton={!store.pending} className="max-h-[85dvh] overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); (custom ? builderTrigger.current : trigger.current)?.focus() }}>
      {building ? <CombinationForm mode="eat" meal={draft} foods={store.pantry.foods} onCancel={() => setBuilding(false)} onSave={async meal => { setDraft(meal); setBuilding(false); setConfirm(meal); return true }} /> : confirm && <MealConfirmation key={confirm.id} meal={confirm} store={store} onClose={() => setConfirm(null)} onBack={custom ? items => { setDraft({ ...confirm, items }); setConfirm(null); setBuilding(true) } : undefined} onSaved={() => { setConfirm(null); setDraft(undefined); setSelectedId(chooseMeal(store.pantry, confirm.id)?.id ?? '') }} />}
    </DialogContent></Dialog>
  </>
}
