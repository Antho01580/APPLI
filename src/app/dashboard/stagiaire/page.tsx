'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import ProgressBar from '@/components/ui/ProgressBar'

interface DashboardData {
  coursDone: number
  coursTotal: number
  casPratiquesDone: number
  casPratiquesTotal: number
  elearningProgress: number
  elearningTotal: number
  ecfStatus: string
  nextCourse: {
    date: string
    title: string
    teamsLink: string | null
  } | null
  deadlines: {
    id: string
    title: string
    dueDate: string
    type: string
  }[]
  notifications: {
    id: string
    message: string
    createdAt: string
    read: boolean
  }[]
}

export default function StagiaireDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stagiaire/dashboard')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {session?.user?.name || 'Stagiaire'} !
          </h1>
          <p className="text-gray-500 mt-1">Bienvenue sur votre espace de formation WE-FORM</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Cours"
                value={`${data?.coursDone || 0}/${data?.coursTotal || 0}`}
                icon="&#x1F4DA;"
                subtitle="cours effectues"
              />
              <StatCard
                title="Cas pratiques"
                value={`${data?.casPratiquesDone || 0}/${data?.casPratiquesTotal || 0}`}
                icon="&#x1F4DD;"
                color="text-green-600"
                subtitle="rendus"
              />
              <StatCard
                title="E-learning"
                value={`${data?.elearningTotal ? Math.round(((data?.elearningProgress || 0) / data.elearningTotal) * 100) : 0}%`}
                icon="&#x1F4BB;"
                color="text-purple-600"
                subtitle="de progression"
              />
              <StatCard
                title="ECF"
                value={data?.ecfStatus || 'Non commence'}
                icon="&#x1F4CB;"
                color="text-orange-600"
              />
            </div>

            {/* Progress bars */}
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Progression globale</h2>
              <ProgressBar
                value={data?.coursDone || 0}
                max={data?.coursTotal || 1}
                label="Cours"
                color="bg-weform-blue"
              />
              <ProgressBar
                value={data?.casPratiquesDone || 0}
                max={data?.casPratiquesTotal || 1}
                label="Cas pratiques"
                color="bg-green-500"
              />
              <ProgressBar
                value={data?.elearningProgress || 0}
                max={data?.elearningTotal || 1}
                label="E-learning"
                color="bg-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next course */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Prochain cours</h2>
                {data?.nextCourse ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-800">{data.nextCourse.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(data.nextCourse.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {data.nextCourse.teamsLink && (
                      <a
                        href={data.nextCourse.teamsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        <span>&#x1F4F9;</span> Rejoindre sur Teams
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Aucun cours a venir</p>
                )}
              </div>

              {/* Deadlines */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Echeances a venir</h2>
                {data?.deadlines && data.deadlines.length > 0 ? (
                  <ul className="space-y-3">
                    {data.deadlines.map((d) => (
                      <li key={d.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{d.title}</p>
                          <p className="text-xs text-gray-500">{d.type}</p>
                        </div>
                        <span className="text-sm text-red-600 font-medium">
                          {new Date(d.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">Aucune echeance</p>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications recentes</h2>
              {data?.notifications && data.notifications.length > 0 ? (
                <ul className="space-y-3">
                  {data.notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        n.read ? 'bg-white' : 'bg-blue-50'
                      }`}
                    >
                      <span className="text-weform-blue mt-0.5">&#x1F514;</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">Aucune notification</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
