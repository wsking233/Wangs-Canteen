# Wang’s Canteen

第一阶段：统一 UI 与前端基础。业务范围稍后确定，当前首页是组件与主题展示页。

技术栈：React、TypeScript、Vite、Tailwind CSS v4、shadcn/ui（New York）、Lucide。通用组件只从 shadcn/ui 引入，避免视觉风格混杂。

## 启动

Node.js 22（最低 22.12）；版本见 `.nvmrc`。Cloud 环境先执行 `source scripts/cloud-setup.sh`。

```bash
npm ci
npm run dev
# 访问 http://localhost:5173/Wangs-Canteen/
```

## 检查与构建

```bash
npm run check
npm run preview
```

`check` 执行 Oxlint、TypeScript 和生产构建。`preview` 预览已构建的产物。

## 项目文档

- [第一阶段目标与验收标准](docs/phase-one.md)
- [UI 选型、官方来源和复用规范](docs/ui-guidelines.md)

## 人工验收清单

- 在 320px、768px、1440px 视口检查无横向溢出。
- 切换深浅主题，检查文本、输入框、边框与按钮可见性。
- 仅使用键盘：打开弹窗，检查焦点约束、Escape 关闭及关闭后焦点返回。
- 表单不能提交空白名称；有效提交关闭弹窗并显示结果；取消不改变结果。

当前示例数据仅保存在页面内存中，刷新会清空；没有后端与业务数据持久化。自动检查通过与否以实际运行结果为准，人工清单需要浏览器逐项验收。

## 本次验证记录（2026-10-26）

- `npm run check` 通过：代码检查、TypeScript、生产构建，无警告。
- Chromium 浏览器验证通过：320 / 768 / 1440px 无横向溢出；深浅主题背景切换；空白输入禁止提交；保存反馈；取消不覆盖已有结果；弹窗焦点约束；Escape 关闭与焦点返回；无页面运行错误。
- 已检查桌面和 320px 手机截图。浏览器验证使用临时 Playwright 工具，未引入项目运行依赖。
- 视觉方向仍可在业务确定后微调；本次未实现业务功能。

## 自动部署到 GitHub Pages

仓库：`wsking233/Wangs-Canteen`；正式发布分支：`main`。

- PR：自动执行 `npm ci --include=dev`、代码检查、TypeScript 和生产构建，不发布。
- 推送或合并到 `main`：检查通过后自动上传 `dist/` 并部署 Pages。
- 可在 Actions 中手动运行 Deploy to GitHub Pages；只有 main 分支可以部署。
- 检查或构建失败将阻止部署，已上线版本保留。

工作流：`.github/workflows/pages.yml`。使用 GitHub 内置 `GITHUB_TOKEN` 和 OIDC，不需要额外部署密钥。发布权限仅赋予 deploy job，PR 不持有发布权限。

仓库 Settings → Pages → Build and deployment → Source 必须选择 **GitHub Actions**。如 `github-pages` 环境设置了人工审批，需调整为允许 main 自动部署，才能做到全自动。

Vite `base` 为 `/Wangs-Canteen/`，适配项目 Pages 子路径。部署成功后的地址为 https://wsking233.github.io/Wangs-Canteen/ 。是否已上线以 Actions 实际结果为准。

Cloud 安装脚本为 `scripts/cloud-setup.sh`；环境安装和维护命令均可使用 `bash scripts/cloud-setup.sh`。平台配置仍需在环境界面保存，仓库脚本不代替平台配置。
