# 小王食堂开发约定

- 使用 Node.js 22（最低 22.12）、npm、React、TypeScript、Vite。
- 用户已授权连续按阶段迭代：库存、搭配、推荐、用餐记录与扣减，逐阶段验证后提交 main 并确认 Pages 部署。使用 localStorage 和现有 UI，不引入后端、数据库、认证或复杂架构。当前持续迭代的计划与进度见 docs/autonomous-development.md。
- 首次准备 Cloud 环境：`source scripts/cloud-setup.sh`。后续独立 shell 若默认不是 Node 22，先执行该命令或 `nvm use`。
- 安装依赖用 `npm ci`；主动调整依赖时用 `npm install`，同时提交 package-lock.json。
- 开发服务：`npm run dev`，访问 `/Wangs-Canteen/`；提交前运行 `npm run build`。
- 保留 Vite base `/Wangs-Canteen/`，构建产物为 dist，不提交依赖或构建产物。
- 不把密钥放入代码或 VITE_ 变量；该项目不需要密钥。

- 用户已授权统一 UI 基础：采用 shadcn/ui New York、Tailwind CSS v4、Lucide；优先复用现有官方组件，避免引入多套 UI 风格。
- PR 执行检查；推送 main 后由 GitHub Actions 自动构建并部署 GitHub Pages。
