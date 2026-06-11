// app/dashboard/_components/DashboardShell.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  FolderKanban,
  Receipt,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Counts {
  clients: number;
  projets: number;
  devis: number;
  factures: number;
}

interface Props {
  children: React.ReactNode;
  counts: Counts;
}

function NavBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto text-[10px] font-semibold bg-white/15 text-white/70 rounded-full px-1.5 py-0.5 min-w-[18px] text-center tabular-nums">
      {count}
    </span>
  );
}

export default function DashboardShell({ children, counts }: Props) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  const closeDrawer = () => {
    setOpen(false);
    setTimeout(() => setVisible(false), 300);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const navLinks = [
    {
      href: "/dashboard",
      label: "Accueil",
      icon: LayoutDashboard,
      count: null,
      exact: true,
    },
    {
      href: "/dashboard/clients",
      label: "Clients",
      icon: Users,
      count: counts.clients,
      exact: false,
    },
    {
      href: "/dashboard/projets",
      label: "Projets",
      icon: FolderKanban,
      count: counts.projets,
      exact: false,
    },
    {
      href: "/dashboard/devis",
      label: "Devis",
      icon: FileText,
      count: counts.devis,
      exact: false,
    },
    {
      href: "/dashboard/factures",
      label: "Factures",
      icon: Receipt,
      count: counts.factures,
      exact: false,
    },
  ];

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div
      className="min-h-screen flex text-white"
      style={{
        background:
          "linear-gradient(135deg, #0a1628 0%, #0d2147 30%, #1a3a6e 60%, #2563c4 85%, #4a9eff 100%)",
      }}
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 flex-col bg-white/10 backdrop-blur-xl border-r border-white/20 fixed top-0 left-0 h-full z-30">
        <div className="p-6 font-semibold text-lg tracking-tight">
          Dashboard
        </div>

        <nav className="flex flex-col gap-1 px-3 text-white/70 flex-1">
          {navLinks.map(({ href, label, icon: Icon, count, exact }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                ${
                  isActive(href, exact)
                    ? "bg-white/20 text-white font-medium"
                    : "hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {count !== null && <NavBadge count={count} />}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} className="shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center px-4 bg-white/10 backdrop-blur-xl border-b border-white/20 z-50">
        <button onClick={() => setOpen(true)}>
          <Menu className="text-white" />
        </button>
        <span className="ml-3 font-semibold text-white">Dashboard</span>
      </div>

      {/* MOBILE DRAWER */}
      {visible && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            style={{ opacity: open ? 1 : 0 }}
            onClick={closeDrawer}
          />
          <aside
            className="relative w-72 h-full bg-[#0a1628] border-r border-white/10 p-4 flex flex-col transition-transform duration-300 ease-out"
            style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
          >
            <div className="flex justify-between items-center mb-6 text-white px-2">
              <span className="font-semibold text-lg">Menu</span>
              <button onClick={closeDrawer}>
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 text-white/70 flex-1">
              {navLinks.map(({ href, label, icon: Icon, count, exact }) => (
                <Link
                  key={href}
                  onClick={closeDrawer}
                  href={href}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-base transition-all
                    ${
                      isActive(href, exact)
                        ? "bg-white/20 text-white font-medium"
                        : "hover:bg-white/10 hover:text-white active:bg-white/20"
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {count !== null && <NavBadge count={count} />}
                </Link>
              ))}
            </nav>

            <div className="border-t border-white/20 pt-3 mt-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-white/60 hover:bg-white/10 hover:text-red-300 active:bg-white/20 transition-colors"
              >
                <LogOut size={18} className="shrink-0" />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
