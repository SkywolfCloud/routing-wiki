import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkRfcLink from "./src/plugins/remark-rfc-linker";
import BirdLanguage from "./langs/bird2.tmLanguage.json";
import InterfacesLanguage from "./langs/interfaces.tmLanguage.json";
import rehypeExternalLinks from "rehype-external-links";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { PluginOptions as SearchLocalPluginOptions } from "@easyops-cn/docusaurus-search-local";
import rehypeExpressiveCode, {
  RehypeExpressiveCodeOptions,
} from "rehype-expressive-code";

const config: Config = {
  title: "Routing Wiki",
  tagline: "一篇关于路由的百科（或者手册）",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://routing.wiki",
  baseUrl: "/",

  organizationName: "routing-wiki",
  projectName: "routing-wiki",

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans"],
  },

  markdown: {
    mermaid: true,
  },

  themes: [
    "@docusaurus/theme-mermaid",
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,

        // For Docs using Chinese, it is recomended to set:
        language: ["en", "zh"],

        // Customize the keyboard shortcut to focus search bar (default is "mod+k"):
        // searchBarShortcutKeymap: "s", // Use 'S' key
        // searchBarShortcutKeymap: "ctrl+shift+f", // Use Ctrl+Shift+F

        // If you're using `noIndex: true`, set `forceIgnoreNoIndex` to enable local index:
        // forceIgnoreNoIndex: true,
      } satisfies SearchLocalPluginOptions,
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          beforeDefaultRehypePlugins: [
            // [
            //   rehypeShiki,
            //   {
            //     themes: {
            //       light: "catppuccin-latte",
            //       dark: "catppuccin-macchiato",
            //     },
            //     langs: [
            //       ...(Object.keys(bundledLanguages) as BundledLanguage[]),
            //       InterfacesLanguage,
            //       BirdLanguage,
            //     ],
            //   } satisfies RehypeShikiOptions,
            // ],
            [
              rehypeExpressiveCode,
              {
                themeCssSelector: (theme, _context) => {
                  // console.log(theme, context);
                  if (theme.name === "github-light") {
                    return "[data-theme='light']";
                  }
                  if (theme.name === "github-dark") {
                    return "[data-theme='dark']";
                  }
                },
                plugins: [pluginLineNumbers()],
                defaultProps: {
                  // 默认显示行号
                  showLineNumbers: true,
                  wrap: true,
                },
                shiki: {
                  langs: [BirdLanguage, InterfacesLanguage],
                },
                // options for rehype-expressive-code
              } satisfies RehypeExpressiveCodeOptions,
            ],
          ],
          remarkPlugins: [remarkMath, remarkRfcLink],
          rehypePlugins: [
            rehypeKatex,
            [
              rehypeExternalLinks,
              {
                rel: ["noopener", "noreferrer"],
                target: "_blank",
              },
            ],
          ],
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Routing Wiki",
      logo: {
        alt: "Routing Wiki Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "beginnerSidebar",
          position: "left",
          label: "Bird 新手教程",
        },

        {
          type: "docSidebar",
          sidebarId: "miscSidebar",
          position: "left",
          label: "杂项",
        },
        {
          href: "https://bird.xmsl.dev/",
          label: "Bird Wiki",
          position: "left",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "导航",
          items: [
            {
              label: "Bird 新手教程",
              to: "/beginner",
            },
            {
              label: "杂项",
              to: "/misc",
            },
          ],
        },
        {
          title: "社区",
          items: [
            {
              label: "Telegram",
              href: "https://t.me/skywolf_wiki",
            },
          ],
        },
        {
          title: "更多",
          items: [
            {
              label: "Bird Wiki",
              href: "https://bird.xmsl.dev/",
            },
            {
              label: "GitHub",
              href: "https://github.com/SkywolfCloud/routing-wiki",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Skywolf Inc`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    stylesheets: [
      {
        href: "https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css",
        type: "text/css",
        integrity:
          "sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM",
        crossorigin: "anonymous",
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;
