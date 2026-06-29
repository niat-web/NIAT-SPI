"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, GraduationCap, Building2, UserCog, LogOut, Menu, X,
  User, Database, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { ROLE_LABELS, type Role } from "@/lib/constants";

interface NavItem { href: string; label: string; icon: React.ReactNode }

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      {icon} {label}
    </Link>
  );
}

export default function Sidebar({
  name, email, role, canManage,
}: { name: string; email: string; role: Role; canManage: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isSuperAdmin = role === "superadmin";

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/students", label: "Students", icon: <GraduationCap size={18} /> },
    { href: "/dashboard/campuses", label: "Campuses", icon: <Building2 size={18} /> },
  ];
  const adminNav: NavItem[] = canManage
    ? [
        { href: "/admin/users", label: "Manage Users", icon: <UserCog size={18} /> },
        { href: "/admin/campuses", label: "Manage Campuses", icon: <Building2 size={18} /> },
      ]
    : [];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/staff-login");
    router.refresh();
  }

  const Item = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link href={item.href} onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100",
        )}>
        {item.icon} {item.label}
      </Link>
    );
  };

  const Inner = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <LogoMark size={36} />
        <div>
          <p className="font-extrabold tracking-tight text-gray-900 leading-tight">NIAT <span className="text-[#F25C05]">SPI</span></p>
          <p className="text-[11px] text-gray-400">Staff Console</p>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {nav.map((i) => <Item key={i.href} item={i} />)}
        {adminNav.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Administration</p>
            {adminNav.map((i) => <Item key={i.href} item={i} />)}
          </>
        )}
      </nav>
      <div className="border-t border-gray-100 p-3 relative">
        <button onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
            <p className="text-[11px] text-gray-400 truncate">{ROLE_LABELS[role]}</p>
          </div>
          <ChevronRight size={16} className={cn("text-gray-400 shrink-0 transition-transform", menuOpen && "rotate-90")} />
        </button>

        {menuOpen && (
          <>
            {/* click-away */}
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            {/* menu opens to the right of the profile section */}
            <div className="absolute z-50 left-full bottom-3 ml-2 w-52 rounded-xl border border-gray-200 bg-white shadow-xl py-1.5">
              <MenuLink href="/dashboard/profile" icon={<User size={15} />} label="Edit Profile"
                onClick={() => { setMenuOpen(false); setOpen(false); }} />
              {isSuperAdmin && (
                <MenuLink href="/dashboard/bigquery" icon={<Database size={15} />} label="BigQuery Check"
                  onClick={() => { setMenuOpen(false); setOpen(false); }} />
              )}
              <div className="my-1 border-t border-gray-100" />
              <button onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={15} /> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <Logo size={28} />
        <button onClick={() => setOpen(true)} className="p-2"><Menu size={20} /></button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 p-1 text-gray-400"><X size={18} /></button>
            {Inner}
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-gray-200 h-[100dvh] sticky top-0">{Inner}</aside>
    </>
  );
}
