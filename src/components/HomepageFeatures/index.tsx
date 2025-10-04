import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const IconMap = {
  rocket: '🚀',
  setting: '⚙️',
  'list-format': '🗂️',
  comment: '💬',
} as const;

type FeatureIcon = keyof typeof IconMap;

type Cta = {label: string; to: string} | {label: string; href: string};

type FeatureItem = {
  title: string;
  icon: FeatureIcon;
  description: ReactNode;
  cta?: Cta;
};

const FeatureList: FeatureItem[] = [
  {
    title: '新手教程',
    icon: 'rocket',
    description: '快速学习如何配置和使用 Bird 路由软件。',
    cta: {label: '开始学习', to: '/beginner'},
  },
  {
    title: 'Bird配置',
    icon: 'setting',
    description: '深入了解 Bird 的各种配置选项和最佳实践。',
    cta: {label: '访问 Bird Wiki', href: 'https://bird.xmsl.dev/'},
  },
  {
    title: '过滤器',
    icon: 'list-format',
    description: '学习如何配置和使用 Bird 的过滤器功能。',
    cta: {label: '查看过滤器指南', to: '/beginner/connect-with-others/filters'},
  },
  {
    title: '社区支持',
    icon: 'comment',
    description: '加入我们的 TG 群获取帮助。',
    cta: {label: '加入社群', href: 'https://t.me/skywolf_wiki'},
  },
];

function isExternal(cta: Cta): cta is {label: string; href: string} {
  return 'href' in cta;
}

function Feature({title, icon, description, cta}: FeatureItem) {
  const glyph = IconMap[icon] ?? '•';
  const isDescriptionString = typeof description === 'string';
  return (
    <article className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.cardIcon} aria-hidden="true">
          {glyph}
        </span>
        <Heading as="h3" className={styles.cardHeading}>
          {title}
        </Heading>
      </div>
      <div className={styles.cardBody}>
        {isDescriptionString ? <p>{description}</p> : description}
      </div>
      {cta ? (
        <Link
          className={styles.cardCta}
          {...(isExternal(cta)
            ? {href: cta.href, target: '_blank', rel: 'noopener noreferrer'}
            : {to: cta.to})}>
          <span>{cta.label}</span>
          <span aria-hidden="true" className={styles.cardCtaIcon}>
            ↗
          </span>
        </Link>
      ) : null}
    </article>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            快速入口
          </Heading>
          <p className={styles.sectionSubtitle}>
            按照你的目标选择下一步，快速搭建 Bird / BGP 环境。
          </p>
        </div>
        <div className={styles.cardGrid}>
          {FeatureList.map((item) => (
            <Feature key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
