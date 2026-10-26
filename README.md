# 小王食堂 · Wang's Canteen

移动端优先的独立 React Web App。目前仅提供欢迎页，使用 React、TypeScript、Vite，无 UI 框架、后端、数据库或认证。

## 本地开发

需要 Node.js 22（最低 22.12）和 npm。使用 nvm 时先运行 `nvm install && nvm use`。

```bash
npm ci               # 按 package-lock.json 安装依赖
npm run dev          # http://localhost:5173/Wangs-Canteen/
npm run build        # TypeScript 检查 + 静态构建，输出 dist/
npm run preview      # http://localhost:4173/Wangs-Canteen/
```

需要调整依赖或首次生成锁文件时使用 `npm install`，提交更新后的 `package-lock.json`。开发服务默认绑定 `0.0.0.0`，方便 Cloud 端口预览。

## 可复用 Codex Cloud 环境

仓库：`wsking233/Wangs-Canteen`。环境名称建议：`Wangs-Canteen · Node 22`。

在 Codex Cloud 环境设置中：

1. 关联本仓库，选择 Node.js 22；工作目录设置为仓库根目录。
2. 安装脚本设置为 `bash scripts/cloud-setup.sh`。
3. 维护脚本同样设置为 `bash scripts/cloud-setup.sh`，使缓存环境按锁文件恢复依赖并重新验证构建。
4. 允许安装阶段访问 npm registry（`registry.npmjs.org`）；不需要密钥或额外服务。
5. 运行环境测试，确认安装和构建通过后，点击界面中的保存/发布操作。

如果镜像默认不是 Node.js 22，脚本会通过 npm 把 Node.js 22 安装到被忽略的 `.cloud-tools/` 中。**安装脚本子进程不会改变后续终端的 PATH**：后续独立终端先运行 `source scripts/cloud-setup.sh`，或在环境配置中把仓库绝对路径下的 `.cloud-tools/node_modules/.bin` 加入 PATH。优先直接选择 Node.js 22 运行时。npm 缓存位于项目 `.npm-cache/`，适配主目录不可写的 Cloud 沙箱。

该脚本可重复执行：有锁文件时使用 `npm ci --include=dev`，无锁文件时使用 `npm install --include=dev`，最后执行 `npm run build`；失败立即退出。不要把开发服务放进安装脚本，开发时另行运行 `npm run dev`。

仓库内的脚本和文档不能代替 Cloud 平台保存/发布配置。当前会话没有 Cloud 环境配置写入或发布接口，因此平台发布需要用户按上述设置完成。

## GitHub Pages

Vite `base` 固定为 `/Wangs-Canteen/`。工作流位于 `.github/workflows/pages.yml`，推送至 `main` 或手动触发时，使用 Node.js 22、`npm ci`、`npm run build`，然后上传并部署 `dist/`。

在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。若仓库默认分支不是 `main`，同步修改工作流触发分支。首次部署可能需要通过 `github-pages` 环境的审批规则。

部署成功后的预期地址：<https://wsking233.github.io/Wangs-Canteen/>。此地址不是部署成功的证明；请以 Actions 的部署结果为准。

验证记录见 [docs/validation.md](docs/validation.md)。
