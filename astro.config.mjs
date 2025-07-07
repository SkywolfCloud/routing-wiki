// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import fs from "fs";
import mermaid from "astro-mermaid";
import rehypeExternalLinks from "rehype-external-links";
const birdLang = JSON.parse(
  fs.readFileSync("./langs/bird2.tmLanguage.json", "utf8")
);
const interfacesLang = JSON.parse(
  fs.readFileSync("./langs/interfaces.tmLanguage.json", "utf8")
);
// https://astro.build/config
export default defineConfig({
  integrations: [
    mermaid({
      autoTheme: true,
    }),
    starlight({
      title: "Routing Wiki",
      description: "一篇关于路由的百科（或者手册）",
      tableOfContents: { minHeadingLevel: 1, maxHeadingLevel: 3 },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/SkywolfCloud/routing-wiki",
        },
      ],
      sidebar: [
        {
          label: "新手教程",
          items: [
            { label: "前言", slug: "beginner" },
            { label: "一、开始之前", slug: "beginner/before" },
            {
              label: "二、拉起一个BGP会话",
              slug: "beginner/bring-up-a-bgp-session",
            },
            {
              label: "三、与他人连接",
              items: [
                { label: "简介", slug: "beginner/connect-with-others" },
                "beginner/connect-with-others/concept",
                "beginner/connect-with-others/filters",
                "beginner/connect-with-others/lab",
                "beginner/connect-with-others/role",
              ],
            },
            { label: "配置客户端", slug: "beginner/player" },
            { label: "IDC配置", slug: "beginner/idc" },
            { label: "多地部署", slug: "beginner/multi-location" },
            { label: "后续工作", slug: "beginner/after" },
          ],
        },
        {
          label: "Bird Wiki",
          link: "https://bird.xmsl.dev/",
        },
      ],
      expressiveCode: {
        shiki: {
          langs: [birdLang, interfacesLang],
        },
        defaultProps: {
          wrap: true,
        },
      },
    }),
  ],
  markdown: {
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          rel: ["noopener", "noreferrer"],
          target: "_blank",
        },
      ],
    ],
  },
});
