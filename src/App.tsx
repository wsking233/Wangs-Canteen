import { useState } from 'react'
import { ArrowRight, Check, CookingPot, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

function App() {
  const [dark, setDark] = useState(false)
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [open, setOpen] = useState(false)

  function toggleTheme() {
    document.documentElement.classList.toggle('dark', !dark)
    setDark(!dark)
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4">跳转到主要内容</a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
            <span className="rounded-xl bg-primary p-2.5 text-primary-foreground"><CookingPot aria-hidden="true" className="size-5" /></span>
            <span className="font-semibold tracking-tight">Wang’s Canteen<span className="mt-0.5 block text-xs font-normal text-muted-foreground">用一致的设计，开始每一步</span></span>
          </a>
          <Button variant="outline" size="icon" aria-label={dark ? '切换为浅色主题' : '切换为深色主题'} onClick={toggleTheme}>
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl space-y-10 px-5 py-10 sm:px-8 sm:py-16">
        <section className="max-w-2xl space-y-5">
          <Badge variant="secondary">第一阶段 · 前端基础</Badge>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">让每个界面，<br />拥有同一种温度。</h1>
          <p className="text-base leading-7 text-muted-foreground">自然、清爽、轻量。这是项目的 UI 基础展示页，用来验证统一的颜色、组件与交互；业务功能将在后续确定。</p>
          <Button asChild><a href="#components">查看基础组件 <ArrowRight aria-hidden="true" /></a></Button>
        </section>
        <Separator />
        <section id="components" aria-labelledby="components-heading" className="scroll-mt-6 space-y-5">
          <div><h2 id="components-heading" className="text-xl font-semibold">统一的组件语言</h2><p className="mt-1 text-sm text-muted-foreground">shadcn/ui 组件 · Tailwind CSS 样式 · Lucide 图标</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>操作与状态</CardTitle><CardDescription>使用现成的按钮变体，让操作层级保持清晰。</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button>打开交互示例 <ArrowRight aria-hidden="true" /></Button></DialogTrigger>
                    <DialogContent>
                      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); setSavedName(name.trim()); setOpen(false) }}>
                        <DialogHeader><DialogTitle>组件交互示例</DialogTitle><DialogDescription>体验弹窗、输入和反馈。此示例仅在当前页面临时保存。</DialogDescription></DialogHeader>
                        <div className="space-y-2"><Label htmlFor="example-name">展示名称</Label><Input id="example-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={40} placeholder="输入一个展示名称" /></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button><Button type="submit" disabled={!name.trim()}>保存示例</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" asChild><a href="#foundations">查看设计规范</a></Button>
                  <Button disabled>不可用操作</Button>
                </div>
                <div className="flex flex-wrap gap-2"><Badge>主要状态</Badge><Badge variant="secondary">辅助状态</Badge><Badge variant="outline">说明标签</Badge></div>
                <p role="status" className="min-h-5 text-sm text-muted-foreground">{savedName ? `已保存示例：${savedName}` : '打开交互示例，体验完整的输入与反馈。'}</p>
              </CardContent>
            </Card>
            <Card id="foundations">
              <CardHeader><CardTitle>清爽而克制的基础</CardTitle><CardDescription>通过共享设计变量统一风格，避免逐页定制。</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-3 gap-3">{[
                  ['bg-primary', '松绿色'], ['bg-secondary', '鼠尾草绿'], ['bg-background', '奶油白'],
                ].map(([color, label]) => <div key={label} className="space-y-2"><div className={`${color} h-14 rounded-lg border`} /><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
                <Separator />
                <ul className="space-y-3 text-sm text-muted-foreground">{['统一圆角与 4px 间距基准', '支持浅色与深色主题', '移动端单列，宽屏双列', '键盘焦点、弹窗焦点管理与表单标签'].map((item) => <li key={item} className="flex items-center gap-2"><Check aria-hidden="true" className="size-4 shrink-0 text-primary" />{item}</li>)}</ul>
              </CardContent>
            </Card>
          </div>
        </section>
        <footer className="border-t pt-6 text-sm text-muted-foreground">Wang’s Canteen · UI 基础展示，非正式业务页面</footer>
      </main>
    </>
  )
}

export default App
