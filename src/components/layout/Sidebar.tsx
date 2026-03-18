'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

interface NavItem {
  label: string
  href: string
  icon: string
}

const navItems: Record<string, NavItem[]> = {
  ADMIN: [
    { label: 'Tableau de bord', href: '/dashboard/admin', icon: '&#x1F4CA;' },
    { label: 'Formations', href: '/dashboard/admin/formations', icon: '&#x1F4DA;' },
    { label: 'Stagiaires', href: '/dashboard/admin/stagiaires', icon: '&#x1F465;' },
    { label: 'Séminaires', href: '/dashboard/admin/seminaires', icon: '&#x1F3EB;' },
    { label: 'Masterclass', href: '/dashboard/admin/masterclass', icon: '&#x1F3A4;' },
    { label: 'Import Filiz', href: '/dashboard/admin/import', icon: '&#x1F4C1;' },
    { label: 'Recrutement', href: '/dashboard/admin/recrutement', icon: '&#x1F91D;' },
    { label: 'Visites', href: '/dashboard/admin/visites', icon: '&#x1F3E2;' },
    { label: 'Messages', href: '/dashboard/admin/messages', icon: '&#x1F4AC;' },
    { label: 'Notifications', href: '/dashboard/admin/notifications', icon: '&#x1F514;' },
  ],
  FORMATEUR: [
    { label: 'Tableau de bord', href: '/dashboard/formateur', icon: '&#x1F4CA;' },
    { label: 'Mes stagiaires', href: '/dashboard/formateur/stagiaires', icon: '&#x1F465;' },
    { label: 'Mes cours', href: '/dashboard/formateur/cours', icon: '&#x1F4DA;' },
    { label: 'Calendrier', href: '/dashboard/formateur/calendrier', icon: '&#x1F4C5;' },
    { label: 'Cas pratiques', href: '/dashboard/formateur/cas-pratiques', icon: '&#x1F4DD;' },
    { label: 'Dossiers pro', href: '/dashboard/formateur/dossiers-pro', icon: '&#x1F4C2;' },
    { label: 'Relations trim.', href: '/dashboard/formateur/relations', icon: '&#x1F4CB;' },
    { label: 'Factures', href: '/dashboard/formateur/factures', icon: '&#x1F4B6;' },
    { label: 'Messages', href: '/dashboard/formateur/messages', icon: '&#x1F4AC;' },
    { label: 'Documents', href: '/dashboard/formateur/documents', icon: '&#x1F4C4;' },
  ],
  STAGIAIRE: [
    { label: 'Tableau de bord', href: '/dashboard/stagiaire', icon: '&#x1F4CA;' },
    { label: 'Mon parcours', href: '/dashboard/stagiaire/parcours', icon: '&#x1F3AF;' },
    { label: 'Planning', href: '/dashboard/stagiaire/planning', icon: '&#x1F4C5;' },
    { label: 'Mes cours', href: '/dashboard/stagiaire/cours', icon: '&#x1F4DA;' },
    { label: 'Cas pratiques', href: '/dashboard/stagiaire/cas-pratiques', icon: '&#x1F4DD;' },
    { label: 'E-learning', href: '/dashboard/stagiaire/elearning', icon: '&#x1F4BB;' },
    { label: 'ECF', href: '/dashboard/stagiaire/ecf', icon: '&#x1F4CB;' },
    { label: 'Dossier pro', href: '/dashboard/stagiaire/dossier-pro', icon: '&#x1F4C2;' },
    { label: 'Missions', href: '/dashboard/stagiaire/missions', icon: '&#x1F3E2;' },
    { label: 'Documents', href: '/dashboard/stagiaire/documents', icon: '&#x1F4C4;' },
    { label: 'Immersion', href: '/dashboard/stagiaire/immersion', icon: '&#x1F310;' },
    { label: 'Messages', href: '/dashboard/stagiaire/messages', icon: '&#x1F4AC;' },
  ],
  TUTEUR: [
    { label: 'Tableau de bord', href: '/dashboard/tuteur', icon: '&#x1F4CA;' },
    { label: 'Parcours jeune', href: '/dashboard/tuteur/parcours', icon: '&#x1F3AF;' },
    { label: 'Rendez-vous', href: '/dashboard/tuteur/rdv', icon: '&#x1F4C5;' },
    { label: 'Contact', href: '/dashboard/tuteur/contact', icon: '&#x1F4AC;' },
  ],
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || 'ADMIN'
  const items = navItems[role] || navItems.ADMIN

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="text-2xl font-bold text-weform-blue">
          WE-FORM
        </Link>
        <p className="text-xs text-gray-400 mt-1">Application Métier</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `/dashboard/${role.toLowerCase()}` && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <span dangerouslySetInnerHTML={{ __html: item.icon }} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-weform-blue text-white flex items-center justify-center text-sm font-medium">
            {session?.user?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
