export const PAGE_TITLES = {
  today: '今天吃什么',
  inventory: '我的库存',
  meals: '常用搭配',
  history: '用餐记录',
  data: '我的数据',
} as const
export type PageName = keyof typeof PAGE_TITLES
export interface AppRoute {
  page: PageName
  itemId?: string
}
export function parseRoute(hash: string): AppRoute {
  const [name, encodedId] = hash.replace(/^#/, '').split('/')
  const page: PageName = Object.hasOwn(PAGE_TITLES, name) ? (name as PageName) : 'today'
  let itemId: string | undefined
  if (encodedId && (page === 'today' || page === 'inventory')) {
    try {
      itemId = decodeURIComponent(encodedId)
    } catch {
      itemId = undefined
    }
  }
  return { page, itemId }
}
