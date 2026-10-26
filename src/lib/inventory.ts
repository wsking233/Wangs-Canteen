export const INVENTORY_KEY = 'wangs-canteen.inventory.v1'
export const MAX_QUANTITY = 1_000_000

export interface Food {
  id: string
  name: string
  unit: string
  quantity: number
  enabled: boolean
  note: string
}

export interface Inventory {
  version: 1
  foods: Food[]
}

export function validQuantity(value: number): boolean {
  const scaled = value * 100
  const rounded = Math.round(scaled)
  return Number.isFinite(value) && value >= 0 && value <= MAX_QUANTITY && (value === 0 || rounded >= 1) && Math.abs(scaled - rounded) <= Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4
}

export function validateFood(food: Food): void {
  if (!food.id || typeof food.id !== 'string' || typeof food.name !== 'string' || !food.name.trim() || food.name.length > 40 || typeof food.unit !== 'string' || !food.unit.trim() || food.unit.length > 8 || !validQuantity(food.quantity) || typeof food.enabled !== 'boolean' || typeof food.note !== 'string' || food.note.length > 200) {
    throw new Error('请填写食物名称和单位，数量需为 0–1,000,000，最多两位小数。')
  }
}

export function parseInventory(raw: string | null): Inventory {
  if (raw === null) return { version: 1, foods: [] }
  const data = JSON.parse(raw) as Inventory
  if (!data || data.version !== 1 || !Array.isArray(data.foods)) throw new Error('库存数据格式不受支持。')
  data.foods.forEach(validateFood)
  if (new Set(data.foods.map(food => food.id)).size !== data.foods.length) throw new Error('库存数据包含重复标识。')
  return data
}

export function addStock(food: Food, amount: number): Food {
  if (!validQuantity(amount) || amount === 0) throw new Error('补货数量必须大于 0，最多两位小数。')
  const result = { ...food, quantity: (Math.round(food.quantity * 100) + Math.round(amount * 100)) / 100 }
  validateFood(result)
  return result
}

export function isAvailable(food: Food): boolean {
  return food.enabled && food.quantity > 0
}

export function saveInventory(storage: Pick<Storage, 'getItem' | 'setItem'>, previousRaw: string | null, foods: Food[]): string {
  const raw = JSON.stringify({ version: 1, foods })
  parseInventory(raw)
  if (storage.getItem(INVENTORY_KEY) !== previousRaw) throw new Error('库存已在其他页面更新，请重新读取后再操作。')
  storage.setItem(INVENTORY_KEY, raw)
  return raw
}
