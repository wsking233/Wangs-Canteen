import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { availability, recordMeal, type Combination, type MealItem } from '@/lib/pantry'
import type { PantryStore } from '@/lib/use-pantry'

export function MealConfirmation({ meal, store, onClose, onSaved, onBack }: { meal: Combination; store: PantryStore; onClose: () => void; onSaved: () => void; onBack?: (items: MealItem[]) => void }) {
  const [items, setItems] = useState(meal.items)
  const [recordId] = useState(() => crypto.randomUUID())
  const [failed, setFailed] = useState(false)
  const reasons = availability({ ...meal, items }, store.pantry.foods)
  return <form className="space-y-5" onSubmit={async event => {
    event.preventDefault()
    const saved = await store.commit(current => recordMeal(current, meal, items, recordId, new Date().toISOString()), `已记录「${meal.name}」，库存已扣减。`)
    setFailed(!saved)
    if (saved) onSaved()
  }}>
    <DialogHeader><DialogTitle>开饭前，确认一下</DialogTitle><DialogDescription>本次吃「{meal.name}」。调整实际用量，确认后会记录这顿饭并扣减库存，{onBack ? '这顿只记在用餐记录里，不会新增常用搭配。' : '常用搭配保持不变。'}</DialogDescription></DialogHeader>
    <div className="space-y-4">{items.map((item, index) => {
      const food = store.pantry.foods.find(food => food.id === item.foodId)
      return <div key={item.foodId} className="space-y-2"><Label htmlFor={`eat-${item.foodId}`}>{food?.name ?? '食物已删除'} · 本次用量（{item.unit}）</Label><Input autoFocus={index === 0} id={`eat-${item.foodId}`} type="number" inputMode="decimal" min="0.01" max={Math.min(1_000_000, food?.quantity ?? 0)} step="0.01" required value={item.quantity || ''} onChange={event => setItems(items.map(value => value.foodId === item.foodId ? { ...value, quantity: Number(event.target.value) } : value))} /><p className="text-xs text-muted-foreground">当前库存 {food?.quantity ?? 0} {food?.unit ?? item.unit}</p></div>
    })}</div>
    {reasons.length > 0 && <p role="alert" className="text-sm text-destructive">{reasons.join('；')}</p>}
    {failed && store.error && <p role="alert" className="text-sm text-destructive">{store.error}</p>}
    <DialogFooter>{onBack && <Button type="button" variant="ghost" disabled={store.pending} onClick={() => onBack(items)}>调整搭配</Button>}<Button type="button" variant="outline" disabled={store.pending} onClick={onClose}>先不吃</Button><Button type="submit" disabled={store.pending || store.blocked || reasons.length > 0}>{store.pending ? '正在记录…' : '确认开饭'}</Button></DialogFooter>
  </form>
}
