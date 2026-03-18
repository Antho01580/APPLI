'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import ProgressBar from '@/components/ui/ProgressBar'

interface StagiaireRow {
  id: string
  user: { nom: string; prenom: string; email: string }
  formation: { id: string; nom: string } | null
  club: { nom: string } | null
  format: string | null
  compteValide: boolean
  prerequisValides: boolean
  coursProgress: { done: number; total: number }
  ecfProgress: { done: number; total: number }
}

interface FormationFilter {
  id: string
  nom: string
}

export default function StagiairesPage() {
  const [stagiaires, setStagiaires] = useState<StagiaireRow[]>([])
  const [formations, setFormations] = useState<FormationFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFormation, setFilterFormation] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [search, setSearch] = useState('')
  const [validating, setValidating] = useState<string | null>(null)

  async function fetchStagiaires() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterFormation) params.set('formationId', filterFormation)
      if (filterStatut) params.set('compteValide', filterStatut)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/stagiaires?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStagiaires(data.stagiaires || [])
      }
    } catch (error) {
      console.error('Erreur chargement stagiaires:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchFormations() {
    try {
      const res = await fetch('/api/admin/formations')
      if (res.ok) {
        const data = await res.json()
        setFormations(data.formations || [])
      }
    } catch (error) {
      console.error('Erreur chargement formations:', error)
    }
  }

  useEffect(() => {
    fetchFormations()
  }, [])

  useEffect(() => {
    fetchStagiaires()
  }, [filterFormation, filterStatut, search])

  async function handleValidateAccount(stagiaireId: string) {
    setValidating(stagiaireId)
    try {
      const res = await fetch(`/api/admin/stagiaires/${stagiaireId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compteValide: true }),
      })
      if (res.ok) {
        setStagiaires((prev) =>
          prev.map((s) => (s.id === stagiaireId ? { ...s, compteValide: true } : s))
        )
      }
    } catch (error) {
      console.error('Erreur validation:', error)
    } finally {
      setValidating(null)
    }
  }

  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      render: (s: StagiaireRow) => (
        <span className="font-medium">{s.user.nom}</span>
      ),
    },
    {
      key: 'prenom',
      label: 'Prenom',
      render: (s: StagiaireRow) => s.user.prenom,
    },
    {
      key: 'formation',
      label: 'Formation',
      render: (s: StagiaireRow) => s.formation?.nom || <span className="text-gray-400">-</span>,
    },
    {
      key: 'club',
      label: 'Club',
      render: (s: StagiaireRow) => s.club?.nom || <span className="text-gray-400">-</span>,
    },
    {
      key: 'format',
      label: 'Format',
      render: (s: StagiaireRow) => s.format || <span className="text-gray-400">-</span>,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (s: StagiaireRow) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            s.compteValide
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {s.compteValide ? 'Valide' : 'En attente'}
        </span>
      ),
    },
    {
      key: 'progression',
      label: 'Progression',
      render: (s: StagiaireRow) => (
        <div className="w-32">
          <ProgressBar
            value={s.coursProgress?.done || 0}
            max={s.coursProgress?.total || 1}
            showCount={false}
            color="bg-weform-blue"
          />
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (s: StagiaireRow) =>
        !s.compteValide ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleValidateAccount(s.id)
            }}
            disabled={validating === s.id}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {validating === s.id ? 'Validation...' : 'Valider le compte'}
          </button>
        ) : (
          <span className="text-xs text-gray-400">Compte actif</span>
        ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des stagiaires</h1>
          <span className="text-sm text-gray-500">{stagiaires.length} stagiaire{stagiaires.length > 1 ? 's' : ''}</span>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nom, prenom, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
              <select
                className="input-field"
                value={filterFormation}
                onChange={(e) => setFilterFormation(e.target.value)}
              >
                <option value="">Toutes les formations</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut du compte</label>
              <select
                className="input-field"
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="true">Valide</option>
                <option value="false">En attente de validation</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={stagiaires}
            emptyMessage="Aucun stagiaire trouve"
          />
        )}
      </div>
    </DashboardLayout>
  )
}
