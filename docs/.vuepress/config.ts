module.exports = {
    title: 'Bird Wiki',
    description: '一篇关于bird的百科（或者手册）',
    themeConfig: {
        sidebar: [
            '/介绍/README.md',
            {
                text: "配置",
                link: "/配置/",
                children: [
                    '/配置/README.md',
                    '/配置/Global.md',
                    '/配置/Protocol.md',
                    '/配置/Channel.md',
                    '/配置/Template.md'
                ]
            },
            '/BGP/',
            '/过滤器/'
        ]
    },
}