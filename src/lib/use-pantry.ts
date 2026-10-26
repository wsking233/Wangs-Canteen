import { useCallback, useEffect, useRef, useState } from 'react'
import { PANTRY_KEY, parsePantry, savePantry, type Pantry } from './pantry'

interface Snapshot { pantry: Pantry; raw: string | null; error: string }
function read(): Snapshot {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(PANTRY_KEY)
    return { pantry: parsePantry(raw), raw, error: '' }
  } catch { return { pantry: { version: 3, foods: [], combinations: [], records: [] }, raw, error: '无法读取本机数据，可能是浏览器存储不可用或已有数据损坏。原数据未被覆盖，请保留站点数据并重新读取。' } }
}

export function usePantry() {
  const [snapshot, setSnapshot] = useState(read)
  const current = useRef(snapshot)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const saving = useRef(false)
  const reload = useCallback(() => {
    const next = read()
    current.current = next
    setSnapshot(next)
    setError('')
    setRevision(value => value + 1)
  }, [])
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === PANTRY_KEY || event.key === null) { reload(); setMessage('数据已与其他页面同步。') }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [reload])

  async function write(update: (pantry: Pantry) => Pantry, feedback: string, recovery = false): Promise<boolean> {
    if (saving.current) return false
    saving.current = true
    setPending(true)
    const expected = current.current
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const persist = () => {
        if (expected.error && !recovery) throw new Error('请先恢复读取数据，再进行修改。')
        if (current.current.raw !== expected.raw) throw new Error('等待保存期间数据已更新，请检查最新内容后重试。')
        const pantry = update(expected.pantry)
        const raw = savePantry(localStorage, expected.raw, pantry)
        const next = { pantry, raw, error: '' }
        current.current = next
        setSnapshot(next)
        setMessage(feedback)
        setError('')
        return true
      }
      return navigator.locks ? await navigator.locks.request(`${PANTRY_KEY}.write`, { signal: controller.signal }, persist) : persist()
    } catch (error) { setMessage(''); setError(controller.signal.aborted ? '等待其他页面保存超时，请重试或关闭未完成保存的页面。' : error instanceof Error ? error.message : '保存失败，请检查浏览器存储权限。'); return false }
    finally { clearTimeout(timeout); saving.current = false; setPending(false) }
  }

  return { pantry: snapshot.pantry, blocked: Boolean(snapshot.error), error: snapshot.error || error, message, revision, pending, reload, commit: (update: (pantry: Pantry) => Pantry, feedback: string) => write(update, feedback), restore: (pantry: Pantry) => write(() => pantry, '备份已导入，本机数据已替换。', true), clearError: () => setError('') }
}
export type PantryStore = ReturnType<typeof usePantry>
