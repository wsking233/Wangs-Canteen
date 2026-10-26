import { useEffect, useRef, useState } from 'react'
import { CookingPot, Moon, Sun, Plus, Search, PackageOpen, Leaf, Pencil, Trash2, RefreshCw, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FoodForm, RestockForm } from '@/components/food-form'
import { INVENTORY_KEY, parseInventory, saveInventory, isAvailable, addStock, type Food } from '@/lib/inventory'

type Snapshot = { foods: Food[]; raw: string | null; error: string }
type Editor = { kind: 'add' } | { kind: 'edit' | 'restock' | 'delete'; food: Food }

function readInventory(): Snapshot {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY)
    return { foods: parseInventory(raw).foods, raw, error: '' }
  } catch { return { foods: [], raw: null, error: '无法读取本机库存，可能是浏览器存储不可用或已有数据损坏。原数据未被覆盖，请保留站点数据并尝试重新读取。' } }
}

function App() {
  const [snapshot, setSnapshot] = useState(readInventory)
  const current = useRef(snapshot)
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const addButton = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  function openEditor(next: Editor) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setError('')
    setEditor(next)
  }

  function reload() {
    const next = readInventory()
    current.current = next
    setSnapshot(next)
    setError('')
  }

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === INVENTORY_KEY || event.key === null) {
        reload()
        setEditor(null)
        setMessage('库存已与其他页面同步。')
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function commit(foods: Food[], feedback: string): boolean {
    try {
      if (current.current.error) throw new Error('请先恢复读取库存，再进行修改。')
      const raw = saveInventory(localStorage, current.current.raw, foods)
      const next = { foods, raw, error: '' }
      current.current = next
      setSnapshot(next)
      setMessage(feedback)
      setError('')
      setEditor(null)
      return true
    } catch (error) {
      setMessage('')
      setError(error instanceof Error ? error.message : '保存失败，请检查浏览器存储权限。')
      return false
    }
  }

  const { foods } = snapshot
  const available = foods.filter(isAvailable).length
  const shown = foods.filter(food => `${food.name} ${food.note}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (filter === 'all' || (filter === 'available' ? isAvailable(food) : !isAvailable(food))))
  const blocked = Boolean(snapshot.error)

  return <>
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4">跳转到主要内容</a>
    <header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
      <a href="#" className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring"><span className="rounded-xl bg-primary p-2.5 text-primary-foreground"><CookingPot aria-hidden="true" className="size-5" /></span><span className="font-semibold">小王食堂<span className="block text-xs font-normal text-muted-foreground">Wang’s Canteen</span></span></a>
      <Button variant="outline" size="icon" aria-label={dark ? '切换为浅色主题' : '切换为深色主题'} onClick={() => { document.documentElement.classList.toggle('dark', !dark); setDark(!dark) }}>{dark ? <Sun /> : <Moon />}</Button>
    </div></header>
    <main id="main" className="mx-auto max-w-5xl space-y-7 px-5 py-8 sm:px-8 sm:py-12">
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-xl space-y-3"><Badge variant="secondary"><Leaf aria-hidden="true" /> 我的食物小账本</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">先看看，家里还有什么。</h1><p className="text-sm leading-6 text-muted-foreground">把冰箱和柜子里的食物记下来，给下一顿饭留点头绪。</p></div>
        <Button ref={addButton} disabled={blocked} onClick={() => openEditor({ kind: 'add' })}><Plus aria-hidden="true" />添加食物</Button>
      </section>
      <section aria-label="库存概览" className="grid grid-cols-3 gap-2 sm:gap-4">
        {[[foods.length, '食物种类'], [available, '可用于搭配'], [foods.length - available, '已用完或停用']].map(([value, title]) => <Card key={title} className="gap-2 py-4 shadow-none"><CardContent className="px-3 sm:px-6"><p className="text-2xl font-semibold text-primary">{blocked ? '—' : value}<span className="ml-1 text-xs font-normal text-muted-foreground">种</span></p><p className="mt-1 text-xs text-muted-foreground sm:text-sm">{title}</p></CardContent></Card>)}
      </section>
      {(snapshot.error || error) && <div role="alert" className="space-y-3 rounded-lg border border-destructive/40 bg-card p-4"><p className="text-sm text-destructive">{snapshot.error || error}</p><Button variant="outline" size="sm" onClick={reload}><RefreshCw aria-hidden="true" />重新读取</Button></div>}
      <p role="status" className="sr-only">{message}</p>
      {message && <p aria-hidden="true" className="text-sm text-primary">{message}</p>}
      {!blocked && foods.length === 0 ? <Card className="border-dashed py-10 text-center sm:py-14"><CardContent className="mx-auto max-w-md space-y-5"><PackageOpen aria-hidden="true" className="mx-auto size-10 text-primary" /><div><h2 className="text-xl font-semibold">从第一样食物开始</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">一包饺子、半份意面，或冷冻层里的炸鸡。只要记下名称、数量和单位就好。</p></div><Button onClick={() => openEditor({ kind: 'add' })}><Plus aria-hidden="true" />添加第一样食物</Button><p className="text-xs leading-5 text-muted-foreground">试试添加「炸鸡 · 8 块」和「意面 · 5 份」。</p></CardContent></Card> : !blocked && <section aria-labelledby="inventory-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="inventory-title" className="text-lg font-semibold">我的库存 <span className="text-sm font-normal text-muted-foreground">{shown.length} 种</span></h2><div className="relative w-full sm:w-64"><Search aria-hidden="true" className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="搜索食物" className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索名称或备注" /></div></div>
        <div className="flex flex-wrap gap-2" aria-label="库存筛选">{[['all', '全部'], ['available', '可搭配'], ['unavailable', '已用完 / 停用']].map(([value, label]) => <Button key={value} variant={filter === value ? 'secondary' : 'ghost'} size="sm" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}</div>
        {shown.length === 0 ? <Card className="py-8 text-center"><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">没有符合条件的食物，换个关键词或筛选试试。</p><Button variant="outline" onClick={() => { setQuery(''); setFilter('all') }}>清除筛选</Button></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2">{shown.map(food => <Card key={food.id} className="gap-4" aria-label={`食物：${food.name}`}>
          <CardHeader className="gap-3"><div className="flex items-start justify-between gap-3"><CardTitle className="min-w-0 break-words text-lg">{food.name}</CardTitle><Badge variant={isAvailable(food) ? 'secondary' : 'outline'} className="shrink-0">{!food.enabled ? '已停用' : food.quantity === 0 ? '已用完' : '可搭配'}</Badge></div><CardDescription className="break-words">{food.note || '好好存着，慢慢吃。'}</CardDescription></CardHeader>
          <CardContent className="space-y-4"><p className="text-3xl font-semibold tracking-tight">{food.quantity}<span className="ml-2 text-sm font-normal text-muted-foreground">{food.unit}</span></p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openEditor({ kind: 'restock', food })}><Plus aria-hidden="true" />补货</Button><Button size="sm" variant="ghost" aria-label={`编辑${food.name}`} onClick={() => openEditor({ kind: 'edit', food })}><Pencil aria-hidden="true" />编辑</Button><Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" aria-label={`删除${food.name}`} onClick={() => openEditor({ kind: 'delete', food })}><Trash2 aria-hidden="true" /></Button></div></CardContent>
        </Card>)}</div>}
      </section>}
      <aside className="flex items-start gap-3 rounded-xl bg-secondary p-5 text-sm"><ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="font-medium">下一步：把库存搭配成一顿饭</p><p className="mt-1 leading-6 text-muted-foreground">先把库存记准确，后续加入自由搭配、“换一个”和开饭后自动扣减。</p></div></aside>
      <footer className="border-t pt-5 text-xs leading-6 text-muted-foreground">数据只保存在当前浏览器，刷新后仍在；不同设备不会同步，清除站点数据会丢失记录。</footer>
    </main>
    <Dialog open={editor !== null} onOpenChange={open => { if (!open) setEditor(null) }}><DialogContent className="max-h-[85dvh] overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); (opener.current?.isConnected ? opener.current : addButton.current)?.focus() }}>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {editor?.kind === 'add' && <FoodForm key="add" onCancel={() => setEditor(null)} onSave={food => commit([...current.current.foods, food], `已添加${food.name}。`)} />}
      {editor?.kind === 'edit' && <FoodForm key={editor.food.id} food={editor.food} onCancel={() => setEditor(null)} onSave={food => commit(current.current.foods.map(item => item.id === food.id ? food : item), `已更新${food.name}。`)} />}
      {editor?.kind === 'restock' && <RestockForm key={`restock-${editor.food.id}`} food={editor.food} onCancel={() => setEditor(null)} onSave={amount => {
        try {
          const food = current.current.foods.find(food => food.id === editor.food.id)
          if (!food) throw new Error('食物已不存在，请重新读取。')
          const updated = addStock(food, amount)
          return commit(current.current.foods.map(item => item.id === food.id ? updated : item), `已为${food.name}补货 ${amount} ${food.unit}。`)
        } catch (error) { setError(error instanceof Error ? error.message : '补货失败。'); return false }
      }} />}
      {editor?.kind === 'delete' && <><DialogHeader><DialogTitle>删除{editor.food.name}？</DialogTitle><DialogDescription>将移除这项食物及其库存，无法撤销。如果只是暂时不吃，可以在编辑中停用。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>保留食物</Button><Button variant="destructive" onClick={() => commit(current.current.foods.filter(food => food.id !== editor.food.id), `已删除${editor.food.name}。`)}>确认删除</Button></DialogFooter></>}
    </DialogContent></Dialog>
  </>
}

export default App
