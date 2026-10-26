# UI 选型与复用约定

## 选择

采用 **shadcn/ui New York + Tailwind CSS v4 + Lucide**。shadcn/ui 是复制源码到项目的组件方案，不是安装后自动升级的黑盒组件包；组件维护需要随项目进行。

它已有按钮、表单、弹窗、导航等一致的组件样式，适合在业务尚未确定时建立轻量基础。通过主题变量即可调整品牌色，减少逐组件改样式。Radix 是其底层交互依赖，Lucide 仅提供图标，均不额外引入一套视觉风格。

| 方案 | 特点 | 本项目结论 |
| --- | --- | --- |
| shadcn/ui | 基于 Tailwind，源码可控，组件及页面区块可按需复用 | 采用，适合当前的轻量工程基础 |
| Ant Design | 企业后台组件完整，复杂表格和表单成熟 | 业务未确定，暂不引入后台视觉和体系 |
| MUI | Material Design 组件体系成熟 | 不同时引入 Material 视觉与额外样式体系 |

以上是匹配当前约束的取舍，并非性能或市场份额测评。

## 官方来源

- [shadcn/ui 文档](https://ui.shadcn.com/docs)
- [组件目录](https://ui.shadcn.com/docs/components)
- [页面区块](https://ui.shadcn.com/blocks)：业务明确后优先选择同一来源的区块，再调整主题。
- [Tailwind 的 Vite 集成](https://tailwindcss.com/docs/installation/using-vite)
- [Lucide](https://lucide.dev/)

现有七个组件于 2026-10-26 从 [官方 New York v4 源码](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui) 引入，保留官方样式和交互，只将 `cn` 与内部 Button 导入路径改为本项目别名。许可证位于 `vendor/shadcn-ui/LICENSE`。这些是引入时的源码副本，不会自动跟随上游 main 更新。

## 文件职责

- `src/index.css`：Tailwind 入口、语义色、字体与圆角，是调整主题的入口。
- `src/components/ui/`：官方基础组件，尽量保留原有 API 与变体。
- `src/components/`：未来复用的项目组合组件。
- `src/lib/utils.ts`：`cn()` 合并条件类名与 Tailwind 冲突类。
- `components.json`：组件生成器配置。

页面不要直接使用具体品牌色值，优先使用 `bg-primary`、`bg-card`、`border-border` 等语义类。间距沿用 Tailwind 默认尺度，常用 `gap-2/3/4/6/8`；卡片与弹窗使用官方默认圆角。

默认字号以可读性为先，中文正文建议 14–16px；主按钮用于最重要的动作，其余使用 outline、secondary 或 ghost。图标统一 Lucide，纯图标按钮必须提供 `aria-label`。

## 增加组件

先检查项目是否已有组件，再检查官方组件目录；只添加当前页面需要的组件。例如：

```bash
npx shadcn@latest add select
```

命令需要访问官方 registry。添加后检查新增依赖、导入别名、主题兼容性和锁文件，再执行 `npm run check`。不要无检查地覆盖项目中已修改的组件。需要页面区块时同样优先使用 shadcn 官方 Blocks，不跨来源拼接整套界面。

新增页面必须考虑加载、空数据、错误与成功反馈；新增通用组件检查键盘操作、标签、焦点、禁用状态以及深浅主题。主题支持持久化的浅色、深色和跟随系统；刷新保留本机偏好，并同步同源标签页的选择。
