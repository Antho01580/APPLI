'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import ProgressBar from '@/components/ui/ProgressBar'
import { useEffect, useState } from 'react'

interface StagiaireInfo {
  id: string
  nom: string
  prenom: string
  formation: string
  dateDebutFormation: string
  dateFinFormation: string
  coursEffectues: number
  coursTotal: number
  casPratiquesRendus: number
  casPratiquesTotal: number
  elearningProgress: number
  ecfTermines: number
}

interface RdvTuteur {
  id: string
  numero: number
  datePrevisionnelle: string | null
  dateRealisee: string | null
  statut: string
  compteRendu: string | null
}

export default function TuteurDashboard() {
  const [stagiaires, setStagiaires] = useState<StagiaireInfo[]>([])
  const [rdvs, setRdvs] = useState<RdvTuteur[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [stagRes, rdvRes] = await Promise.all([
          fetch('/api/stagiaires?tuteur=me'),
          fetch('/api/rencontres-tuteur?tuteur=me'),
        ])
        if (stagRes.ok) {
          const data = await stagRes.json()
          setStagiaires(data.stagiaires || [])
        }
        if (rdvRes.ok) {
          const data = await rdvRes.json()
          setRdvs(data.rencontres || [])
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const rdvProgrammes = rdvs.filter((r) => r.statut === 'PROGRAMMEE').length
  const rdvRealises = rdvs.filter((r) => r.statut === 'REALISEE').length

  return (
    <DashboardLayout requiredRole={['TUTEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace Tuteur</h1>
          <p className="text-gray-500">Suivi du parcours de vos stagiaires</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Stagiaires suivis"
            value={stagiaires.length}
            icon="&#x1F465;"
          />
          <StatCard
            title="RDV Tuteur programmés"
            value={rdvProgrammes}
            icon="&#x1F4C5;"
            subtitle={`${rdvRealises} réalisés`}
          />
          <StatCard
            title="RDV Tuteur réalisés"
            value={rdvRealises}
            icon="&#x2705;"
          />
        </div>

        {/* Stagiaires progress */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parcours des stagiaires</h2>
          {loading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : stagiaires.length === 0 ? (
            <p className="text-gray-400">Aucun stagiaire assigné</p>
          ) : (
            <div className="space-y-6">
              {stagiaires.map((stag) => (
                <div key={stag.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {stag.prenom} {stag.nom}
                      </h3>
                      <p className="text-sm text-gray-500">{stag.formation}</p>
                    </div>
                    <span className="badge-info">
                      {stag.dateDebutFormation && new Date(stag.dateDebutFormation).toLocaleDateString('fr-FR')}
                      {' - '}
                      {stag.dateFinFormation && new Date(stag.dateFinFormation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <ProgressBar
                      label="Cours effectués"
                      value={stag.coursEffectues}
                      max={stag.coursTotal}
                    />
                    <ProgressBar
                      label="Cas pratiques rendus"
                      value={stag.casPratiquesRendus}
                      max={stag.casPratiquesTotal}
                      color="bg-weform-success"
                    />
                    <ProgressBar
                      label="E-learning"
                      value={stag.elearningProgress}
                      max={100}
                      color="bg-weform-accent"
                    />
                    <ProgressBar
                      label="ECF terminés"
                      value={stag.ecfTermines}
                      max={3}
                      color="bg-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rendez-vous tuteur */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rendez-vous Tuteur</h2>
          <div className="mb-4">
            <ProgressBar
              label="Rencontres tuteur"
              value={rdvRealises}
              max={3}
              color="bg-weform-success"
            />
          </div>
          {rdvs.length === 0 ? (
            <p className="text-gray-400">Aucun rendez-vous planifié</p>
          ) : (
            <div className="space-y-3">
              {rdvs.map((rdv) => (
                <div
                  key={rdv.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">Rencontre {rdv.numero}</p>
                    <p className="text-sm text-gray-500">
                      {rdv.datePrevisionnelle
                        ? `Prévue le ${new Date(rdv.datePrevisionnelle).toLocaleDateString('fr-FR')}`
                        : 'Date à définir'}
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
              ))}
            </div>
          )}
        </div>

        {/* Info notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> En tant que tuteur, vous disposez d&apos;un accès en lecture seule au parcours du jeune.
            Pour toute demande de contact ou d&apos;information, utilisez la section Contact.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
