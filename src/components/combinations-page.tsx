import { useRef, useState } from 'react'
import { Plus, Pencil, Trash2, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CombinationForm } from './combination-form'
import { availability, type Combination } from '@/lib/pantry'
import type { PantryStore } from '@/lib/use-pantry'

type Editor = { kind: 'add' } | { kind: 'edit' | 'delete'; meal: Combination }
export function CombinationsPage({ store }: { store: PantryStore }) {
  const { pantry, blocked, error } = store
  const [editor, setEditor] = useState<Editor | null>(null)
  const [onlyReady, setOnlyReady] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  function open(next: Editor) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    store.clearError()
    setEditor(next)
  }
  async function save(meal: Combination) {
    const saved = await store.commit(
      (current) => ({
        ...current,
        combinations: current.combinations.some((item) => item.id === meal.id)
          ? current.combinations.map((item) => (item.id === meal.id ? meal : item))
          : [...current.combinations, meal],
      }),
      `已保存「${meal.name}」。`,
    )
    if (saved) setEditor(null)
    return saved
  }
  const ready = pantry.combinations.filter((meal) => !availability(meal, pantry.foods).length)
  const shown = onlyReady ? ready : pantry.combinations
  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-xl space-y-3">
          <Badge variant="secondary">我的常用搭配</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            一顿饭，可以这样搭。
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            不用写菜谱。记住喜欢的组合，下次少纠结一点。
          </p>
        </div>
        <Button
          ref={addButton}
          disabled={blocked || !pantry.foods.length}
          onClick={() => open({ kind: 'add' })}
        >
          <Plus />
          新建搭配
        </Button>
      </section>
      {!blocked && !pantry.foods.length ? (
        <Card className="border-dashed py-10 text-center">
          <CardContent className="space-y-4">
            <UtensilsCrossed aria-hidden="true" className="mx-auto size-10 text-primary" />
            <h2 className="text-xl font-semibold">先准备几样食物</h2>
            <p className="text-sm text-muted-foreground">有了库存，就能把它们搭配成一顿饭。</p>
            <Button asChild>
              <a href="#inventory">去添加食物</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        !blocked && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {pantry.combinations.length} 个搭配 · {ready.length} 个库存足够
              </p>
              <Button
                variant={onlyReady ? 'secondary' : 'outline'}
                size="sm"
                aria-pressed={onlyReady}
                onClick={() => setOnlyReady(!onlyReady)}
              >
                只看库存足够
              </Button>
            </div>
            {!shown.length ? (
              <Card className="border-dashed py-10 text-center">
                <CardContent className="space-y-4">
                  <UtensilsCrossed aria-hidden="true" className="mx-auto size-10 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {onlyReady ? '暂时没有库存足够的搭配' : '保存你的第一顿搭配'}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {onlyReady
                      ? '可以先补货，或调整搭配里的用量。'
                      : '例如炸鸡 2 块，加上意面 1 份。食物可以出现在多个搭配里。'}
                  </p>
                  {onlyReady ? (
                    <Button variant="outline" onClick={() => setOnlyReady(false)}>
                      查看全部搭配
                    </Button>
                  ) : (
                    <Button onClick={() => open({ kind: 'add' })}>
                      <Plus />
                      新建第一个搭配
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {shown.map((meal) => {
                  const reasons = availability(meal, pantry.foods)
                  return (
                    <Card role="group" key={meal.id} aria-label={`搭配：${meal.name}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="min-w-0 wrap-anywhere text-lg">
                            {meal.name}
                          </CardTitle>
                          <Badge
                            variant={reasons.length ? 'outline' : 'secondary'}
                            className="shrink-0"
                          >
                            {reasons.length ? '待准备' : '库存足够'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          {meal.items.map((item) => (
                            <li
                              key={item.foodId}
                              className="flex items-start justify-between gap-3"
                            >
                              <span className="min-w-0 wrap-anywhere">
                                {pantry.foods.find((food) => food.id === item.foodId)?.name ??
                                  '已删除的食物'}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                {item.quantity} {item.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {reasons.length > 0 && (
                          <p className="rounded-lg bg-secondary p-3 text-xs leading-6 text-muted-foreground">
                            {reasons.join('；')}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {!reasons.length && (
                            <Button asChild size="sm">
                              <a href={`#today/${encodeURIComponent(meal.id)}`}>就吃这个</a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`编辑搭配${meal.name}`}
                            onClick={() => open({ kind: 'edit', meal })}
                          >
                            <Pencil />
                            编辑搭配
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto"
                            aria-label={`删除搭配${meal.name}`}
                            onClick={() => open({ kind: 'delete', meal })}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )
      )}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !store.pending) setEditor(null)
        }}
      >
        <DialogContent
          showCloseButton={!store.pending}
          className="max-h-[85dvh] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            ;(opener.current?.isConnected ? opener.current : addButton.current)?.focus()
          }}
        >
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {editor?.kind === 'add' && (
            <CombinationForm foods={pantry.foods} onSave={save} onCancel={() => setEditor(null)} />
          )}
          {editor?.kind === 'edit' && (
            <CombinationForm
              key={editor.meal.id}
              meal={editor.meal}
              foods={pantry.foods}
              onSave={save}
              onCancel={() => setEditor(null)}
            />
          )}
          {editor?.kind === 'delete' && (
            <>
              <DialogHeader>
                <DialogTitle>删除「{editor.meal.name}」？</DialogTitle>
                <DialogDescription>只删除搭配，不会修改食物库存。</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" disabled={store.pending} onClick={() => setEditor(null)}>
                  保留搭配
                </Button>
                <Button
                  variant="destructive"
                  disabled={store.pending}
                  onClick={async () => {
                    if (
                      await store.commit(
                        (current) => ({
                          ...current,
                          combinations: current.combinations.filter(
                            (meal) => meal.id !== editor.meal.id,
                          ),
                        }),
                        '已删除搭配，库存保持不变。',
                      )
                    )
                      setEditor(null)
                  }}
                >
                  确认删除搭配
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
