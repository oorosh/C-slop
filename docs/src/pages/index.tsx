import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

const symbols = [
  { char: '@', name: 'Database' },
  { char: '$', name: 'Request' },
  { char: '#', name: 'Response' },
  { char: '>', name: 'Pipe' },
  { char: '?', name: 'Query' },
  { char: '!', name: 'Mutate' },
  { char: '~', name: 'Template' },
  { char: '^', name: 'Route' },
  { char: '&', name: 'Parallel' },
  { char: '_', name: 'Context' },
];

const features = [
  {
    icon: '~',
    title: 'Token-Minimal',
    description: 'Write web apps in 80% fewer tokens. Perfect for AI-assisted development and rapid prototyping.',
  },
  {
    icon: '>',
    title: 'Pipeline-First',
    description: 'Data flows naturally through pipe operators. No more callback hell or promise chains.',
  },
  {
    icon: '@',
    title: 'Built-in Database',
    description: 'First-class database operations. Query, filter, insert, update with single symbols.',
  },
  {
    icon: '^',
    title: 'Routes as Primitives',
    description: 'HTTP routes are language constructs. Define entire APIs in a few lines.',
  },
  {
    icon: '~',
    title: 'Inline Templates',
    description: 'Render HTML directly in your code. No separate template files needed.',
  },
  {
    icon: '!',
    title: 'Implicit Everything',
    description: 'Types, returns, async/await - all inferred. Focus on logic, not boilerplate.',
  },
];

const jsCode = `app.get('/users/:id', async (req, res) => {
  const user = await db.query(
    'SELECT * FROM users WHERE id = ?',
    [req.params.id]
  );
  res.json(user);
});

app.post('/users', async (req, res) => {
  const user = await db.query(
    'INSERT INTO users SET ?',
    req.body
  );
  res.status(201).json(user);
});`;

const cslopCode = `^/users/:id > @users[$.id] > #json

^/users + $.body > @users! > #201`;

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/syntax">
            Syntax Reference
          </Link>
        </div>

        <div className={styles.heroCode}>
          <div className={styles.heroCodeBlock}>
            <div><span className={styles.codeComment}>// Full REST endpoint in 1 line</span></div>
            <div>
              <span className={styles.codeSymbol}>^</span>
              <span className={styles.codeRoute}>/users/:id</span>
              {' '}<span className={styles.codeOperator}>&gt;</span>{' '}
              <span className={styles.codeSymbol}>@</span>
              <span className={styles.codeTable}>users</span>
              [$.id]{' '}
              <span className={styles.codeOperator}>&gt;</span>{' '}
              <span className={styles.codeSymbol}>#</span>
              <span className={styles.codeResponse}>json</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsSection() {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>80%</div>
            <div className={styles.statLabel}>Fewer Tokens</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>10</div>
            <div className={styles.statLabel}>Core Symbols</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>1</div>
            <div className={styles.statLabel}>Line APIs</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>0</div>
            <div className={styles.statLabel}>Boilerplate</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionTitle}>
          <h2>See the Difference</h2>
          <p>The same functionality, dramatically fewer tokens</p>
        </div>

        <div className={styles.comparisonGrid}>
          <div className={styles.codePanel}>
            <div className={styles.codePanelHeader}>
              <span className={styles.codePanelTitle}>JavaScript / Express</span>
              <span className={clsx(styles.tokenBadge, styles.tokenBadgeOld)}>~65 tokens</span>
            </div>
            <div className={styles.codePanelBody}>
              <CodeBlock language="javascript">{jsCode}</CodeBlock>
            </div>
          </div>

          <div className={styles.codePanel}>
            <div className={styles.codePanelHeader}>
              <span className={styles.codePanelTitle}>C-slop</span>
              <span className={clsx(styles.tokenBadge, styles.tokenBadgeNew)}>~12 tokens</span>
            </div>
            <div className={styles.codePanelBody}>
              <CodeBlock language="bash">{cslopCode}</CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SymbolsSection() {
  return (
    <section className={styles.symbolsSection}>
      <div className="container">
        <div className={styles.sectionTitle}>
          <h2>Learn 10 Symbols, Build Anything</h2>
          <p>Each symbol maps to a core web operation</p>
        </div>

        <div className={styles.symbolsGrid}>
          {symbols.map((symbol, idx) => (
            <div key={idx} className={styles.symbolCard}>
              <div className={styles.symbolChar}>{symbol.char}</div>
              <div className={styles.symbolName}>{symbol.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionTitle}>
          <h2>Built for the AI Era</h2>
          <p>Designed to maximize efficiency when working with LLMs</p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <div key={idx} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <div className={styles.featureTitle}>{feature.title}</div>
              <div className={styles.featureDesc}>{feature.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <h2 className={styles.ctaTitle}>Ready to write less code?</h2>
        <p className={styles.ctaSubtitle}>
          Get started with C-slop and build your next web app in record time.
        </p>
        <div className={styles.installCommand}>
          <code>npm install -g cslop</code>
        </div>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            Read the Docs
          </Link>
          <Link
            className="button button--secondary button--lg"
            href="https://github.com/c-slop/c-slop">
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Token-Minimal Web Language"
      description="Write web apps in 80% fewer tokens. A programming language designed for maximum efficiency.">
      <HomepageHeader />
      <main>
        <StatsSection />
        <ComparisonSection />
        <SymbolsSection />
        <FeaturesSection />
        <CTASection />
      </main>
    </Layout>
  );
}
