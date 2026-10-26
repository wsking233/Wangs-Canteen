import { useRef, useState } from 'react'
import { Plus, Search, PackageOpen, Leaf, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FoodForm, RestockForm } from '@/components/food-form'
import { isAvailable, addStock, type Food } from '@/lib/inventory'
import type { PantryStore } from '@/lib/use-pantry'

type Editor = { kind: 'add' } | { kind: 'edit' | 'restock' | 'delete'; food: Food }
export function InventoryPage({ store }: { store: PantryStore }) {
  const { pantry, blocked, error, clearError } = store
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState<Editor | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  function openEditor(next: Editor) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    clearError()
    setEditor(next)
  }


  async function commit(update: (foods: Food[]) => Food[], feedback: string) {
    const saved = await store.commit(current => ({ ...current, foods: update(current.foods) }), feedback)
    if (saved) setEditor(null)
    return saved
  }
  const { foods } = pantry
  const available = foods.filter(isAvailable).length
  const shown = foods.filter(food => `${food.name} ${food.note}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (filter === 'all' || (filter === 'available' ? isAvailable(food) : !isAvailable(food))))

  return <>
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-xl space-y-3"><Badge variant="secondary"><Leaf aria-hidden="true" /> 我的食物小账本</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">先看看，家里还有什么。</h1><p className="text-sm leading-6 text-muted-foreground">把冰箱和柜子里的食物记下来，给下一顿饭留点头绪。</p></div>
        <Button ref={addButton} disabled={blocked} onClick={() => openEditor({ kind: 'add' })}><Plus aria-hidden="true" />添加食物</Button>
      </section>
      <section aria-label="库存概览" className="grid grid-cols-3 gap-2 sm:gap-4">
        {[[foods.length, '食物种类'], [available, '可用于搭配'], [foods.length - available, '已用完或停用']].map(([value, title]) => <Card key={title} className="gap-2 py-4 shadow-none"><CardContent className="px-3 sm:px-6"><p className="text-2xl font-semibold text-primary">{blocked ? '—' : value}<span className="ml-1 text-xs font-normal text-muted-foreground">种</span></p><p className="mt-1 text-xs text-muted-foreground sm:text-sm">{title}</p></CardContent></Card>)}
      </section>
      {!blocked && foods.length === 0 ? <Card className="border-dashed py-10 text-center sm:py-14"><CardContent className="mx-auto max-w-md space-y-5"><PackageOpen aria-hidden="true" className="mx-auto size-10 text-primary" /><div><h2 className="text-xl font-semibold">从第一样食物开始</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">一包饺子、半份意面，或冷冻层里的炸鸡。只要记下名称、数量和单位就好。</p></div><Button onClick={() => openEditor({ kind: 'add' })}><Plus aria-hidden="true" />添加第一样食物</Button><p className="text-xs leading-5 text-muted-foreground">试试添加「炸鸡 · 8 块」和「意面 · 5 份」。</p></CardContent></Card> : !blocked && <section aria-labelledby="inventory-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="inventory-title" className="text-lg font-semibold">我的库存 <span className="text-sm font-normal text-muted-foreground">{shown.length} 种</span></h2><div className="relative w-full sm:w-64"><Search aria-hidden="true" className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="搜索食物" className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索名称或备注" /></div></div>
        <div className="flex flex-wrap gap-2" aria-label="库存筛选">{[['all', '全部'], ['available', '可搭配'], ['unavailable', '已用完 / 停用']].map(([value, label]) => <Button key={value} variant={filter === value ? 'secondary' : 'ghost'} size="sm" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}</div>
        {shown.length === 0 ? <Card className="py-8 text-center"><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">没有符合条件的食物，换个关键词或筛选试试。</p><Button variant="outline" onClick={() => { setQuery(''); setFilter('all') }}>清除筛选</Button></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2">{shown.map(food => <Card key={food.id} className="gap-4" aria-label={`食物：${food.name}`}>
          <CardHeader className="gap-3"><div className="flex items-start justify-between gap-3"><CardTitle className="min-w-0 break-words text-lg">{food.name}</CardTitle><Badge variant={isAvailable(food) ? 'secondary' : 'outline'} className="shrink-0">{!food.enabled ? '已停用' : food.quantity === 0 ? '已用完' : '可搭配'}</Badge></div><CardDescription className="break-words">{food.note || '好好存着，慢慢吃。'}</CardDescription></CardHeader>
          <CardContent className="space-y-4"><p className="text-3xl font-semibold tracking-tight">{food.quantity}<span className="ml-2 text-sm font-normal text-muted-foreground">{food.unit}</span></p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openEditor({ kind: 'restock', food })}><Plus aria-hidden="true" />补货</Button><Button size="sm" variant="ghost" aria-label={`编辑${food.name}`} onClick={() => openEditor({ kind: 'edit', food })}><Pencil aria-hidden="true" />编辑</Button><Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" aria-label={`删除${food.name}`} onClick={() => openEditor({ kind: 'delete', food })}><Trash2 aria-hidden="true" /></Button></div></CardContent>
        </Card>)}</div>}
      </section>}
    <Dialog open={editor !== null} onOpenChange={open => { if (!open && !store.pending) setEditor(null) }}><DialogContent showCloseButton={!store.pending} className="max-h-[85dvh] overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); (opener.current?.isConnected ? opener.current : addButton.current)?.focus() }}>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {editor?.kind === 'add' && <FoodForm key="add" onCancel={() => setEditor(null)} onSave={food => commit(foods => [...foods, food], `已添加${food.name}。`)} />}
      {editor?.kind === 'edit' && <FoodForm key={editor.food.id} food={editor.food} onCancel={() => setEditor(null)} onSave={food => commit(foods => foods.map(item => item.id === food.id ? food : item), `已更新${food.name}。`)} />}
      {editor?.kind === 'restock' && <RestockForm key={`restock-${editor.food.id}`} food={editor.food} onCancel={() => setEditor(null)} onSave={amount => {
        return commit(foods => {
          const food = foods.find(food => food.id === editor.food.id)
          if (!food) throw new Error('食物已不存在，请重新读取。')
          const updated = addStock(food, amount)
          return foods.map(item => item.id === food.id ? updated : item)
        }, `已为${editor.food.name}补货 ${amount} ${editor.food.unit}。`)
      }} />}
      {editor?.kind === 'delete' && <><DialogHeader><DialogTitle>删除{editor.food.name}？</DialogTitle><DialogDescription>将移除这项食物及其库存，无法撤销。如果只是暂时不吃，可以在编辑中停用。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={store.pending} onClick={() => setEditor(null)}>保留食物</Button><Button variant="destructive" disabled={store.pending} onClick={async () => commit(foods => foods.filter(food => food.id !== editor.food.id), `已删除${editor.food.name}。`)}>确认删除</Button></DialogFooter></>}
    </DialogContent></Dialog>
  </>
}
