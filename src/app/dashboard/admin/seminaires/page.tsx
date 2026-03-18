'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface SeminairePresence {
  id: string
  formateur: { user: { nom: string; prenom: string } }
  present: boolean | null
}

interface Seminaire {
  id: string
  titre: string
  dateDebut: string
  dateFin: string
  dureeJours: number
  heuresParJour: number
  lieu: string | null
  formation: { id: string; nom: string }
  presences: SeminairePresence[]
}

interface FormationOption {
  id: string
  nom: string
}

function getSecondWeekDates(year: number, month: number): { debut: string; fin: string } {
  const firstDay = new Date(year, month, 1)
  const dayOfWeek = firstDay.getDay()
  const firstMonday = dayOfWeek <= 1 ? 1 + (1 - dayOfWeek) + 7 : 1 + (8 - dayOfWeek) + 7
  const secondMonday = firstMonday

  const debut = new Date(year, month, secondMonday)
  const fin = new Date(year, month, secondMonday + 4)

  return {
    debut: debut.toISOString().split('T')[0],
    fin: fin.toISOString().split('T')[0],
  }
}

export default function SeminairesPage() {
  const [seminaires, setSeminaires] = useState<Seminaire[]>([])
  const [formations, setFormations] = useState<FormationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPresencesModal, setShowPresencesModal] = useState(false)
  const [selectedSeminaire, setSelectedSeminaire] = useState<Seminaire | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const currentYear = new Date().getFullYear()
  const [formData, setFormData] = useState({
    titre: '',
    formationId: '',
    periode: 'novembre',
    annee: currentYear,
    lieu: '',
    description: '',
  })

  async function fetchData() {
    try {
      const [semRes, formRes] = await Promise.all([
        fetch('/api/admin/seminaires'),
        fetch('/api/admin/formations'),
      ])
      if (semRes.ok) {
        const data = await semRes.json()
        setSeminaires(data.seminaires || [])
      }
      if (formRes.ok) {
        const data = await formRes.json()
        setFormations(data.formations || [])
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const month = formData.periode === 'novembre' ? 10 : 2
      const dates = getSecondWeekDates(formData.annee, month)

      const res = await fetch('/api/admin/seminaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: formData.titre,
          formationId: formData.formationId,
          dateDebut: dates.debut,
          dateFin: dates.fin,
          dureeJours: 4.5,
          heuresParJour: 10,
          lieu: formData.lieu || null,
          description: formData.description || null,
        }),
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({ titre: '', formationId: '', periode: 'novembre', annee: currentYear, lieu: '', description: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Erreur creation seminaire:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'titre', label: 'Titre' },
    {
      key: 'formation',
      label: 'Formation',
      render: (s: Seminaire) => s.formation?.nom || '-',
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (s: Seminaire) => (
        <span>
          {new Date(s.dateDebut).toLocaleDateString('fr-FR')} - {new Date(s.dateFin).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'duree',
      label: 'Duree',
      render: (s: Seminaire) => `${s.dureeJours} jours (${s.heuresParJour}h/j)`,
    },
    {
      key: 'lieu',
      label: 'Lieu',
      render: (s: Seminaire) => s.lieu || <span className="text-gray-400">Non defini</span>,
    },
    {
      key: 'presences',
      label: 'Presences formateurs',
      render: (s: Seminaire) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedSeminaire(s)
            setShowPresencesModal(true)
          }}
          className="text-weform-blue hover:underline text-sm"
        >
          {s.presences?.length || 0} reponse{(s.presences?.length || 0) > 1 ? 's' : ''}
        </button>
      ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des seminaires</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Nouveau seminaire
          </button>
        </div>

        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            Les seminaires se deroulent pendant la 2e semaine de novembre ou la 2e semaine de mars.
            Duree : 4,5 jours, 10h par jour.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={seminaires} emptyMessage="Aucun seminaire planifie" />
        )}

        {/* Create Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau seminaire" size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                className="input-field"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
              <select
                className="input-field"
                value={formData.formationId}
                onChange={(e) => setFormData({ ...formData, formationId: e.target.value })}
                required
              >
                <option value="">Selectionner une formation</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                <select
                  className="input-field"
                  value={formData.periode}
                  onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                >
                  <option value="novembre">2e semaine de novembre</option>
                  <option value="mars">2e semaine de mars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annee</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                  min={currentYear}
                  max={currentYear + 2}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
              <input
                type="text"
                className="input-field"
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                placeholder="Adresse du seminaire"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creation...' : 'Creer le seminaire'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Presences Modal */}
        <Modal
          isOpen={showPresencesModal}
          onClose={() => setShowPresencesModal(false)}
          title={`Presences - ${selectedSeminaire?.titre || ''}`}
          size="lg"
        >
          {selectedSeminaire?.presences && selectedSeminaire.presences.length > 0 ? (
            <div className="space-y-3">
              {selectedSeminaire.presences.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">
                    {p.formateur.user.prenom} {p.formateur.user.nom}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      p.present === true
                        ? 'bg-green-100 text-green-700'
                        : p.present === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.present === true ? 'Present' : p.present === false ? 'Absent' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">Aucune reponse de presence</p>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
