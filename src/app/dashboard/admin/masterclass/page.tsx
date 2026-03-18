'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface Masterclass {
  id: string
  titre: string
  description: string | null
  date: string
  duree: number
  intervenant: string | null
  lien: string | null
  obligatoire: boolean
  formation: { id: string; nom: string } | null
}

interface FormationOption {
  id: string
  nom: string
}

export default function MasterclassPage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([])
  const [formations, setFormations] = useState<FormationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date: '',
    duree: 60,
    intervenant: '',
    lien: '',
    obligatoire: false,
    formationId: '',
  })

  async function fetchData() {
    try {
      const [mcRes, formRes] = await Promise.all([
        fetch('/api/admin/masterclass'),
        fetch('/api/admin/formations'),
      ])
      if (mcRes.ok) {
        const data = await mcRes.json()
        setMasterclasses(data.masterclasses || [])
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
      const res = await fetch('/api/admin/masterclass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          formationId: formData.formationId || null,
          duree: parseInt(String(formData.duree)),
        }),
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({ titre: '', description: '', date: '', duree: 60, intervenant: '', lien: '', obligatoire: false, formationId: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Erreur creation masterclass:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'titre', label: 'Titre' },
    {
      key: 'date',
      label: 'Date',
      render: (mc: Masterclass) => new Date(mc.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    },
    {
      key: 'duree',
      label: 'Duree',
      render: (mc: Masterclass) => `${mc.duree} min`,
    },
    {
      key: 'intervenant',
      label: 'Intervenant',
      render: (mc: Masterclass) => mc.intervenant || <span className="text-gray-400">-</span>,
    },
    {
      key: 'formation',
      label: 'Formation',
      render: (mc: Masterclass) => mc.formation?.nom || <span className="text-gray-400">Toutes</span>,
    },
    {
      key: 'obligatoire',
      label: 'Type',
      render: (mc: Masterclass) => (
        <span className={`text-xs px-2 py-1 rounded-full ${mc.obligatoire ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
          {mc.obligatoire ? 'Obligatoire' : 'Facultative'}
        </span>
      ),
    },
    {
      key: 'lien',
      label: 'Lien',
      render: (mc: Masterclass) =>
        mc.lien ? (
          <a href={mc.lien} target="_blank" rel="noopener noreferrer" className="text-weform-blue hover:underline text-sm">
            Rejoindre
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des masterclass</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Nouvelle masterclass
          </button>
        </div>

        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            Les masterclass sont non-obligatoires par defaut. Elles permettent aux stagiaires de decouvrir des sujets complementaires.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={masterclasses} emptyMessage="Aucune masterclass enregistree" />
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle masterclass" size="lg">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duree (min)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: parseInt(e.target.value) || 60 })}
                  min={15}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervenant</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.intervenant}
                  onChange={(e) => setFormData({ ...formData, intervenant: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formation (optionnel)</label>
                <select
                  className="input-field"
                  value={formData.formationId}
                  onChange={(e) => setFormData({ ...formData, formationId: e.target.value })}
                >
                  <option value="">Toutes les formations</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lien (Teams, Zoom...)</label>
              <input
                type="url"
                className="input-field"
                value={formData.lien}
                onChange={(e) => setFormData({ ...formData, lien: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="obligatoire"
                checked={formData.obligatoire}
                onChange={(e) => setFormData({ ...formData, obligatoire: e.target.checked })}
                className="rounded border-gray-300 text-weform-blue focus:ring-weform-blue"
              />
              <label htmlFor="obligatoire" className="text-sm text-gray-700">
                Masterclass obligatoire
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creation...' : 'Creer la masterclass'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
