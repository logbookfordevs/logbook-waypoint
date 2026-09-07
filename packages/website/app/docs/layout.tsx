import { DocsNavigation } from '@/components/docs-navigation';

export default function DocumentationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="main-content" className="docs-shell">
      <DocsNavigation />
      <div className="docs-reading-surface">{children}</div>
    </main>
  );
}
