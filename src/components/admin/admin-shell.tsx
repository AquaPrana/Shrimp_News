"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChartNoAxesCombined,
  CalendarDays,
  ChevronDown,
  Clock3,
  FilePlus2,
  FileText,
  KeyRound,
  LogOut,
  Menu,
  Search,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import type { AdminSession } from "@/lib/admin-auth";

const navigation = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Add Article", href: "/admin/articles/new", icon: FilePlus2 },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Price Ticker", href: "/admin/ticker", icon: TrendingUp },
  { label: "Analytics", href: "/admin/analytics", icon: ChartNoAxesCombined },
  { label: "Subscribers", href: "/admin/subscribers", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

const pageNames: Record<string, string> = {
  "/admin": "Overview",
  "/admin/articles": "Articles",
  "/admin/articles/new": "Add Article",
  "/admin/events": "Events",
  "/admin/events/new": "Add Event",
  "/admin/ticker": "Price Ticker",
  "/admin/analytics": "Analytics",
  "/admin/subscribers": "Subscribers",
  "/admin/profile": "My Profile",
  "/admin/settings": "Settings",
  "/admin/settings/account": "Account Settings",
  "/admin/settings/password": "Change Password",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SN";
}

function titleForPath(pathname: string) {
  if (pageNames[pathname]) return pageNames[pathname];
  if (/^\/admin\/articles\/[^/]+\/edit$/.test(pathname)) return "Edit Article";
  if (/^\/admin\/events\/[^/]+\/edit$/.test(pathname)) return "Edit Event";
  return "Administration";
}

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const initial = window.setTimeout(() => setNow(new Date()), 0);
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pageTitle = titleForPath(pathname);
  const breadcrumbs = useMemo(() => {
    if (pathname === "/admin") return ["Dashboard", "Overview"];
    return ["Dashboard", pageTitle];
  }, [pathname, pageTitle]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-root min-h-screen bg-[#f3f6fa] text-slate-900 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className={`border-r border-slate-800 bg-[#07111f] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col ${mobileOpen ? "block" : "hidden lg:flex"}`}>
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="flex h-11 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/20">
              <Image src="/images/shrimp-news-logo.png" alt="Shrimp.News" width={96} height={34} className="h-auto w-full" priority />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-extrabold tracking-tight">Shrimp.News</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Administration</span>
            </span>
          </Link>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] text-slate-400">
            <span>Content Management System</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-bold text-slate-300">v1.0</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Admin navigation">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-cyan-400/15 text-cyan-200 shadow-sm ring-1 ring-cyan-300/15"
                    : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <Icon size={18} className={active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link href="/admin/profile" className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.06]">
            {admin.imageUrl ? (
              <img src={admin.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">
                {initials(admin.name)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{admin.name}</span>
              <span className="block truncate text-xs text-slate-400">Super Admin</span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
          <div className="flex h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden" aria-label="Toggle admin navigation">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                {breadcrumbs.map((item, index) => (
                  <span key={`${item}-${index}`} className="flex items-center gap-1.5">
                    {index ? <span>/</span> : null}<span>{item}</span>
                  </span>
                ))}
              </div>
              <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-900">{pageTitle}</h1>
            </div>

            <div className="hidden max-w-xs flex-1 md:block">
              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input aria-label="Search admin dashboard" placeholder="Search CMS…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100" />
              </label>
            </div>

            <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 xl:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Clock3 size={17} /></span>
              <span className="text-right text-xs leading-5">
                <span className="block font-bold text-slate-700">{now ? now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                <span className="block text-slate-500">{now ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
              </span>
            </div>

            <div ref={menuRef} className="relative">
              <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 shadow-sm transition hover:border-slate-300" aria-expanded={profileOpen}>
                {admin.imageUrl ? <img src={admin.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B4F7A] text-[10px] font-black text-white">{initials(admin.name)}</span>}
                <span className="hidden max-w-32 truncate text-sm font-bold text-slate-700 sm:block">{admin.name}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-bold">{admin.name}</p>
                    <p className="truncate text-xs text-slate-500">{admin.email}</p>
                  </div>
                  <div className="py-2">
                    <DropdownLink href="/admin/profile" icon={UserCircle}>My Profile</DropdownLink>
                    <DropdownLink href="/admin/settings/account" icon={Settings}>Account Settings</DropdownLink>
                    <DropdownLink href="/admin/settings/password" icon={KeyRound}>Change Password</DropdownLink>
                  </div>
                  <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50">
                    <LogOut size={16} />Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof UserCircle;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#0B4F7A]">
      <Icon size={16} className="text-slate-400" />{children}
    </Link>
  );
}
