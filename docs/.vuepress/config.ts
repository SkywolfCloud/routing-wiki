module.exports = {
    title: 'Bird Wiki',
    description: '一篇关于bird的百科（或者手册）',
    themeConfig: {
        sidebar: {
            "/quickstart/":[
                '/quickstart/',
                '/quickstart/before.md',
                '/quickstart/player.md',
                '/quickstart/multi_location.md',
                '/quickstart/idc.md',
                '/quickstart/after.md'
            ],
            "/specific/": [
                '/specific/',
                '/specific/介绍/',
                {
                    text: "配置",
                    link: "/specific/配置/",
                    children: [
                        '/specific/配置/README.md',
                        '/specific/配置/Global.md',
                        '/specific/配置/Protocol.md',
                        '/specific/配置/Channel.md',
                        '/specific/配置/Template.md'
                    ]
                },
                '/specific/BGP/',
                '/specific/过滤器/'
            ]
        }
    },
}