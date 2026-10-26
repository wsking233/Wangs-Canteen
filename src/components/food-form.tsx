import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { validateFood, type Food } from '@/lib/inventory'

export function FoodForm({ food, onSave, onCancel }: { food?: Food; onSave: (food: Food) => Promise<boolean>; onCancel: () => void }) {
  const [name, setName] = useState(food?.name ?? '')
  const [unit, setUnit] = useState(food?.unit ?? '份')
  const [quantity, setQuantity] = useState(String(food?.quantity ?? ''))
  const [note, setNote] = useState(food?.note ?? '')
  const [enabled, setEnabled] = useState(food?.enabled ?? true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <form className="space-y-5" onSubmit={async event => {
      event.preventDefault()
      if (busy) return
      setBusy(true)
      try {
        const next = { id: food?.id ?? crypto.randomUUID(), name: name.trim(), unit: unit.trim(), quantity: quantity.trim() ? Number(quantity) : NaN, note: note.trim(), enabled }
        validateFood(next)
        if (!await onSave(next)) setError('保存未完成，请查看页面提示并重试。')
      } catch (error) { setError(error instanceof Error ? error.message : '保存失败，请重试。') }
      finally { setBusy(false) }
    }}>
      <DialogHeader><DialogTitle>{food ? '编辑食物' : '添加食物'}</DialogTitle><DialogDescription>记录家里已有的食物。数量支持半份等小数，单位可以自由填写。</DialogDescription></DialogHeader>
      <div className="space-y-2"><Label htmlFor="food-name">食物名称</Label><Input disabled={busy} id="food-name" value={name} onChange={e => setName(e.target.value)} maxLength={40} required placeholder="例如：炸鸡、意面、饺子" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="food-quantity">剩余数量</Label><Input disabled={busy} id="food-quantity" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" required value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="例如：2.5" /></div>
        <div className="space-y-2"><Label htmlFor="food-unit">单位</Label><Input disabled={busy} id="food-unit" value={unit} onChange={e => setUnit(e.target.value)} required maxLength={8} placeholder="份 / 块 / 个 / 包" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="food-note">备注（选填）</Label><Input disabled={busy} id="food-note" value={note} onChange={e => setNote(e.target.value)} maxLength={200} placeholder="例如：放在冷冻层第二格" /></div>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={busy} className="size-4 accent-primary" checked={enabled} onChange={e => setEnabled(e.target.checked)} />可用于搭配（关闭后保留库存）</label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>取消</Button><Button type="submit" disabled={busy}>{busy ? '正在保存…' : '保存食物'}</Button></DialogFooter>
    </form>
  )
}

export function RestockForm({ food, onSave, onCancel }: { food: Food; onSave: (amount: number) => Promise<boolean>; onCancel: () => void }) {
  const [amount, setAmount] = useState('')
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  return <form className="space-y-5" onSubmit={async event => { event.preventDefault(); if (busy) return; setBusy(true); try { setFailed(!await onSave(Number(amount))) } finally { setBusy(false) } }}>
    <DialogHeader><DialogTitle>补货 · {food.name}</DialogTitle><DialogDescription>当前剩余 {food.quantity} {food.unit}，填写本次新增数量。</DialogDescription></DialogHeader>
    <div className="space-y-2"><Label htmlFor="stock-amount">补货数量（{food.unit}）</Label><Input disabled={busy} id="stock-amount" type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="本次买了多少？" /></div>
    {failed && <p role="alert" className="text-sm text-destructive">补货未完成，请检查数量和页面提示。</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>取消</Button><Button type="submit" disabled={busy}>{busy ? '正在保存…' : '确认补货'}</Button></DialogFooter>
  </form>
}
