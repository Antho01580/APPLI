'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface CasPratique {
  id: string
  titre: string
  type: string
  stagiaireNom: string
  stagiairePrenom: string
  stagiaireId: string
  coursTitle: string
  dateRendu: string | null
  dateLimite: string
  status: string
  commentaireCorrection: string | null
  fichierCorrectionUrl: string | null
}

export default function CasPratiquesPage() {
  const { data: session } = useSession()
  const [casPratiques, setCasPratiques] = useState<CasPratique[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCp, setSelectedCp] = useState<CasPratique | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'RENDU' | 'CORRIGE' | 'EN_ATTENTE'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    fetchCasPratiques()
  }, [session])

  const fetchCasPratiques = async () => {
    try {
      const res = await fetch('/api/formateur/cas-pratiques')
      if (res.ok) {
        const data = await res.json()
        setCasPratiques(data.casPratiques || [])
      }
    } catch (error) {
      console.error('Erreur chargement cas pratiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (cp: CasPratique) => {
    setSelectedCp(cp)
    setCommentaire(cp.commentaireCorrection || '')
    setShowModal(true)
  }

  const handleSaveCorrection = async () => {
    if (!selectedCp) return
    setSaving(true)
    try {
      const res = await fetch(`/api/formateur/cas-pratiques/${selectedCp.id}/correction`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentaire }),
      })
      if (res.ok) {
        setCasPratiques((prev) =>
          prev.map((cp) =>
            cp.id === selectedCp.id
              ? { ...cp, commentaireCorrection: commentaire, status: 'CORRIGE' }
              : cp
          )
        )
        setSelectedCp((prev) =>
          prev ? { ...prev, commentaireCorrection: commentaire, status: 'CORRIGE' } : null
        )
      }
    } catch (error) {
      console.error('Erreur sauvegarde correction:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUploadCorrection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCp || !e.target.files?.[0]) return
    const file = e.target.files[0]

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      alert('Seuls les fichiers PDF et Word sont accept\u00e9s.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/formateur/cas-pratiques/${selectedCp.id}/upload-correction`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setCasPratiques((prev) =>
          prev.map((cp) =>
            cp.id === selectedCp.id
              ? { ...cp, fichierCorrectionUrl: data.url }
              : cp
          )
        )
        setSelectedCp((prev) =>
          prev ? { ...prev, fichierCorrectionUrl: data.url } : null
        )
      }
    } catch (error) {
      console.error('Erreur upload correction:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredCasPratiques = casPratiques.filter((cp) => {
    if (filter === 'all') return true
    return cp.status === filter
  })

  const statusMap: Record<string, { label: string; cls: string }> = {
    EN_ATTENTE: { label: 'En attente', cls: 'bg-gray-100 text-gray-600' },
    RENDU: { label: 'Rendu', cls: 'bg-yellow-100 text-yellow-700' },
    CORRIGE: { label: 'Corrig\u00e9', cls: 'bg-green-100 text-green-700' },
    EN_RETARD: { label: 'En retard', cls: 'bg-red-100 text-red-700' },
  }

  const columns = [
    {
      key: 'titre',
      label: 'Titre',
      render: (cp: CasPratique) => <span className="font-medium">{cp.titre}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (cp: CasPratique) => {
        const typeLabels: Record<string, string> = {
          REEL: 'R\u00e9el',
          MIXTE: 'Mixte',
          CLUB_FICTIF: 'Club Fictif',
        }
        return <span className="text-sm">{typeLabels[cp.type] || cp.type}</span>
      },
    },
    {
      key: 'stagiaire',
      label: 'Stagiaire',
      render: (cp: CasPratique) => <span>{cp.stagiairePrenom} {cp.stagiaireNom}</span>,
    },
    { key: 'coursTitle', label: 'Cours associ\u00e9' },
    {
      key: 'dateRendu',
      label: 'Date rendu',
      render: (cp: CasPratique) =>
        cp.dateRendu
          ? new Date(cp.dateRendu).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
          : '-',
    },
    {
      key: 'status',
      label: 'Statut',
      render: (cp: CasPratique) => {
        const s = statusMap[cp.status] || { label: cp.status, cls: 'bg-gray-100 text-gray-600' }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
      },
    },
  ]

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cas pratiques</h1>
          <p className="text-gray-500 mt-1">Corrections et suivi des cas pratiques</p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['all', 'RENDU', 'CORRIGE', 'EN_ATTENTE'] as const).map((f) => {
            const count =
              f === 'all' ? casPratiques.length : casPratiques.filter((cp) => cp.status === f).length
            const labels: Record<string, string> = {
              all: 'Tous',
              RENDU: '\u00c0 corriger',
              CORRIGE: 'Corrig\u00e9s',
              EN_ATTENTE: 'En attente',
            }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`card text-center transition-shadow hover:shadow-md ${
                  filter === f ? 'ring-2 ring-weform-blue' : ''
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{labels[f]}</p>
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
            data={filteredCasPratiques}
            onRowClick={openDetail}
            emptyMessage="Aucun cas pratique"
          />
        )}

        {/* Correction Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedCp?.titre || 'Correction'}
          size="xl"
        >
          {selectedCp && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Stagiaire</p>
                  <p className="font-medium">{selectedCp.stagiairePrenom} {selectedCp.stagiaireNom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cours associ\u00e9</p>
                  <p className="font-medium">{selectedCp.coursTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">
                    {selectedCp.type === 'REEL' ? 'R\u00e9el' : selectedCp.type === 'MIXTE' ? 'Mixte' : 'Club Fictif'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (statusMap[selectedCp.status] || { cls: 'bg-gray-100 text-gray-600' }).cls
                  }`}>
                    {(statusMap[selectedCp.status] || { label: selectedCp.status }).label}
                  </span>
                </div>
              </div>

              {/* Commentaire correction */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Commentaire de correction</h4>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="input w-full h-32 resize-none"
                  placeholder="Ajouter votre correction et commentaires..."
                />
                <button
                  onClick={handleSaveCorrection}
                  disabled={saving || !commentaire.trim()}
                  className="btn-primary mt-2"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder la correction'}
                </button>
              </div>

              {/* Upload fichier correction */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Fichier de correction</h4>
                {selectedCp.fichierCorrectionUrl && (
                  <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-700">Fichier de correction envoy\u00e9</span>
                    <a
                      href={selectedCp.fichierCorrectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-weform-blue hover:underline ml-auto"
                    >
                      T\u00e9l\u00e9charger
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleUploadCorrection}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary"
                  >
                    {uploading ? 'Upload en cours...' : 'Uploader un fichier (PDF/Word)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
