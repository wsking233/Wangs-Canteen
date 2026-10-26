import { useCallback, useEffect, useRef, useState } from 'react'
import { PANTRY_KEY, parsePantry, savePantry, type Pantry } from './pantry'

interface Snapshot { pantry: Pantry; raw: string | null; error: string }
function read(): Snapshot {
  try {
    const raw = localStorage.getItem(PANTRY_KEY)
    return { pantry: parsePantry(raw), raw, error: '' }
  } catch { return { pantry: { version: 2, foods: [], combinations: [] }, raw: null, error: '无法读取本机数据，可能是浏览器存储不可用或已有数据损坏。原数据未被覆盖，请保留站点数据并重新读取。' } }
}

export function usePantry() {
  const [snapshot, setSnapshot] = useState(read)
  const current = useRef(snapshot)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
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

  function commit(update: (pantry: Pantry) => Pantry, feedback: string): boolean {
    try {
      if (current.current.error) throw new Error('请先恢复读取数据，再进行修改。')
      const pantry = update(current.current.pantry)
      const raw = savePantry(localStorage, current.current.raw, pantry)
      const next = { pantry, raw, error: '' }
      current.current = next
      setSnapshot(next)
      setMessage(feedback)
      setError('')
      return true
    } catch (error) { setMessage(''); setError(error instanceof Error ? error.message : '保存失败，请检查浏览器存储权限。'); return false }
  }
  return { pantry: snapshot.pantry, blocked: Boolean(snapshot.error), error: snapshot.error || error, message, revision, reload, commit, clearError: () => setError('') }
}
export type PantryStore = ReturnType<typeof usePantry>
