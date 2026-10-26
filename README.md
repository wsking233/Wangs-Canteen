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

```bash
npm run check
npm run preview
```

`check` 执行 Oxlint、库存领域单测、TypeScript 和生产构建。`preview` 预览已构建的产物。

## 项目文档

- [第一阶段目标与验收标准](docs/phase-one.md)
- [UI 选型、官方来源和复用规范](docs/ui-guidelines.md)

## 当前功能

- 今天吃什么：从库存足够的搭配中推荐、换一个、确认实际用量并扣减库存。
- 用餐记录：名称/食物搜索、最近 7 天筛选、分批加载、撤销并返还库存，记录快照刷新后保留。
- 常用搭配：多食物及每餐用量、保存/编辑/删除、库存可用性检查。
- 食物库存：新增、编辑、补货、停用和删除确认。
- 支持半份等小数数量，按名称和备注搜索、按可用状态筛选。
- 使用 localStorage 持久化，刷新后保留；支持多标签页同步，存储失败时不虚报成功。
- 空库存提供添加引导，异常数据不会自动覆盖。

数据只保存在当前浏览器设备；清除站点数据会丢失，不提供跨设备同步。已支持库存、常用搭配、推荐及确认用餐扣减；已支持记录撤销和近期重复权重；数据备份将继续迭代。

开发方向、数据规则及验收标准见 [第二阶段计划](docs/phase-two.md)。

## 验收清单

- 新增炸鸡 8 块和意面 0.5 份；意面补货 0.25 份后为 0.75 份，刷新后保留。
- 将食物数量改为 0 或停用，不再显示在“可搭配”中。
- 搜索无结果时可清除筛选；删除必须确认，取消保留食物。
- 存储失败提示错误，原库存保持不变；损坏数据不会被清空覆盖。
- 320 / 768 / 1440px 无横向溢出，深浅主题和弹窗表单可用。

## 自动部署到 GitHub Pages

仓库：`wsking233/Wangs-Canteen`；正式发布分支：`main`。

- PR：自动执行 `npm ci --include=dev`、代码检查、库存领域单测、TypeScript 和生产构建，不发布。
- 推送或合并到 `main`：检查通过后自动上传 `dist/` 并部署 Pages。
- 可在 Actions 中手动运行 Deploy to GitHub Pages；只有 main 分支可以部署。
- 检查或构建失败将阻止部署，已上线版本保留。

工作流：`.github/workflows/pages.yml`。使用 GitHub 内置 `GITHUB_TOKEN` 和 OIDC，不需要额外部署密钥。发布权限仅赋予 deploy job，PR 不持有发布权限。

仓库 Settings → Pages → Build and deployment → Source 必须选择 **GitHub Actions**。如 `github-pages` 环境设置了人工审批，需调整为允许 main 自动部署，才能做到全自动。

Vite `base` 为 `/Wangs-Canteen/`，适配项目 Pages 子路径。部署成功后的地址为 https://wsking233.github.io/Wangs-Canteen/ 。是否已上线以 Actions 实际结果为准。

Cloud 安装脚本为 `scripts/cloud-setup.sh`；环境安装和维护命令均可使用 `bash scripts/cloud-setup.sh`。平台配置仍需在环境界面保存，仓库脚本不代替平台配置。
