'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

export default function DashboardLayout({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: string[]
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated' && requiredRole && !requiredRole.includes(session?.user?.role)) {
      router.push(`/dashboard/${session?.user?.role.toLowerCase()}`)
    }
  }, [status, session, router, requiredRole])

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/notifications/count')
        .then((res) => res.json())
        .then((data) => setNotifCount(data.count || 0))
        .catch(() => {})
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-weform-blue"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {getRoleLabel(session?.user?.role)}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/dashboard/${session?.user?.role.toLowerCase()}/messages` as any)}
              className="relative text-gray-500 hover:text-weform-blue"
              title="Messages"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
            <button
              onClick={() => router.push(`/dashboard/${session?.user?.role.toLowerCase()}/notifications` as any)}
              className="relative text-gray-500 hover:text-weform-blue"
              title="Notifications"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

function getRoleLabel(role?: string) {
  switch (role) {
    case 'ADMIN': return 'Espace Administration'
    case 'FORMATEUR': return 'Espace Formateur'
    case 'STAGIAIRE': return 'Espace Stagiaire'
    case 'TUTEUR': return 'Espace Tuteur'
    default: return 'WE-FORM'
  }
}
