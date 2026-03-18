'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface Visite {
  id: string
  type: string
  date: string
  compteRendu: string | null
  organisePar: string
  club: { id: string; nom: string; ville: string | null }
}

interface ClubOption {
  id: string
  nom: string
}

export default function VisitesPage() {
  const [visites, setVisites] = useState<Visite[]>([])
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCRModal, setShowCRModal] = useState(false)
  const [selectedVisite, setSelectedVisite] = useState<Visite | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [compteRenduText, setCompteRenduText] = useState('')

  const [formData, setFormData] = useState({
    clubId: '',
    type: 'ADMINISTRATIVE',
    date: '',
    organisePar: '',
    compteRendu: '',
  })

  async function fetchData() {
    try {
      const [vRes, cRes] = await Promise.all([
        fetch('/api/admin/visites'),
        fetch('/api/admin/clubs'),
      ])
      if (vRes.ok) {
        const data = await vRes.json()
        setVisites(data.visites || [])
      }
      if (cRes.ok) {
        const data = await cRes.json()
        setClubs(data.clubs || [])
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
      const res = await fetch('/api/admin/visites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({ clubId: '', type: 'ADMINISTRATIVE', date: '', organisePar: '', compteRendu: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Erreur creation visite:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveCR() {
    if (!selectedVisite) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/visites/${selectedVisite.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compteRendu: compteRenduText }),
      })
      if (res.ok) {
        setShowCRModal(false)
        fetchData()
      }
    } catch (error) {
      console.error('Erreur sauvegarde CR:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'club',
      label: 'Club',
      render: (v: Visite) => (
        <div>
          <p className="font-medium">{v.club.nom}</p>
          {v.club.ville && <p className="text-xs text-gray-500">{v.club.ville}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (v: Visite) => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          v.type === 'ADMINISTRATIVE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {v.type === 'ADMINISTRATIVE' ? 'Administrative (annuelle)' : 'Commerciale (fin d\'annee)'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (v: Visite) => new Date(v.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    },
    { key: 'organisePar', label: 'Organise par' },
    {
      key: 'compteRendu',
      label: 'Compte-rendu',
      render: (v: Visite) =>
        v.compteRendu ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedVisite(v)
              setCompteRenduText(v.compteRendu || '')
              setShowCRModal(true)
            }}
            className="text-weform-blue hover:underline text-sm"
          >
            Voir / Modifier
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedVisite(v)
              setCompteRenduText('')
              setShowCRModal(true)
            }}
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Rediger
          </button>
        ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des visites</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Planifier une visite
          </button>
        </div>

        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Administrative :</strong> 1 visite par an par club.{' '}
            <strong>Commerciale :</strong> 1 visite en fin d&apos;annee.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={visites} emptyMessage="Aucune visite planifiee" />
        )}

        {/* Create Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Planifier une visite" size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <select
                className="input-field"
                value={formData.clubId}
                onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                required
              >
                <option value="">Selectionner un club</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de visite</label>
                <select
                  className="input-field"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="ADMINISTRATIVE">Administrative (1/an)</option>
                  <option value="COMMERCIALE">Commerciale (fin d&apos;annee)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organise par</label>
              <input
                type="text"
                className="input-field"
                value={formData.organisePar}
                onChange={(e) => setFormData({ ...formData, organisePar: e.target.value })}
                required
                placeholder="Nom du responsable"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compte-rendu (optionnel)</label>
              <textarea
                className="input-field"
                rows={4}
                value={formData.compteRendu}
                onChange={(e) => setFormData({ ...formData, compteRendu: e.target.value })}
                placeholder="A remplir apres la visite..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Planification...' : 'Planifier la visite'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Compte-rendu Modal */}
        <Modal isOpen={showCRModal} onClose={() => setShowCRModal(false)} title={`Compte-rendu - ${selectedVisite?.club.nom || ''}`} size="lg">
          <div className="space-y-4">
            <textarea
              className="input-field"
              rows={8}
              value={compteRenduText}
              onChange={(e) => setCompteRenduText(e.target.value)}
              placeholder="Rediger le compte-rendu de la visite..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCRModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button onClick={handleSaveCR} className="btn-primary" disabled={submitting}>
                {submitting ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
