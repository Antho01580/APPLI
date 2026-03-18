'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface UC {
  id: string
  code: string
  titre: string
}

interface Formation {
  id: string
  nom: string
  codeRNCP: string | null
  volumeHoraire: number
  description: string | null
  unitesCompetences: UC[]
  _count: { stagiaires: number }
}

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUCModal, setShowUCModal] = useState(false)
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    codeRNCP: '',
    volumeHoraire: 0,
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function fetchFormations() {
    try {
      const res = await fetch('/api/admin/formations')
      if (res.ok) {
        const data = await res.json()
        setFormations(data.formations || [])
      }
    } catch (error) {
      console.error('Erreur chargement formations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFormations()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({ nom: '', codeRNCP: '', volumeHoraire: 0, description: '' })
        fetchFormations()
      }
    } catch (error) {
      console.error('Erreur creation formation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'nom', label: 'Nom de la formation' },
    { key: 'codeRNCP', label: 'Code RNCP', render: (f: Formation) => f.codeRNCP || '-' },
    { key: 'volumeHoraire', label: 'Volume horaire', render: (f: Formation) => `${f.volumeHoraire}h` },
    {
      key: 'stagiaires',
      label: 'Stagiaires',
      render: (f: Formation) => (
        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
          {f._count?.stagiaires || 0}
        </span>
      ),
    },
    {
      key: 'ucs',
      label: 'UC',
      render: (f: Formation) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedFormation(f)
            setShowUCModal(true)
          }}
          className="text-weform-blue hover:underline text-sm"
        >
          {f.unitesCompetences?.length || 0} UC
        </button>
      ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des formations</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Nouvelle formation
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={formations}
            emptyMessage="Aucune formation enregistree"
          />
        )}

        {/* Modal Creation */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle formation" size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la formation</label>
              <input
                type="text"
                className="input-field"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code RNCP</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.codeRNCP}
                  onChange={(e) => setFormData({ ...formData, codeRNCP: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume horaire (h)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.volumeHoraire}
                  onChange={(e) => setFormData({ ...formData, volumeHoraire: parseInt(e.target.value) || 0 })}
                  required
                  min={0}
                />
              </div>
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
                {submitting ? 'Creation...' : 'Creer la formation'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal UC Detail */}
        <Modal isOpen={showUCModal} onClose={() => setShowUCModal(false)} title={`UC - ${selectedFormation?.nom || ''}`} size="lg">
          {selectedFormation?.unitesCompetences && selectedFormation.unitesCompetences.length > 0 ? (
            <div className="space-y-3">
              {selectedFormation.unitesCompetences.map((uc) => (
                <div key={uc.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="bg-weform-blue text-white text-xs px-2 py-1 rounded font-mono">{uc.code}</span>
                    <span className="font-medium text-gray-900">{uc.titre}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">Aucune unite de competence definie</p>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
