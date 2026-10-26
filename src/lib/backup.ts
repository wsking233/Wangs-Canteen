import { isTimestamp } from './validation.ts'
import { parsePantry, type Pantry } from './pantry.ts'
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024
export const BACKUP_FORMAT = 'wangs-canteen-backup'

export function parseBackup(text: string): Pantry {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error('文件超过 20 MB，请选择较小的备份。')
  const clean = text.trimStart()
  let value
  try {
    value = JSON.parse(clean)
  } catch {
    throw new Error('文件不是有效的 JSON，请重新选择原始备份文件。')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('备份内容格式不正确。')
  let pantry: Pantry
  if ('format' in value) {
    if (
      value.format !== BACKUP_FORMAT ||
      value.backupVersion !== 1 ||
      !isTimestamp(value.exportedAt)
    )
      throw new Error('备份来源或版本不受支持。')
    if (!value.data || typeof value.data !== 'object' || Array.isArray(value.data))
      throw new Error('备份缺少完整数据，请选择本应用导出的原始文件。')
    pantry = parsePantry(JSON.stringify(value.data))
  } else {
    pantry = parsePantry(clean)
  }
  if (
    pantry.foods.length > 10000 ||
    pantry.combinations.length > 10000 ||
    pantry.records.length > 50000
  )
    throw new Error('备份超出可处理数量（食物/搭配各 10,000 条，记录 50,000 条）。')
  return pantry
}

export function createBackup(pantry: Pantry, exportedAt: string): string {
  parsePantry(JSON.stringify(pantry))
  if (!isTimestamp(exportedAt)) throw new Error('备份时间不正确。')
  return JSON.stringify(
    { format: BACKUP_FORMAT, backupVersion: 1, exportedAt, data: pantry },
    null,
    2,
  )
}
