# Wang’s Canteen

个人食物与餐食搭配工具：记下家里还有什么，保存喜欢的餐食组合，决定今天吃什么，并记录用餐与食物消耗。

技术栈：React、TypeScript、Vite、Tailwind CSS v4、shadcn/ui（New York）、Lucide。通用组件只从 shadcn/ui 引入，避免视觉风格混杂。

## 启动

Node.js 22（最低 22.12）；版本见 `.nvmrc`。Cloud 环境先执行 `source scripts/cloud-setup.sh`。

```bash
npm ci
npm run dev
# 访问 http://localhost:5173/Wangs-Canteen/
```

## 检查与构建

修改源码后先执行 `npm run format` 统一格式，再运行检查。

```bash
npm run check
npm run preview
```

`check` 执行格式检查、Oxlint、严格类型检查、领域单测和生产构建。`preview` 预览已构建的产物。

关键生产页面的浏览器回归已固化在 `tests/e2e/`：

```bash
npx playwright install chromium
npm run test:e2e
```

测试使用独立浏览器上下文和生产预览端口 4174，覆盖库存、常用搭配、推荐/开饭/撤销、记录修正、备份恢复、并发保存、存储失败、主题和四种宽度，以及长文本、键盘弹窗和两套主题的自动可访问性规则。若环境已有 Chromium，可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`。CI 优先使用 runner 现有的 Chrome/Chromium，无可用浏览器时才安装，并在上传 Pages 产物前运行这些测试；失败时保留诊断文件 7 天。

## 项目文档

- [第一阶段目标与验收标准](docs/phase-one.md)
- [UI 选型、官方来源和复用规范](docs/ui-guidelines.md)

## 当前功能

- 自己搭一顿：临时选择多个食物、确认实际用量，不必保存常用搭配。
- 今天吃什么：从库存足够的搭配中推荐、换一个、确认实际用量并扣减库存。
- 用餐记录：名称/食物搜索、最近 7 天筛选、分批加载、修正实际用量/时间/名称、按差额调整库存、撤销返还，记录快照刷新后保留。
- 我的数据：完整 JSON 备份、文件导入预览与替换确认、旧版数据升级、损坏数据原文导出与恢复。
- 常用搭配：多食物及每餐用量、保存/编辑/删除、库存可用性检查。
- 食物库存：新增、编辑、补货、停用和删除确认；可设置补货提醒线，快速筛选待补货食物。
- 支持半份等小数数量，按名称和备注搜索、按可用状态筛选；主页提供补货快捷入口。
- 导航：手机底部入口与安全区适配，桌面顶部入口；支持页面标题、返回/前进和主标题焦点。
- 主题：浅色/深色/跟随系统，记住本机偏好并在标签页间同步。
- 使用 localStorage 持久化，刷新后保留；支持多标签页同步，存储失败时不虚报成功。
- 空库存提供添加引导，异常数据不会自动覆盖。

数据只保存在当前浏览器设备；清除站点数据会丢失，不提供跨设备同步。已支持库存、常用搭配、推荐及确认用餐扣减；已支持记录撤销、近期重复权重及本地数据备份恢复。

开发方向、数据规则及验收标准见 [第二阶段计划](docs/phase-two.md)。

## 验收清单

- 新增炸鸡 8 块和意面 0.5 份；意面补货 0.25 份后为 0.75 份，刷新后保留。
- 将食物数量改为 0 或停用，不再显示在“可搭配”中。
- 搜索无结果时可清除筛选；删除必须确认，取消保留食物。
- 存储失败提示错误，原库存保持不变；损坏数据不会被清空覆盖。
- 320 / 768 / 1440px 无横向溢出，深浅主题和弹窗表单可用。

## 自动部署到 GitHub Pages

仓库：`wsking233/Wangs-Canteen`；正式发布分支：`main`。

- PR：自动执行 `npm ci --include=dev`、代码检查、领域单测、TypeScript、生产构建和浏览器回归，不发布。
- 推送或合并到 `main`：检查通过后自动上传 `dist/` 并部署 Pages；新提交会取消同分支尚未完成的旧流水线，避免过时任务阻塞最新版本。
- 可在 Actions 中手动运行 Deploy to GitHub Pages；只有 main 分支可以部署。
- 检查或构建失败将阻止部署，已上线版本保留。

工作流：`.github/workflows/pages.yml`。使用 GitHub 内置 `GITHUB_TOKEN` 和 OIDC，不需要额外部署密钥。发布权限仅赋予 deploy job，PR 不持有发布权限。

仓库 Settings → Pages → Build and deployment → Source 必须选择 **GitHub Actions**。如 `github-pages` 环境设置了人工审批，需调整为允许 main 自动部署，才能做到全自动。

Vite `base` 为 `/Wangs-Canteen/`，适配项目 Pages 子路径。部署成功后的地址为 https://wsking233.github.io/Wangs-Canteen/ 。是否已上线以 Actions 实际结果为准。

Cloud 安装脚本为 `scripts/cloud-setup.sh`；环境安装和维护命令均可使用 `bash scripts/cloud-setup.sh`。平台配置仍需在环境界面保存，仓库脚本不代替平台配置。
