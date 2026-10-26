import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { editMeal, type MealRecord } from '@/lib/pantry'
import { fromLocalInput, toLocalInput } from '@/lib/dates'
import type { PantryStore } from '@/lib/use-pantry'

export function RecordForm({
  record,
  store,
  onClose,
}: {
  record: MealRecord
  store: PantryStore
  onClose: () => void
}) {
  const [name, setName] = useState(record.name)
  const [date, setDate] = useState(() => toLocalInput(record.eatenAt))
  const [items, setItems] = useState(record.items)
  const [error, setError] = useState('')
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        try {
          const eatenAt = fromLocalInput(date, record.eatenAt)
          const saved = await store.commit(
            (pantry) =>
              editMeal(
                pantry,
                record.id,
                { name: name.trim(), eatenAt, items: items.filter((item) => item.quantity > 0) },
                new Date().toISOString(),
              ),
            '用餐记录已修正，库存已按差额调整。',
          )
          if (saved) onClose()
          else setError('修改未完成，请检查下方提示。')
        } catch (error) {
          setError(error instanceof Error ? error.message : '修改失败，请重试。')
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>修正这顿饭</DialogTitle>
        <DialogDescription>
          只调整新旧用量的差额。数量填 0 可移除这一项，至少保留一种食物；常用搭配不会变化。
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="record-name">这顿叫什么</Label>
        <Input
          id="record-name"
          autoFocus
          disabled={store.pending}
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="record-time">用餐时间（本地时间）</Label>
        <Input
          id="record-time"
          type="datetime-local"
          disabled={store.pending}
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const food = store.pantry.foods.find((food) => food.id === item.foodId)
          const original = record.items.find((value) => value.foodId === item.foodId)!
          return (
            <div key={item.foodId} className="space-y-2">
              <Label htmlFor={`record-${item.foodId}`}>
                {item.name} · 实际用量（{item.unit}）
              </Label>
              <Input
                id={`record-${item.foodId}`}
                type="number"
                inputMode="decimal"
                disabled={store.pending}
                min="0"
                max="1000000"
                step="0.01"
                required
                value={item.quantity}
                onChange={(event) =>
                  setItems(
                    items.map((value) =>
                      value.foodId === item.foodId
                        ? { ...value, quantity: Number(event.target.value) }
                        : value,
                    ),
                  )
                }
              />
              <p className="text-xs leading-5 text-muted-foreground">
                原记录 {original.quantity} {original.unit}；
                {food
                  ? `当前库存 ${food.quantity} ${food.unit}`
                  : '这项食物已删除，减少用量时会恢复返还的部分'}
              </p>
            </div>
          )
        })}
      </div>
      {(error || store.error) && (
        <div role="alert" className="space-y-1 text-sm text-destructive">
          {error && <p>{error}</p>}
          {store.error && <p>{store.error}</p>}
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={store.pending} onClick={onClose}>
          取消修改
        </Button>
        <Button type="submit" disabled={store.pending}>
          {store.pending ? '正在保存…' : '保存记录修改'}
        </Button>
      </DialogFooter>
    </form>
  )
}
