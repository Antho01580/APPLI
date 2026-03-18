'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface ImmersionRequest {
  id: string
  entreprise: string
  dateDebut: string
  dateFin: string
  duree: number
  motif: string
  status: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE'
  createdAt: string
  commentaire: string | null
}

const statusColors: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  VALIDEE: 'bg-green-100 text-green-800',
  REFUSEE: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validee',
  REFUSEE: 'Refusee',
}

export default function ImmersionPage() {
  const [requests, setRequests] = useState<ImmersionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    entreprise: '',
    dateDebut: '',
    dateFin: '',
    duree: 1,
    motif: '',
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = () => {
    fetch('/api/stagiaire/immersion')
      .then((res) => res.json())
      .then((d) => setRequests(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleSubmit = async () => {
    if (!form.entreprise || !form.dateDebut || !form.dateFin || !form.motif) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/stagiaire/immersion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        fetchRequests()
        setShowForm(false)
        setForm({ entreprise: '', dateDebut: '', dateFin: '', duree: 1, motif: '' })
      }
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'entreprise',
      label: 'Entreprise',
      render: (item: ImmersionRequest) => (
        <span className="font-medium text-gray-900">{item.entreprise}</span>
      ),
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (item: ImmersionRequest) => (
        <span className="text-sm">
          {new Date(item.dateDebut).toLocaleDateString('fr-FR')} -{' '}
          {new Date(item.dateFin).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'duree',
      label: 'Duree',
      render: (item: ImmersionRequest) => (
        <span className="text-sm">{item.duree} jour{item.duree > 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'motif',
      label: 'Motif',
      render: (item: ImmersionRequest) => (
        <span className="text-sm text-gray-600 truncate max-w-[200px] block">{item.motif}</span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: ImmersionRequest) => (
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[item.status]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Demande le',
      render: (item: ImmersionRequest) => (
        <span className="text-sm text-gray-500">
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demande d&apos;immersion</h1>
            <p className="text-sm text-gray-500 mt-1">
              Demandez une immersion en entreprise (1 a 3 jours)
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Nouvelle demande
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={requests}
              emptyMessage="Aucune demande d'immersion"
            />

            {requests.some((r) => r.commentaire) && (
              <div className="space-y-3">
                {requests
                  .filter((r) => r.commentaire)
                  .map((r) => (
                    <div
                      key={r.id}
                      className={`card border-l-4 ${
                        r.status === 'REFUSEE'
                          ? 'border-l-red-500 bg-red-50'
                          : 'border-l-green-500 bg-green-50'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        Commentaire pour {r.entreprise}
                      </p>
                      <p className="text-sm text-gray-600">{r.commentaire}</p>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Nouvelle demande d'immersion"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entreprise
              </label>
              <input
                type="text"
                value={form.entreprise}
                onChange={(e) => setForm((f) => ({ ...f, entreprise: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-weform-blue text-sm"
                placeholder="Nom de l'entreprise"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de debut
                </label>
                <input
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-weform-blue text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={form.dateFin}
                  onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-weform-blue text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duree (jours)
              </label>
              <select
                value={form.duree}
                onChange={(e) => setForm((f) => ({ ...f, duree: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-weform-blue text-sm"
              >
                <option value={1}>1 jour</option>
                <option value={2}>2 jours</option>
                <option value={3}>3 jours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif
              </label>
              <textarea
                value={form.motif}
                onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
                className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-weform-blue text-sm"
                placeholder="Decrivez le motif de votre demande d'immersion..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.entreprise || !form.dateDebut || !form.dateFin || !form.motif}
                className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {submitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
