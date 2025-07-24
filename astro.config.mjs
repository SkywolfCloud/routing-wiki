// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import fs from "fs";
import mermaid from "astro-mermaid";
import rehypeExternalLinks from "rehype-external-links";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
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
            "beginner",
            "beginner/before",
            "beginner/bring-up-a-bgp-session",
            {
              label: "三、与他人连接",
              items: [
                "beginner/connect-with-others/introduction",
                "beginner/connect-with-others/concept",
                "beginner/connect-with-others/filters",
                "beginner/connect-with-others/lab",
                "beginner/connect-with-others/role",
              ],
            },
            {
              label: "四、多节点部署",
              items: [
                "beginner/multi-location/introduction",
                "beginner/multi-location/igp",
                "beginner/multi-location/ibgp",
                "beginner/multi-location/lab",
              ],
            },
            "beginner/after",
            "beginner/troubleshooting",
            "beginner/bring-home",
          ],
        },
        {
          label: "杂项",
          items: ["misc","misc/tools"],
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
      rehypeMathjax,
    ],
    remarkPlugins: [remarkMath],
  },
});
