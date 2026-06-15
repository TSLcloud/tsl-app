import { TopBar } from "./TopBar";

export function PageLayout({ title, subtitle, children, actions }) {
  return (
    <div className="flex flex-col min-h-screen flex-1 min-w-0">
      <TopBar title={title} subtitle={subtitle} />
      <main className="flex-1 p-6">
        {actions && <div className="flex items-center justify-between mb-5">{actions}</div>}
        {children}
      </main>
    </div>
  );
}
