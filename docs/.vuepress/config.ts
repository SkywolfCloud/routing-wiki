module.exports = {
    title: 'Bird Wiki',
    description: '一篇关于bird的百科（或者手册）',
    themeConfig: {
        sidebar: {
            "/quickstart/":[
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
    },
}