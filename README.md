# Routing Wiki

Routing Wiki 是一个围绕 Bird / BGP 的中文知识库，使用 [Docusaurus](https://docusaurus.io/) 构建，旨在把零散的教程、配置经验与常用工具整理为易于维护的文档站点。

## 快速开始

```bash
pnpm install
pnpm run start
```

开发服务器默认运行在 `http://localhost:3000`，保存文档或源码后会自动热更新。

### 生产构建

```bash
pnpm run build   # 构建静态站点到 ./build
pnpm run serve   # 本地预览构建结果
```

生成的 `./build` 目录可直接部署到任意静态托管平台（如 Cloudflare Pages、Vercel、Netlify 等）。

## 项目结构

```
.
├── docs/                     # 文档根目录（Markdown/MDX）
│   ├── beginner/             # 「新手教程」章节内容
│   ├── misc/                 # 「杂项」工具与补充资料
│   ├── beginner.md           # 「新手教程」前言页
│   └── misc.md               # 「杂项」介绍页
├── src/
│   ├── components/           # 站点自定义组件（如首页卡片）
│   ├── pages/                # 自定义页面，首页位于 index.tsx
│   ├── css/                  # 全局或主题覆盖样式
│   └── plugins/theme/…       # Docusaurus 插件与主题扩展
├── static/                   # 不经打包的静态资源
├── langs/                    # 额外语法高亮配置（bird2、interfaces 等）
├── sidebars.ts               # 侧边栏手动配置
├── docusaurus.config.ts      # 站点配置（导航、主题、插件）
├── package.json / pnpm-lock.yaml
└── README.md
```

## 文档撰写约定

- 所有文档放在 `docs/` 下，支持 **Markdown** 与 **MDX**。
- 每篇文档都需要 Front Matter，常用字段：
  ```md
  ---
  title: 二、拉起一个 BGP 会话
  description: 快速与上游建立连接
  ---
  ```
- 「新手教程」与「杂项」等分开的系列拥有独立侧边栏：
  - 每个目录下 **与目录同名的 .md** 作为该章节的介绍页，并在 `sidebars.ts` 中作为分类的 `link: {type: 'doc', id: …}`。
  - 新增章节或文档后，记得同步更新 `sidebars.ts` 中的 `beginnerSidebar` 或 `miscSidebar`。
- 推荐使用 Docusaurus 的组件：
  - 提示块：`:::tip`、`:::note`、`:::caution` 等。
  - 代码块：在三引号后加上语言（如 `shell`、`bird2`）；若需语法高亮支持，可在 `langs/` 中添加对应 tmLanguage。

## 自定义导航与样式

- 顶部导航位于 `docusaurus.config.ts` 的 `themeConfig.navbar.items`
- 首页内容在 `src/pages/index.tsx` 与 `src/components/HomepageFeatures/`，如需调整文案或 CTA 请修改对应组件。
- 全局样式覆盖在 `src/css/` 与 `src/pages/index.module.css` 中完成。

## 贡献指南

欢迎通过 Issues / Pull Requests 贡献内容或反馈问题。提交前建议：

1. 运行 `pnpm run build` 确认页面可以成功构建；如有测试或 lint 任务也一并执行。
2. 检查文档 Front Matter 与侧边栏是否已同步更新。
3. 对 UI 调整附上截图或说明，便于 Review。

感谢为 Routing Wiki 添砖加瓦！
