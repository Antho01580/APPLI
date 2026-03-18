'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface Facture {
  id: string
  mois: number
  annee: number
  heuresValidees: number
  montant: number
  status: 'BROUILLON' | 'VALIDEE' | 'PAYEE'
  fichierUrl: string | null
  dateCreation: string
  dateValidation: string | null
  datePaiement: string | null
}

interface FormationInterne {
  id: string
  titre: string
  date: string
  type: 'E_LEARNING' | 'PRESENTIEL'
  status: string
}

const MOIS_LABELS = [
  '', 'Janvier', 'F\u00e9vrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Ao\u00fbt', 'Septembre', 'Octobre', 'Novembre', 'D\u00e9cembre',
]

export default function FacturesPage() {
  const { data: session } = useSession()
  const [factures, setFactures] = useState<Facture[]>([])
  const [formations, setFormations] = useState<FormationInterne[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hoursToValidate, setHoursToValidate] = useState(0)
  const [filter, setFilter] = useState<'all' | 'BROUILLON' | 'VALIDEE' | 'PAYEE'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      const [facturesRes, formationsRes] = await Promise.all([
        fetch('/api/formateur/factures'),
        fetch('/api/formateur/formations-internes'),
      ])
      if (facturesRes.ok) {
        const data = await facturesRes.json()
        setFactures(data.factures || [])
      }
      if (formationsRes.ok) {
        const data = await formationsRes.json()
        setFormations(data.formations || [])
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (f: Facture) => {
    setSelectedFacture(f)
    setHoursToValidate(f.heuresValidees)
    setShowDetailModal(true)
  }

  const handleValidateHours = async () => {
    if (!selectedFacture) return
    setSaving(true)
    try {
      const res = await fetch(`/api/formateur/factures/${selectedFacture.id}/valider-heures`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heuresValidees: hoursToValidate }),
      })
      if (res.ok) {
        setFactures((prev) =>
          prev.map((f) =>
            f.id === selectedFacture.id ? { ...f, heuresValidees: hoursToValidate } : f
          )
        )
        setSelectedFacture((prev) =>
          prev ? { ...prev, heuresValidees: hoursToValidate } : null
        )
      }
    } catch (error) {
      console.error('Erreur validation heures:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUploadFacture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFacture || !e.target.files?.[0]) return
    const file = e.target.files[0]

    if (file.type !== 'application/pdf') {
      alert('Seuls les fichiers PDF sont accept\u00e9s pour les factures.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/formateur/factures/${selectedFacture.id}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setFactures((prev) =>
          prev.map((f) =>
            f.id === selectedFacture.id
              ? { ...f, fichierUrl: data.url, status: 'VALIDEE' as const }
              : f
          )
        )
        setSelectedFacture((prev) =>
          prev ? { ...prev, fichierUrl: data.url, status: 'VALIDEE' } : null
        )
        setShowUploadModal(false)
      }
    } catch (error) {
      console.error('Erreur upload facture:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredFactures = factures.filter((f) => {
    if (filter === 'all') return true
    return f.status === filter
  })

  const statusConfig: Record<string, { label: string; cls: string }> = {
    BROUILLON: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
    VALIDEE: { label: 'Valid\u00e9e', cls: 'bg-blue-100 text-blue-700' },
    PAYEE: { label: 'Pay\u00e9e', cls: 'bg-green-100 text-green-700' },
  }

  const columns = [
    {
      key: 'periode',
      label: 'P\u00e9riode',
      render: (f: Facture) => (
        <span className="font-medium">{MOIS_LABELS[f.mois]} {f.annee}</span>
      ),
    },
    {
      key: 'heuresValidees',
      label: 'Heures',
      render: (f: Facture) => <span>{f.heuresValidees}h</span>,
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (f: Facture) => <span className="font-medium">{f.montant.toFixed(2)} \u20ac</span>,
    },
    {
      key: 'fichier',
      label: 'Facture',
      render: (f: Facture) =>
        f.fichierUrl ? (
          <a
            href={f.fichierUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-weform-blue hover:underline text-sm"
          >
            T\u00e9l\u00e9charger
          </a>
        ) : (
          <span className="text-gray-400 text-sm">Non envoy\u00e9e</span>
        ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (f: Facture) => {
        const s = statusConfig[f.status] || statusConfig.BROUILLON
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
      },
    },
  ]

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
          <p className="text-gray-500 mt-1">Validation des heures et gestion des factures</p>
        </div>

        {/* Filters */}
        <div className="card flex items-center gap-4">
          <span className="text-sm text-gray-500">Filtrer :</span>
          {(['all', 'BROUILLON', 'VALIDEE', 'PAYEE'] as const).map((f) => {
            const labels: Record<string, string> = {
              all: 'Toutes',
              BROUILLON: 'Brouillon',
              VALIDEE: 'Valid\u00e9es',
              PAYEE: 'Pay\u00e9es',
            }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-weform-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFactures}
            onRowClick={openDetail}
            emptyMessage="Aucune facture"
          />
        )}

        {/* Formations internes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Formations internes</h2>
          <p className="text-sm text-gray-500 mb-4">
            4 dates requises : 2 sessions e-learning et 2 sessions en pr\u00e9sentiel
          </p>
          {formations.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Aucune formation interne planifi\u00e9e</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formations.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{f.titre}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(f.date).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      f.type === 'E_LEARNING' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {f.type === 'E_LEARNING' ? 'E-learning' : 'Pr\u00e9sentiel'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      f.status === 'COMPLETE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {f.status === 'COMPLETE' ? 'Effectu\u00e9e' : 'Planifi\u00e9e'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              E-learning : {formations.filter((f) => f.type === 'E_LEARNING').length}/2 sessions |
              Pr\u00e9sentiel : {formations.filter((f) => f.type === 'PRESENTIEL').length}/2 sessions
            </p>
          </div>
        </div>

        {/* Facture Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedFacture ? `Facture ${MOIS_LABELS[selectedFacture.mois]} ${selectedFacture.annee}` : 'Facture'}
          size="lg"
        >
          {selectedFacture && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">P\u00e9riode</p>
                  <p className="font-medium">{MOIS_LABELS[selectedFacture.mois]} {selectedFacture.annee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (statusConfig[selectedFacture.status] || statusConfig.BROUILLON).cls
                  }`}>
                    {(statusConfig[selectedFacture.status] || statusConfig.BROUILLON).label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className="font-medium text-lg">{selectedFacture.montant.toFixed(2)} \u20ac</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date cr\u00e9ation</p>
                  <p className="font-medium">{new Date(selectedFacture.dateCreation).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {/* Validate hours */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Heures valid\u00e9es</h4>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={hoursToValidate}
                    onChange={(e) => setHoursToValidate(parseFloat(e.target.value) || 0)}
                    className="input w-32"
                    min={0}
                    step={0.5}
                  />
                  <span className="text-gray-500">heures</span>
                  <button
                    onClick={handleValidateHours}
                    disabled={saving}
                    className="btn-secondary"
                  >
                    {saving ? 'Validation...' : 'Valider les heures'}
                  </button>
                </div>
              </div>

              {/* Upload facture */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Facture</h4>
                {selectedFacture.fichierUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-700">Facture envoy\u00e9e</span>
                    <a
                      href={selectedFacture.fichierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-weform-blue hover:underline ml-auto"
                    >
                      T\u00e9l\u00e9charger
                    </a>
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadFacture}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? 'Upload en cours...' : selectedFacture.fichierUrl ? 'Remplacer la facture' : 'Envoyer la facture (PDF)'}
                </button>
              </div>

              {/* Timeline */}
              {(selectedFacture.dateValidation || selectedFacture.datePaiement) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Historique</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-600">
                        Cr\u00e9\u00e9e le {new Date(selectedFacture.dateCreation).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {selectedFacture.dateValidation && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-gray-600">
                          Valid\u00e9e le {new Date(selectedFacture.dateValidation).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {selectedFacture.datePaiement && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-600">
                          Pay\u00e9e le {new Date(selectedFacture.datePaiement).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
