'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface CasPratique {
  id: string
  title: string
  type: 'REEL' | 'MIXTE' | 'CLUB_FICTIF'
  status: 'EN_ATTENTE' | 'RENDU' | 'CORRIGE'
  dueDate: string | null
  renduAt: string | null
  renduFileUrl: string | null
  correction: string | null
  correctionFileUrl: string | null
  note: number | null
  coursAssociated: string | null
}

const statusColors: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  RENDU: 'bg-blue-100 text-blue-800',
  CORRIGE: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  RENDU: 'Rendu',
  CORRIGE: 'Corrige',
}

const typeColors: Record<string, string> = {
  REEL: 'bg-emerald-100 text-emerald-800',
  MIXTE: 'bg-amber-100 text-amber-800',
  CLUB_FICTIF: 'bg-violet-100 text-violet-800',
}

const typeLabels: Record<string, string> = {
  REEL: 'Reel',
  MIXTE: 'Mixte',
  CLUB_FICTIF: 'Club fictif',
}

export default function CasPratiquesPage() {
  const [casPratiques, setCasPratiques] = useState<CasPratique[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CasPratique | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    fetch('/api/stagiaire/cas-pratiques')
      .then((res) => res.json())
      .then((d) => setCasPratiques(d.casPratiques || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleUpload = async (casPratiqueId: string, file: File) => {
    setUploading(casPratiqueId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/stagiaire/cas-pratiques/${casPratiqueId}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const updated = await res.json()
        setCasPratiques((prev) =>
          prev.map((cp) => (cp.id === casPratiqueId ? { ...cp, ...updated } : cp))
        )
        if (selected?.id === casPratiqueId) {
          setSelected((prev) => (prev ? { ...prev, ...updated } : prev))
        }
      }
    } catch {
      // error handled silently
    } finally {
      setUploading(null)
      setUploadTargetId(null)
    }
  }

  const triggerUpload = (id: string) => {
    setUploadTargetId(id)
    fileInputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadTargetId) {
      handleUpload(uploadTargetId, file)
    }
    e.target.value = ''
  }

  const columns = [
    {
      key: 'title',
      label: 'Cas pratique',
      render: (item: CasPratique) => (
        <span className="font-medium text-gray-900">{item.title}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item: CasPratique) => (
        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[item.type]}`}>
          {typeLabels[item.type]}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: CasPratique) => (
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[item.status]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Date limite',
      render: (item: CasPratique) =>
        item.dueDate ? (
          <span className="text-sm">
            {new Date(item.dueDate).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: 'note',
      label: 'Note',
      render: (item: CasPratique) =>
        item.note !== null ? (
          <span className="font-medium text-gray-900">{item.note}/20</span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: CasPratique) => (
        <div className="flex items-center gap-2">
          {item.status === 'EN_ATTENTE' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                triggerUpload(item.id)
              }}
              disabled={uploading === item.id}
              className="px-3 py-1 text-xs bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading === item.id ? 'Envoi...' : 'Rendre'}
            </button>
          )}
          {item.status === 'CORRIGE' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelected(item)
              }}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Voir correction
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cas pratiques</h1>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={casPratiques}
            onRowClick={(item) => setSelected(item)}
            emptyMessage="Aucun cas pratique disponible"
          />
        )}

        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.title || 'Detail du cas pratique'}
          size="lg"
        >
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${typeColors[selected.type]}`}>
                    {typeLabels[selected.type]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selected.status]}`}>
                    {statusLabels[selected.status]}
                  </span>
                </div>
                {selected.dueDate && (
                  <div>
                    <p className="text-sm text-gray-500">Date limite</p>
                    <p className="font-medium">
                      {new Date(selected.dueDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selected.note !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Note</p>
                    <p className="font-medium text-lg">{selected.note}/20</p>
                  </div>
                )}
              </div>

              {selected.coursAssociated && (
                <div>
                  <p className="text-sm text-gray-500">Cours associe</p>
                  <p className="font-medium">{selected.coursAssociated}</p>
                </div>
              )}

              {selected.renduAt && (
                <div>
                  <p className="text-sm text-gray-500">Rendu le</p>
                  <p className="text-sm">
                    {new Date(selected.renduAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {selected.renduFileUrl && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fichier rendu</p>
                  <a
                    href={selected.renduFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Telecharger le rendu
                  </a>
                </div>
              )}

              {selected.status === 'CORRIGE' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Correction</p>
                  {selected.correction && (
                    <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap mb-3">
                      {selected.correction}
                    </div>
                  )}
                  {selected.correctionFileUrl && (
                    <a
                      href={selected.correctionFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200"
                    >
                      Telecharger la correction
                    </a>
                  )}
                </div>
              )}

              {selected.status === 'EN_ATTENTE' && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => triggerUpload(selected.id)}
                    disabled={uploading === selected.id}
                    className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading === selected.id ? 'Envoi en cours...' : 'Deposer mon rendu'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
