import { useRef, useState } from 'react'
import { Download, Upload, Database, FileJson, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createBackup, MAX_BACKUP_BYTES, parseBackup } from '@/lib/backup'
import { PANTRY_KEY, parsePantry, type Pantry } from '@/lib/pantry'
import type { PantryStore } from '@/lib/use-pantry'

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DataPage({ store }: { store: PantryStore }) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ pantry: Pantry; file: string } | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reading, setReading] = useState(false)
  function exportBackup(rawOnly = false) {
    try {
      const raw = localStorage.getItem(PANTRY_KEY)
      const stamp = new Date().toISOString().replaceAll(':', '-')
      if (rawOnly) {
        if (raw === null) throw new Error('当前没有可导出的原始数据。')
        download(raw, `wangs-canteen-raw-${stamp}.txt`, 'text/plain;charset=utf-8')
      } else { download(createBackup(parsePantry(raw), new Date().toISOString()), `wangs-canteen-${stamp}.json`, 'application/json') }
      setNotice('备份文件已生成，请确认已保存到你的设备。')
      setError('')
    } catch (error) { setError(error instanceof Error ? error.message : '导出失败，请检查浏览器权限。') }
  }
  return <>
    <section className="max-w-xl space-y-3"><Badge variant="secondary"><Database aria-hidden="true" /> 我的数据</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">把小食堂，备份好。</h1><p className="text-sm leading-6 text-muted-foreground">数据属于你。换设备或清理浏览器前，先留一份副本。</p></section>
    {(error || notice) && <p role={error ? 'alert' : 'status'} className={error ? 'text-sm text-destructive' : 'text-sm text-primary'}>{error || notice}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardHeader><Download aria-hidden="true" className="mb-2 size-6 text-primary" /><CardTitle>导出备份</CardTitle><CardDescription>包含库存、常用搭配与全部用餐记录（包括已撤销记录）。</CardDescription></CardHeader><CardContent className="space-y-3"><Button disabled={store.blocked} onClick={() => exportBackup()}><Download />导出备份</Button><p className="text-xs leading-5 text-muted-foreground">保存为 JSON 文件，不会发送到服务器。</p>{store.blocked && <Button variant="outline" onClick={() => exportBackup(true)}>导出原始数据用于恢复</Button>}</CardContent></Card>
      <Card><CardHeader><Upload aria-hidden="true" className="mb-2 size-6 text-primary" /><CardTitle>从备份恢复</CardTitle><CardDescription>先读取和检查文件，预览内容后再确认替换本机数据。</CardDescription></CardHeader><CardContent className="space-y-3"><input ref={input} type="file" accept=".json,.txt,application/json,text/plain" aria-label="选择备份文件" className="sr-only" onChange={async event => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        setPreview(null); setConfirmed(false); setError(''); setNotice(''); setReading(true)
        try {
          if (file.size > MAX_BACKUP_BYTES) throw new Error('文件超过 20 MB，请选择较小的备份。')
          const pantry = parseBackup(await file.text())
          setPreview({ pantry, file: file.name })
        } catch (error) { setError(error instanceof Error ? error.message : '文件读取失败。') }
        finally { setReading(false) }
      }} /><Button variant="outline" disabled={reading || store.pending} onClick={() => input.current?.click()}><Upload />{reading ? '正在检查文件…' : '选择备份文件'}</Button><p className="text-xs leading-5 text-muted-foreground">支持本应用备份和旧版库存数据，最大 20 MB。</p></CardContent></Card>
    </div>
    {preview && <Card className="border-primary/30" aria-label="备份导入预览"><CardHeader><div className="flex items-start gap-3"><FileJson aria-hidden="true" className="size-5 shrink-0 text-primary" /><div className="min-w-0"><CardTitle className="text-lg">先确认，再恢复</CardTitle><CardDescription className="mt-2 break-all">{preview.file}</CardDescription></div></div></CardHeader><CardContent className="space-y-5"><dl className="grid grid-cols-3 gap-2 text-center">{[[preview.pantry.foods.length, '食物'], [preview.pantry.combinations.length, '搭配'], [preview.pantry.records.length, '用餐记录']].map(([value, label]) => <div key={label} className="rounded-lg bg-secondary p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>)}</dl><p className="text-sm leading-6 text-muted-foreground">这会替换当前浏览器中的全部食物、搭配和记录，不会与现有数据合并。建议先导出当前数据；导入本身不会重新执行用餐扣减或撤销。</p><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />我知道这将替换本机数据，确认使用这份备份。</label><div className="flex flex-wrap gap-3"><Button disabled={!confirmed || store.pending} onClick={async () => { if (await store.restore(preview.pantry)) { setPreview(null); setConfirmed(false); setError(''); setNotice('备份已恢复，可以继续使用小食堂。') } }}>确认导入并替换</Button><Button variant="outline" disabled={store.pending} onClick={() => { setPreview(null); setConfirmed(false) }}>取消导入</Button></div></CardContent></Card>}
    <aside className="flex items-start gap-3 rounded-xl bg-secondary p-5"><ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" /><div className="space-y-1"><p className="text-sm font-medium">本地保存，自己掌握</p><p className="text-xs leading-6 text-muted-foreground">当前没有账户或云同步。备份文件含食物与用餐信息，请保存在自己的设备上。数据损坏时可先导出原始内容，再选择可用备份恢复。</p></div></aside>
  </>
}
