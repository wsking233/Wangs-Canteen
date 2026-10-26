import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { availability, validateCombination, type Combination, type MealItem } from '@/lib/pantry'
import type { Food } from '@/lib/inventory'

export function CombinationForm({ meal, foods, onSave, onCancel, mode = 'save' }: { meal?: Combination; mode?: 'save' | 'eat'; foods: Food[]; onSave: (meal: Combination) => Promise<boolean>; onCancel: () => void }) {
  const [name, setName] = useState(meal?.name ?? '')
  const [items, setItems] = useState<MealItem[]>(meal?.items ?? [])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const reasons = items.length ? availability({ id: 'draft', name: 'draft', items }, foods) : []

  return <form className="space-y-5" onSubmit={async event => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const next = { id: meal?.id ?? crypto.randomUUID(), name: name.trim() || (mode === 'eat' ? items.map(item => foods.find(food => food.id === item.foodId)?.name ?? '').join(' + ').slice(0, 60) : ''), items }
      validateCombination(next)
      if (items.some(item => !foods.some(food => food.id === item.foodId && food.unit === item.unit))) throw new Error('请移除已删除或单位已变更的食物，再重新选择。')
      if (mode === 'eat' && availability(next, foods).length) throw new Error('请先调整到库存足够的用量。')
      if (!await onSave(next)) setError('保存未完成，请查看提示后重试。')
    } catch (error) { setError(error instanceof Error ? error.message : '保存失败。') }
    finally { setBusy(false) }
  }}>
    <DialogHeader><DialogTitle>{mode === 'eat' ? '自己搭这一顿' : meal ? '编辑搭配' : '新建搭配'}</DialogTitle><DialogDescription>{mode === 'eat' ? '选择现在想吃的食物，不必保存为常用搭配。下一步确认后才会扣减库存。' : '选几样食物，填写这一顿各吃多少。库存不足时也能先保存，补货后再用。'}</DialogDescription></DialogHeader>
    <div className="space-y-2"><Label htmlFor="meal-name">{mode === 'eat' ? '这顿叫什么（选填）' : '搭配名称'}</Label><Input autoFocus disabled={busy} id="meal-name" required={mode === 'save'} maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="例如：炸鸡配意面" /></div>
    <fieldset className="min-w-0 space-y-3"><legend className="mb-2 text-sm font-medium">这一顿吃什么 · 已选 {items.length} 样</legend>
      {items.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">从下方库存中添加食物，再填写每餐用量。</p>}
      {items.map(item => {
        const food = foods.find(food => food.id === item.foodId)
        return <div key={item.foodId} className="space-y-2 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between gap-3"><span className="min-w-0 wrap-anywhere text-sm font-medium">{food?.name ?? '已删除的食物'}</span><Button type="button" disabled={busy} variant="ghost" size="icon-sm" aria-label={`移除${food?.name ?? '已删除的食物'}`} onClick={() => setItems(items.filter(selected => selected.foodId !== item.foodId))}><X /></Button></div>
          <div className="flex items-center gap-3"><Label htmlFor={`amount-${item.foodId}`} className="shrink-0 text-xs">每餐用量</Label><Input disabled={busy} id={`amount-${item.foodId}`} aria-label={`${food?.name ?? '已删除的食物'}每餐用量`} className="min-w-0" type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" required value={item.quantity || ''} onChange={event => setItems(items.map(selected => selected.foodId === item.foodId ? { ...selected, quantity: Number(event.target.value) } : selected))} /><span className="shrink-0 text-sm text-muted-foreground">{item.unit}</span></div>
          {food && <p className="text-xs text-muted-foreground">库存 {food.quantity} {food.unit}{food.enabled ? '' : ' · 已停用'}{food.unit === item.unit ? '' : ' · 单位已变更，请移除后重新添加'}</p>}
        </div>
      })}
    </fieldset>
    <div className="space-y-3"><Label htmlFor="meal-food-search">从库存添加</Label><Input disabled={busy} id="meal-food-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索食物名称" />
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">{foods.filter(food => (mode !== 'eat' || (food.enabled && food.quantity > 0)) && !items.some(item => item.foodId === food.id) && food.name.toLowerCase().includes(query.trim().toLowerCase())).map(food => <Button key={food.id} type="button" variant="ghost" className="h-auto w-full justify-between whitespace-normal text-left" disabled={busy || items.length >= 50} onClick={() => setItems([...items, { foodId: food.id, quantity: 1, unit: food.unit }])}><span className="min-w-0 wrap-anywhere">{food.name}<span className="ml-2 text-xs text-muted-foreground">{food.quantity} {food.unit}{food.enabled ? '' : ' · 停用'}</span></span><Plus className="shrink-0" /></Button>)}
      {!foods.some(food => (mode !== 'eat' || (food.enabled && food.quantity > 0)) && !items.some(item => item.foodId === food.id) && food.name.toLowerCase().includes(query.trim().toLowerCase())) && <p className="p-2 text-xs text-muted-foreground">没有其他匹配的食物。</p>}</div>
    </div>
    {reasons.length > 0 && <div className="rounded-lg bg-secondary p-3 text-xs leading-6 text-muted-foreground">暂时不能开饭：{reasons.join('；')}。{mode === 'eat' ? '调整用量或先补货，再继续确认。' : '可以先保存，稍后补货或调整。'}</div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>取消</Button><Button type="submit" disabled={busy || !items.length || (mode === 'eat' && reasons.length > 0)}>{busy ? '正在处理…' : mode === 'eat' ? '确认本次搭配' : '保存搭配'}</Button></DialogFooter>
  </form>
}
