'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProgressBar from '@/components/ui/ProgressBar'
import DataTable from '@/components/ui/DataTable'

interface ElearningModule {
  id: string
  title: string
  uc: string
  theme: string
  progress: number
  total: number
  status: 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE'
  lastAccessedAt: string | null
}

interface UCProgress {
  code: string
  label: string
  done: number
  total: number
  themes: {
    name: string
    done: number
    total: number
  }[]
}

const statusColors: Record<string, string> = {
  NON_COMMENCE: 'bg-gray-100 text-gray-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  TERMINE: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  NON_COMMENCE: 'Non commence',
  EN_COURS: 'En cours',
  TERMINE: 'Termine',
}

export default function ElearningPage() {
  const [modules, setModules] = useState<ElearningModule[]>([])
  const [ucProgress, setUcProgress] = useState<UCProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUC, setExpandedUC] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stagiaire/elearning')
      .then((res) => res.json())
      .then((d) => {
        setModules(d.modules || [])
        setUcProgress(d.ucProgress || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    {
      key: 'title',
      label: 'Module',
      render: (item: ElearningModule) => (
        <div>
          <p className="font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-500">{item.theme}</p>
        </div>
      ),
    },
    {
      key: 'uc',
      label: 'UC',
      render: (item: ElearningModule) => (
        <span className="text-sm text-gray-600">{item.uc}</span>
      ),
    },
    {
      key: 'progress',
      label: 'Progression',
      render: (item: ElearningModule) => (
        <div className="w-40">
          <ProgressBar
            value={item.progress}
            max={item.total}
            color={item.status === 'TERMINE' ? 'bg-green-500' : 'bg-purple-500'}
          />
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: ElearningModule) => (
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[item.status]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'lastAccessedAt',
      label: 'Dernier acces',
      render: (item: ElearningModule) =>
        item.lastAccessedAt ? (
          <span className="text-sm text-gray-500">
            {new Date(item.lastAccessedAt).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">E-learning</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <>
            {/* Progress by UC */}
            {ucProgress.length > 0 && (
              <div className="card space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Progression par UC</h2>
                {ucProgress.map((uc) => (
                  <div key={uc.code} className="border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedUC(expandedUC === uc.code ? null : uc.code)
                      }
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 mr-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-800 text-left">
                            {uc.code} - {uc.label}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {uc.done}/{uc.total} ({uc.total > 0 ? Math.round((uc.done / uc.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill bg-purple-500"
                            style={{
                              width: `${uc.total > 0 ? Math.round((uc.done / uc.total) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedUC === uc.code ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {expandedUC === uc.code && uc.themes.length > 0 && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                        {uc.themes.map((theme) => (
                          <ProgressBar
                            key={theme.name}
                            value={theme.done}
                            max={theme.total}
                            label={theme.name}
                            color="bg-purple-400"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Modules list */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tous les modules</h2>
              <DataTable
                columns={columns}
                data={modules}
                emptyMessage="Aucun module e-learning disponible"
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
