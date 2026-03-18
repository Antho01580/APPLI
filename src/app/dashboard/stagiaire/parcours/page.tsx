'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProgressBar from '@/components/ui/ProgressBar'

interface UCProgress {
  id: string
  code: string
  label: string
  questionnaires: { done: number; total: number }
  elearning: { done: number; total: number }
  casPratiques: { done: number; total: number }
  cours: { done: number; total: number }
}

interface ParcoursData {
  timeline: {
    id: string
    title: string
    type: string
    date: string
    status: string
  }[]
  globalProgress: {
    questionnaires: { done: number; total: number }
    elearning: { done: number; total: number }
    casPratiques: { done: number; total: number }
    cours: { done: number; total: number }
  }
  ucProgress: UCProgress[]
}

const statusColors: Record<string, string> = {
  EFFECTUE: 'bg-green-500',
  EN_COURS: 'bg-blue-500',
  PLANIFIE: 'bg-gray-300',
  A_FAIRE: 'bg-yellow-400',
}

const statusLabels: Record<string, string> = {
  EFFECTUE: 'Effectue',
  EN_COURS: 'En cours',
  PLANIFIE: 'Planifie',
  A_FAIRE: 'A faire',
}

const typeLabels: Record<string, string> = {
  COURS: 'Cours',
  ELEARNING: 'E-learning',
  CAS_PRATIQUE: 'Cas pratique',
  ECF: 'ECF',
  SEMINAIRE: 'Seminaire',
  QUESTIONNAIRE: 'Questionnaire',
}

export default function ParcoursPage() {
  const [data, setData] = useState<ParcoursData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stagiaire/parcours')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon parcours</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <>
            {/* Global progress bars */}
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Progression globale</h2>
              <ProgressBar
                value={data?.globalProgress.questionnaires.done || 0}
                max={data?.globalProgress.questionnaires.total || 1}
                label="Questionnaires"
                color="bg-yellow-500"
              />
              <ProgressBar
                value={data?.globalProgress.elearning.done || 0}
                max={data?.globalProgress.elearning.total || 1}
                label="E-learning"
                color="bg-purple-500"
              />
              <ProgressBar
                value={data?.globalProgress.casPratiques.done || 0}
                max={data?.globalProgress.casPratiques.total || 1}
                label="Cas pratiques"
                color="bg-green-500"
              />
              <ProgressBar
                value={data?.globalProgress.cours.done || 0}
                max={data?.globalProgress.cours.total || 1}
                label="Cours"
                color="bg-weform-blue"
              />
            </div>

            {/* Progress by UC/theme */}
            {data?.ucProgress && data.ucProgress.length > 0 && (
              <div className="card space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Progression par UC</h2>
                {data.ucProgress.map((uc) => (
                  <div key={uc.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-gray-800">
                      {uc.code} - {uc.label}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ProgressBar
                        value={uc.questionnaires.done}
                        max={uc.questionnaires.total}
                        label="Questionnaires"
                        color="bg-yellow-500"
                      />
                      <ProgressBar
                        value={uc.elearning.done}
                        max={uc.elearning.total}
                        label="E-learning"
                        color="bg-purple-500"
                      />
                      <ProgressBar
                        value={uc.casPratiques.done}
                        max={uc.casPratiques.total}
                        label="Cas pratiques"
                        color="bg-green-500"
                      />
                      <ProgressBar
                        value={uc.cours.done}
                        max={uc.cours.total}
                        label="Cours"
                        color="bg-weform-blue"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chronologie du parcours</h2>
              {data?.timeline && data.timeline.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <ul className="space-y-4">
                    {data.timeline.map((item) => (
                      <li key={item.id} className="relative pl-10">
                        <div
                          className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                            statusColors[item.status] || 'bg-gray-300'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {typeLabels[item.type] || item.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                              {new Date(item.date).toLocaleDateString('fr-FR')}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full text-white ${
                                statusColors[item.status] || 'bg-gray-400'
                              }`}
                            >
                              {statusLabels[item.status] || item.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-400">Aucun element dans le parcours</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
