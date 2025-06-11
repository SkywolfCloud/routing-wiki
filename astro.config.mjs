// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Routing Wiki',
			description: '一篇关于路由的百科（或者手册）',
			social: [
				{ 
					icon: 'github', 
					label: 'GitHub', 
					href: 'https://github.com/SkywolfCloud/routing-wiki' 
				}
			],
			sidebar: [
				{
					label: '快速开始',
					items: [
						{ label: '概述', slug: 'quickstart' },
						{ label: '准备工作', slug: 'quickstart/before' },
						{ label: '配置客户端', slug: 'quickstart/player' },
						{ label: 'IDC配置', slug: 'quickstart/idc' },
						{ label: '多地部署', slug: 'quickstart/multi-location' },
						{ label: '后续工作', slug: 'quickstart/after' },
					],
				},
				{
					label: 'Bird Wiki',
					link: 'https://bird.xmsl.dev/',
				},
			],
		}),
	],
});
