const {docsearchPlugin} = require('@vuepress/plugin-docsearch')
const {defaultTheme} = require('vuepress')
const {viteBundler} = require('vuepress')
module.exports = {
    title: 'Bird Wiki',
    description: '一篇关于bird的百科（或者手册）',
    theme: defaultTheme({
        sidebar: {
            "/quickstart/": [
                '/quickstart/',
                '/quickstart/before.md',
                '/quickstart/player.md',
                '/quickstart/idc.md',
                '/quickstart/multi_location.md',
                '/quickstart/after.md'
            ],
            "/bird/": [
                '/bird/',
                '/bird/介绍/',
                {
                    text: "配置",
                    link: "/bird/配置/",
                    children: [
                        '/bird/配置/README.md',
                        '/bird/配置/BGP.md'
                    ]
                },
                '/bird/过滤器/'
            ]
        },
        navbar: [
            {
                text: "快速开始",
                link: "/quickstart/"
            }
        ]
    }),
    bundler: viteBundler({
        viteOptions: {},
        vuePluginOptions: {},
    }),
    plugins: [
        docsearchPlugin({
            appId: "CNCUYMMRTL",
            apiKey: "1b7485a84d863a7b45eeccb6372c0b99",
            indexName: "skywolf",
            locales: {
                '/': {
                    placeholder: 'Search',
                },
            },
        }),
    ],
}