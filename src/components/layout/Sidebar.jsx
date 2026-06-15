import { NavLink, useLocation } from "react-router-dom";
import { cx } from "../../lib/utils";

const NAV = [
  { label: "Home",        path: "/",           icon: "⌂",  end: true },
  { label: "ReXI",        icon: "◈",  children: [
    { label: "Production",  path: "/rexi/prod" },
    { label: "Inventory",   path: "/rexi/inventory" },
  ]},
  { label: "Lab",         icon: "⚗",  children: [
    { label: "Production",  path: "/lab/prod" },
    { label: "Inventory",   path: "/lab/inventory" },
  ]},
  { label: "Ventilation", icon: "≋",  children: [
    { label: "Production",  path: "/ventilation/prod" },
    { label: "Inventory",   path: "/ventilation/inventory" },
  ]},
  { label: "Tailor / MS", icon: "✂",  children: [
    { label: "Production",  path: "/tailorms/prod" },
    { label: "T. Inventory",path: "/tailorms/tailor-inventory" },
    { label: "MS Inventory",path: "/tailorms/ms-inventory" },
  ]},
  { label: "Stylist",     icon: "✦",  children: [
    { label: "Production",  path: "/stylist/prod" },
    { label: "Inventory",   path: "/stylist/inventory" },
  ]},
  { label: "Final Prod",  icon: "▣",  children: [
    { label: "Production",  path: "/final/prod" },
    { label: "Inventory",   path: "/final/inventory" },
  ]},
  { label: "Analytics",   path: "/analytics",  icon: "◉" },
  { label: "Admin",       path: "/admin",       icon: "⚙" },
];

function NavItem({ item }) {
  const location = useLocation();
  const isParentActive = item.children?.some(c => location.pathname.startsWith(c.path));

  if (item.children) {
    return (
      <div>
        <div className={cx(
          "flex items-center gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-widest rounded",
          isParentActive ? "text-brand-300" : "text-ink-faint"
        )}>
          <span className="text-base">{item.icon}</span>
          {item.label}
        </div>
        <div className="ml-4 border-l border-surface-3 pl-3 flex flex-col gap-0.5">
          {item.children.map(c => (
            <NavLink key={c.path} to={c.path}
              className={({ isActive }) => cx(
                "block px-2 py-1.5 text-sm rounded transition-colors",
                isActive ? "text-ink bg-brand-500/10 border-l-2 border-brand-500 -ml-px pl-3"
                         : "text-ink-muted hover:text-ink hover:bg-surface-2"
              )}>
              {c.label}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink to={item.path} end={item.end}
      className={({ isActive }) => cx(
        "flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors",
        isActive ? "text-ink bg-brand-500/10 font-medium" : "text-ink-muted hover:text-ink hover:bg-surface-2"
      )}>
      <span className="text-base">{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="w-52 shrink-0 bg-surface-DEFAULT border-r border-surface-3 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-5 border-b border-surface-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center text-white font-bold text-xs">T</span>
          <span className="font-semibold text-ink tracking-wide">TSL</span>
        </div>
        <p className="text-[10px] text-ink-faint mt-1">Hair Production Tracker</p>
      </div>
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {NAV.map((item, i) => <NavItem key={i} item={item} />)}
      </nav>
    </aside>
  );
}
