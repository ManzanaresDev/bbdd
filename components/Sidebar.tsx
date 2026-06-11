'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FolderKanban,
  FileText, Receipt, LogOut, ChevronRight
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/projets', label: 'Projets', icon: FolderKanban },
  { href: '/dashboard/devis', label: 'Devis', icon: FileText },
  { href: '/dashboard/factures', label: 'Factures', icon: Receipt },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-56 flex flex-col bg-ink-950 h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-ink-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold font-display">A</span>
          </div>
          <span className="font-display text-white font-semibold text-base leading-tight">CRM Agence</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-100 group ${
                active
                  ? 'bg-accent text-white'
                  : 'text-ink-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-ink-800 pt-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-ink-500 text-xs truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-400 hover:text-white hover:bg-ink-800 transition-colors w-full"
        >
          <LogOut size={17} strokeWidth={1.8} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
