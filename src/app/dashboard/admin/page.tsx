'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'

interface DashboardStats {
  totalStagiaires: number
  totalFormations: number
  totalFormateurs: number
  totalSeminaires: number
}

interface RecentStagiaire {
  id: string
  user: { nom: string; prenom: string; email: string }
  formation: { nom: string } | null
  club: { nom: string } | null
  compteValide: boolean
  createdAt: string
}

interface NotificationSummary {
  total: number
  unread: number
  recent: { id: string; titre: string; type: string; createdAt: string }[]
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStagiaires: 0,
    totalFormations: 0,
    totalFormateurs: 0,
    totalSeminaires: 0,
  })
  const [recentStagiaires, setRecentStagiaires] = useState<RecentStagiaire[]>([])
  const [notifications, setNotifications] = useState<NotificationSummary>({ total: 0, unread: 0, recent: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, stagiairesRes, notifsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/stagiaires?limit=5&sort=recent'),
          fetch('/api/admin/notifications/summary'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        if (stagiairesRes.ok) {
          const stagiairesData = await stagiairesRes.json()
          setRecentStagiaires(stagiairesData.stagiaires || [])
        }
        if (notifsRes.ok) {
          const notifsData = await notifsRes.json()
          setNotifications(notifsData)
        }
      } catch (error) {
        console.error('Erreur chargement dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Stagiaires"
            value={loading ? '...' : stats.totalStagiaires}
            icon="&#128100;"
            color="text-blue-600"
            subtitle="Total inscrits"
          />
          <StatCard
            title="Formations"
            value={loading ? '...' : stats.totalFormations}
            icon="&#128218;"
            color="text-green-600"
            subtitle="Formations actives"
          />
          <StatCard
            title="Formateurs"
            value={loading ? '...' : stats.totalFormateurs}
            icon="&#128105;&#8205;&#127891;"
            color="text-purple-600"
            subtitle="Formateurs actifs"
          />
          <StatCard
            title="Seminaires"
            value={loading ? '...' : stats.totalSeminaires}
            icon="&#127979;"
            color="text-orange-600"
            subtitle="Seminaires planifies"
          />
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/dashboard/admin/formations')}
              className="btn-primary"
            >
              Creer une formation
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/import')}
              className="btn-primary"
            >
              Import Filiz (Excel)
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/seminaires')}
              className="btn-primary"
            >
              Creer un seminaire
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/recrutement')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Recrutement
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/masterclass')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Masterclass
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Stagiaires */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stagiaires recents</h2>
              <button
                onClick={() => router.push('/dashboard/admin/stagiaires')}
                className="text-sm text-weform-blue hover:underline"
              >
                Voir tout
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
              </div>
            ) : recentStagiaires.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucun stagiaire</p>
            ) : (
              <div className="space-y-3">
                {recentStagiaires.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{s.user.prenom} {s.user.nom}</p>
                      <p className="text-sm text-gray-500">{s.formation?.nom || 'Aucune formation'} - {s.club?.nom || 'Aucun club'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${s.compteValide ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.compteValide ? 'Valide' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <div className="flex items-center gap-3">
                {notifications.unread > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                    {notifications.unread} non lue{notifications.unread > 1 ? 's' : ''}
                  </span>
                )}
                <button
                  onClick={() => router.push('/dashboard/admin/notifications')}
                  className="text-sm text-weform-blue hover:underline"
                >
                  Voir tout
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
              </div>
            ) : notifications.recent.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucune notification</p>
            ) : (
              <div className="space-y-3">
                {notifications.recent.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-2 h-2 mt-2 rounded-full bg-weform-blue flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{n.titre}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
