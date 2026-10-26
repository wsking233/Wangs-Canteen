export function toLocalInput(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
export function fromLocalInput(input: string, previous?: string): string {
  if (previous && input === toLocalInput(previous)) return previous
  const date = new Date(input)
  if (!Number.isFinite(date.getTime()) || toLocalInput(date.toISOString()) !== input)
    throw new Error('用餐时间不正确，请重新选择日期和时间。')
  return date.toISOString()
}
