# 小王食堂开发约定

- 使用 Node.js 22（最低 22.12）、npm、React、TypeScript、Vite。
- 当前范围仅为移动端优先的静态欢迎页；未经明确要求不要增加库存、点餐等业务功能，也不要添加 UI 框架、后端、数据库、认证或复杂架构。
- 首次准备 Cloud 环境：`source scripts/cloud-setup.sh`。后续独立 shell 若默认不是 Node 22，先执行该命令或 `nvm use`。
- 安装依赖用 `npm ci`；主动调整依赖时用 `npm install`，同时提交 package-lock.json。
- 开发服务：`npm run dev`，访问 `/Wangs-Canteen/`；提交前运行 `npm run build`。
- 保留 Vite base `/Wangs-Canteen/`，构建产物为 dist，不提交依赖或构建产物。
- 不把密钥放入代码或 VITE_ 变量；该项目不需要密钥。
