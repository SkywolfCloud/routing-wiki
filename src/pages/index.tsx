import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <span className={styles.heroBadge}>Bird / BGP 中文指南</span>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <p className={styles.heroDescription}>
            从理论到实践，一站式整理 Bird 配置、路由过滤、跨地域互联等真实经验，带你搭建可靠的自治系统。
          </p>
          <div className={styles.heroCtas}>
            <Link className={styles.heroPrimary} to="/beginner">
              开始入门
            </Link>
            <Link
              className={styles.heroSecondary}
              href="https://bird.xmsl.dev/"
              target="_blank"
              rel="noopener noreferrer">
              查看 Bird Wiki
            </Link>
          </div>
          <ul className={styles.heroHighlights}>
            <li>完整的入门到进阶路径</li>
            <li>覆盖过滤器、互联、运维等场景</li>
            <li>中文社区支持与最佳实践</li>
          </ul>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description="Bird / BGP 中文教程与实践指南">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
