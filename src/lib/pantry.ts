import { INVENTORY_KEY, parseInventory, validateFood, validQuantity, type Food } from './inventory.ts'

export { INVENTORY_KEY as PANTRY_KEY }
export interface MealItem { foodId: string; quantity: number; unit: string }
export interface Combination { id: string; name: string; items: MealItem[] }
export interface Pantry { version: 2; foods: Food[]; combinations: Combination[] }

export function validateCombination(meal: Combination): void {
  if (!meal || typeof meal.id !== 'string' || !meal.id || typeof meal.name !== 'string' || !meal.name.trim() || meal.name.length > 60 || !Array.isArray(meal.items) || meal.items.length === 0 || meal.items.length > 50) throw new Error('请为搭配命名，并选择至少一种食物。')
  const ids = new Set<string>()
  for (const item of meal.items) {
    if (!item || typeof item.foodId !== 'string' || !item.foodId || !validQuantity(item.quantity) || item.quantity === 0 || typeof item.unit !== 'string' || !item.unit.trim() || item.unit.length > 8 || ids.has(item.foodId)) throw new Error('搭配中每项食物只能出现一次，用量必须大于零且最多两位小数。')
    ids.add(item.foodId)
  }
}

export function parsePantry(raw: string | null): Pantry {
  if (raw === null) return { version: 2, foods: [], combinations: [] }
  const data = JSON.parse(raw) as Pantry | { version: 1 }
  if (data?.version === 1) return { version: 2, foods: parseInventory(raw).foods, combinations: [] }
  if (!data || data.version !== 2 || !Array.isArray(data.foods) || !Array.isArray(data.combinations)) throw new Error('本机数据版本或格式不受支持，请先备份原始数据。')
  data.foods.forEach(validateFood)
  data.combinations.forEach(validateCombination)
  if (new Set(data.foods.map(food => food.id)).size !== data.foods.length || new Set(data.combinations.map(meal => meal.id)).size !== data.combinations.length) throw new Error('本机数据包含重复标识。')
  return data
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
