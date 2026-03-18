'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import ProgressBar from '@/components/ui/ProgressBar'
import { useEffect, useState } from 'react'

interface RdvTuteur {
  id: string
  numero: number
  datePrevisionnelle: string | null
  dateRealisee: string | null
  statut: string
  compteRendu: string | null
  formateurNom: string
  stagiaireNom: string
}

export default function TuteurRdv() {
  const [rdvs, setRdvs] = useState<RdvTuteur[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rencontres-tuteur?tuteur=me')
      .then((r) => r.json())
      .then((data) => setRdvs(data.rencontres || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const realises = rdvs.filter((r) => r.statut === 'REALISEE').length

  return (
    <DashboardLayout requiredRole={['TUTEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendez-vous Tuteur</h1>
          <p className="text-gray-500">3 rencontres programmées pendant le parcours</p>
        </div>

        <div className="card">
          <ProgressBar
            label="Rencontres réalisées"
            value={realises}
            max={3}
            color="bg-weform-success"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : rdvs.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">Aucun rendez-vous tuteur planifié</p>
            <p className="text-sm text-gray-400 mt-2">
              Le formateur proposera 3 rencontres tuteur sur la plateforme
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rdvs.map((rdv) => (
              <div key={rdv.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Rencontre {rdv.numero}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {rdv.numero === 1
                        ? '1/3 du contrat'
                        : rdv.numero === 2
                        ? 'Moitié du contrat'
                        : '2/3 du contrat'}
                    </p>
                  </div>
                  <span
                    className={
                      rdv.statut === 'REALISEE'
                        ? 'badge-success'
                        : rdv.statut === 'PROGRAMMEE'
                        ? 'badge-info'
                        : 'badge-warning'
                    }
                  >
                    {rdv.statut === 'REALISEE'
                      ? 'Réalisée'
                      : rdv.statut === 'PROGRAMMEE'
                      ? 'Programmée'
                      : 'À programmer'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Date prévue</p>
                    <p className="font-medium">
                      {rdv.datePrevisionnelle
                        ? new Date(rdv.datePrevisionnelle).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Non définie'}
                    </p>
                  </div>
                  {rdv.dateRealisee && (
                    <div>
                      <p className="text-gray-500">Date réalisée</p>
                      <p className="font-medium">
                        {new Date(rdv.dateRealisee).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {rdv.compteRendu && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Compte-rendu</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{rdv.compteRendu}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
