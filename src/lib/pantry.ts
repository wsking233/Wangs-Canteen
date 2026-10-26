import { INVENTORY_KEY, parseInventory, validateFood, validQuantity, addStock, type Food } from './inventory.ts'

export { INVENTORY_KEY as PANTRY_KEY }
export interface MealItem { foodId: string; quantity: number; unit: string }
export interface Combination { id: string; name: string; items: MealItem[] }
export interface MealRecord {
  id: string
  combinationId: string
  name: string
  eatenAt: string
  cancelledAt?: string
  items: { foodId: string; name: string; quantity: number; unit: string }[]
}
export interface Pantry { version: 3; foods: Food[]; combinations: Combination[]; records: MealRecord[] }

export function validateRecord(record: MealRecord): void {
  if (!record || typeof record.eatenAt !== 'string' || !Number.isFinite(Date.parse(record.eatenAt)) || typeof record.combinationId !== 'string') throw new Error('用餐记录格式不正确。')
  if (record.cancelledAt !== undefined && (typeof record.cancelledAt !== 'string' || !Number.isFinite(Date.parse(record.cancelledAt)))) throw new Error('撤销时间格式不正确。')
  validateCombination({ id: record.id, name: record.name, items: record.items })
  record.items.forEach(item => { if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 40) throw new Error('用餐记录缺少食物名称。') })
}

export function validateCombination(meal: Combination): void {
  if (!meal || typeof meal.id !== 'string' || !meal.id || typeof meal.name !== 'string' || !meal.name.trim() || meal.name.length > 60 || !Array.isArray(meal.items) || meal.items.length === 0 || meal.items.length > 50) throw new Error('请为搭配命名，并选择至少一种食物。')
  const ids = new Set<string>()
  for (const item of meal.items) {
    if (!item || typeof item.foodId !== 'string' || !item.foodId || !validQuantity(item.quantity) || item.quantity === 0 || typeof item.unit !== 'string' || !item.unit.trim() || item.unit.length > 8 || ids.has(item.foodId)) throw new Error('搭配中每项食物只能出现一次，用量必须大于零且最多两位小数。')
    ids.add(item.foodId)
  }
}

export function parsePantry(raw: string | null): Pantry {
  if (raw === null) return { version: 3, foods: [], combinations: [], records: [] }
  const data = JSON.parse(raw)
  if (data?.version === 1) return { version: 3, foods: parseInventory(raw).foods, combinations: [], records: [] }
  if (!data || ![2, 3].includes(data.version) || !Array.isArray(data.foods) || !Array.isArray(data.combinations)) throw new Error('本机数据版本或格式不受支持，请先备份原始数据。')
  data.foods.forEach(validateFood)
  data.combinations.forEach(validateCombination)
  const records: MealRecord[] = data.version === 2 ? [] : data.records
  if (!Array.isArray(records)) throw new Error('用餐记录格式不正确。')
  records.forEach(validateRecord)
  const pantry: Pantry = { version: 3, foods: data.foods, combinations: data.combinations, records }
  for (const items of [pantry.foods, pantry.combinations, pantry.records]) {
    if (new Set(items.map(item => item.id)).size !== items.length) throw new Error('本机数据包含重复标识。')
  }
  return pantry
}

export function availability(meal: Combination, foods: Food[]): string[] {
  return meal.items.flatMap(item => {
    const food = foods.find(food => food.id === item.foodId)
    if (!food) return ['有食物已被删除，请编辑搭配']
    if (food.unit !== item.unit) return [`${food.name}的单位已修改，请重新确认用量`]
    if (!food.enabled) return [`${food.name}已停用`]
    if (food.quantity < item.quantity) return [`${food.name}还差 ${Math.round((item.quantity - food.quantity) * 100) / 100} ${item.unit}`]
    return []
  })
}

export function savePantry(storage: Pick<Storage, 'getItem' | 'setItem'>, previousRaw: string | null, pantry: Pantry): string {
  const raw = JSON.stringify(pantry)
  parsePantry(raw)
  if (storage.getItem(INVENTORY_KEY) !== previousRaw) throw new Error('数据已在其他页面更新，请重新读取后再操作。')
  storage.setItem(INVENTORY_KEY, raw)
  return raw
}

export function chooseMeal(pantry: Pantry, previousId?: string, random: () => number = Math.random): Combination | null {
  const available = pantry.combinations.filter(meal => !availability(meal, pantry.foods).length)
  const alternatives = available.filter(meal => meal.id !== previousId)
  const candidates = alternatives.length ? alternatives : available
  if (!candidates.length) return null
  const recent = pantry.records.filter(record => !record.cancelledAt).sort((a, b) => Date.parse(b.eatenAt) - Date.parse(a.eatenAt)).slice(0, 3)
  const weights = candidates.map(meal => 1 / (1 + recent.reduce((penalty, record) => penalty + (record.combinationId === meal.id ? 3 : 0) + record.items.filter(item => meal.items.some(part => part.foodId === item.foodId)).length * 0.5, 0)))
  let position = random() * weights.reduce((sum, weight) => sum + weight, 0)
  for (let i = 0; i < candidates.length; i++) { position -= weights[i]; if (position < 0) return candidates[i] }
  return candidates[candidates.length - 1]
}

export function recordMeal(pantry: Pantry, meal: Combination, items: MealItem[], recordId: string, eatenAt: string): Pantry {
  if (pantry.records.some(record => record.id === recordId)) throw new Error('这次用餐已记录，请勿重复确认。')
  const actual = { ...meal, items }
  validateCombination(actual)
  const reasons = availability(actual, pantry.foods)
  if (reasons.length) throw new Error(reasons.join('；'))
  const record: MealRecord = { id: recordId, combinationId: pantry.combinations.some(value => value.id === meal.id) ? meal.id : '', name: meal.name, eatenAt, items: items.map(item => ({ ...item, name: pantry.foods.find(food => food.id === item.foodId)!.name })) }
  validateRecord(record)
  return { ...pantry, foods: pantry.foods.map(food => {
    const item = items.find(item => item.foodId === food.id)
    return item ? { ...food, quantity: (Math.round(food.quantity * 100) - Math.round(item.quantity * 100)) / 100 } : food
  }), records: [record, ...pantry.records] }
}

export function cancelMeal(pantry: Pantry, recordId: string, cancelledAt: string): Pantry {
  const record = pantry.records.find(record => record.id === recordId)
  if (!record) throw new Error('用餐记录已不存在。')
  if (record.cancelledAt) throw new Error('这顿饭已撤销，不会再次返还库存。')
  const cancelled = { ...record, cancelledAt }
  validateRecord(cancelled)
  const foods = [...pantry.foods]
  for (const item of record.items) {
    const index = foods.findIndex(food => food.id === item.foodId)
    if (index >= 0) {
      if (foods[index].unit !== item.unit) throw new Error(`${item.name}的库存单位已从${item.unit}改为${foods[index].unit}，请先改回原单位再撤销。`)
      foods[index] = addStock(foods[index], item.quantity)
    } else {
      const restored: Food = { id: item.foodId, name: item.name, unit: item.unit, quantity: item.quantity, enabled: true, note: '由撤销用餐记录恢复' }
      validateFood(restored)
      foods.push(restored)
    }
  }
  return { ...pantry, foods, records: pantry.records.map(item => item.id === recordId ? cancelled : item) }
}
