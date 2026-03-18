'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import ProgressBar from '@/components/ui/ProgressBar'
import { useEffect, useState } from 'react'

interface PlanningItem {
  id: string
  titre: string
  type: string
  dateDebut: string
  dateFin: string
  statut: string
  description?: string
}

export default function TuteurParcours() {
  const [planning, setPlanning] = useState<PlanningItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/planning?tuteur=me')
      .then((r) => r.json())
      .then((data) => setPlanning(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const typeColors: Record<string, string> = {
    COURS: 'bg-blue-100 text-blue-800',
    ELEARNING: 'bg-green-100 text-green-800',
    SEMINAIRE: 'bg-purple-100 text-purple-800',
    ECF: 'bg-orange-100 text-orange-800',
    JURY: 'bg-red-100 text-red-800',
    RENCONTRE_TUTEUR: 'bg-yellow-100 text-yellow-800',
  }

  const termines = planning.filter((p) => p.statut === 'TERMINE').length

  return (
    <DashboardLayout requiredRole={['TUTEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parcours du stagiaire</h1>
          <p className="text-gray-500">Vue en lecture seule du parcours de formation</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Progression globale</h2>
          <ProgressBar
            label="Éléments complétés"
            value={termines}
            max={planning.length}
            color="bg-weform-success"
          />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Timeline du parcours</h2>
          {loading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : planning.length === 0 ? (
            <p className="text-gray-400">Aucun planning disponible</p>
          ) : (
            <div className="space-y-3">
              {planning.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    item.statut === 'TERMINE' ? 'border-green-200 bg-green-50' : 'border-gray-100'
                  }`}
                >
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-gray-500">
                      {new Date(item.dateDebut).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.titre}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                  </div>
                  <span className={`badge ${typeColors[item.type] || 'bg-gray-100 text-gray-800'}`}>
                    {item.type.replace('_', ' ')}
                  </span>
                  <span
                    className={
                      item.statut === 'TERMINE'
                        ? 'badge-success'
                        : item.statut === 'EN_COURS'
                        ? 'badge-info'
                        : 'badge-warning'
                    }
                  >
                    {item.statut === 'TERMINE'
                      ? 'Terminé'
                      : item.statut === 'EN_COURS'
                      ? 'En cours'
                      : 'Planifié'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
