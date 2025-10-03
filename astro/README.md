# Routing Wiki

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

Routing Wiki 是一个以 BGP 路由为核心的中文文档站点，旨在收集和分享有关网络路由的知识与实践经验。本站使用 [Astro](https://astro.build/) 搭配 [Starlight](https://starlight.astro.build/) 构建，内容遵循 [CC BY 4.0](LICENSE.md) 协议。

## 本地运行

安装依赖并启动开发服务器：

```bash
pnpm install
pnpm dev
```

打开浏览器访问 `http://localhost:4321` 即可查看本地站点。

## 构建与预览

```bash
pnpm build      # 生成静态站点到 ./dist
pnpm preview    # 本地预览构建结果
```

生成的 `./dist` 目录可直接部署到任意静态主机，或通过 Cloudflare Pages 等平台发布。

## 项目结构

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

文档内容位于 `src/content/docs/`，使用 Markdown/MDX 编写；图片存放在 `src/assets/`；公共静态资源位于 `public/`。

## 贡献

欢迎提交 issue 与 PR 共同完善文档。若有任何疑问或建议，也可以在 [GitHub Discussions](https://github.com/SkywolfCloud/routing-wiki/discussions) 中交流。

