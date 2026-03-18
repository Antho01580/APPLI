'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'

interface Notification {
  id: string
  message: string
  type: string
  createdAt: string
  read: boolean
}

interface RencontreTuteur {
  id: string
  date: string
  stagiaireNom: string
  tuteurNom: string
  type: string
}

interface StagiaireProgress {
  id: string
  nom: string
  prenom: string
  progressCours: number
  progressCasPratiques: number
  progressElearning: number
  progressECF: number
}

export default function FormateurDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    nbStagiaires: 0,
    prochainsCours: 0,
    casPratiquesACorreger: 0,
    ecfsACorreger: 0,
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [rencontres, setRencontres] = useState<RencontreTuteur[]>([])
  const [stagiaires, setStagiaires] = useState<StagiaireProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchData = async () => {
      try {
        const [statsRes, notifsRes, rencontresRes, stagiairesRes] = await Promise.all([
          fetch('/api/formateur/stats'),
          fetch('/api/notifications?limit=5'),
          fetch('/api/formateur/rencontres-tuteur?upcoming=true&limit=5'),
          fetch('/api/formateur/stagiaires?summary=true'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        if (notifsRes.ok) {
          const notifsData = await notifsRes.json()
          setNotifications(notifsData.notifications || [])
        }
        if (rencontresRes.ok) {
          const rencontresData = await rencontresRes.json()
          setRencontres(rencontresData.rencontres || [])
        }
        if (stagiairesRes.ok) {
          const stagiairesData = await stagiairesRes.json()
          setStagiaires(stagiairesData.stagiaires || [])
        }
      } catch (error) {
        console.error('Erreur chargement dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {session?.user?.prenom || 'Formateur'}
          </h1>
          <p className="text-gray-500 mt-1">Voici votre tableau de bord</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Stagiaires"
            value={stats.nbStagiaires}
            icon="&#128101;"
            color="text-weform-blue"
            subtitle="Stagiaires assignés"
          />
          <StatCard
            title="Prochains cours"
            value={stats.prochainsCours}
            icon="&#128218;"
            color="text-green-600"
            subtitle="Cours à venir"
          />
          <StatCard
            title="Cas pratiques"
            value={stats.casPratiquesACorreger}
            icon="&#128221;"
            color="text-orange-500"
            subtitle="À corriger"
          />
          <StatCard
            title="ECFs"
            value={stats.ecfsACorreger}
            icon="&#127891;"
            color="text-purple-600"
            subtitle="À corriger"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rencontres Tuteur */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Prochaines rencontres tuteur</h2>
              <button
                onClick={() => router.push('/dashboard/formateur/calendrier')}
                className="text-sm text-weform-blue hover:underline"
              >
                Voir le calendrier
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
              </div>
            ) : rencontres.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucune rencontre planifiée</p>
            ) : (
              <div className="space-y-3">
                {rencontres.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{r.stagiaireNom}</p>
                      <p className="text-sm text-gray-500">Tuteur : {r.tuteurNom}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-weform-blue">
                        {new Date(r.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <button
                onClick={() => router.push('/dashboard/formateur/notifications')}
                className="text-sm text-weform-blue hover:underline"
              >
                Tout voir
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucune notification</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border ${
                      n.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'
                    }`}
                  >
                    <p className="text-sm text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Access Stagiaires Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progression des stagiaires</h2>
            <button
              onClick={() => router.push('/dashboard/formateur/stagiaires')}
              className="text-sm text-weform-blue hover:underline"
            >
              Voir tous les stagiaires
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
            </div>
          ) : stagiaires.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucun stagiaire assigné</p>
          ) : (
            <div className="space-y-4">
              {stagiaires.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => router.push(`/dashboard/formateur/stagiaires?id=${s.id}`)}
                >
                  <p className="font-medium text-gray-900 mb-3">
                    {s.prenom} {s.nom}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cours</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-weform-blue h-2 rounded-full"
                          style={{ width: `${s.progressCours}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{s.progressCours}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cas pratiques</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${s.progressCasPratiques}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{s.progressCasPratiques}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">E-learning</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${s.progressElearning}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{s.progressElearning}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ECF</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${s.progressECF}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{s.progressECF}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/dashboard/formateur/cours')}
            className="card text-center hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">&#128218;</span>
            <p className="text-sm font-medium text-gray-700 mt-2">Mes cours</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/formateur/cas-pratiques')}
            className="card text-center hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">&#128221;</span>
            <p className="text-sm font-medium text-gray-700 mt-2">Cas pratiques</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/formateur/dossiers-pro')}
            className="card text-center hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">&#128193;</span>
            <p className="text-sm font-medium text-gray-700 mt-2">Dossiers pro</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/formateur/factures')}
            className="card text-center hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">&#128176;</span>
            <p className="text-sm font-medium text-gray-700 mt-2">Factures</p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
