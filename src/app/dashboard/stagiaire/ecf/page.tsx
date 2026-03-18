'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'

interface ECF {
  id: string
  numero: number
  title: string
  status: 'A_VENIR' | 'EN_COURS' | 'RENDU' | 'CORRIGE'
  dateDebut: string | null
  dateFin: string | null
  dateJury: string | null
  renduAt: string | null
  renduFileUrl: string | null
  correction: string | null
  correctionFileUrl: string | null
  note: number | null
}

const statusColors: Record<string, string> = {
  A_VENIR: 'bg-gray-100 text-gray-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  RENDU: 'bg-yellow-100 text-yellow-800',
  CORRIGE: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  A_VENIR: 'A venir',
  EN_COURS: 'En cours',
  RENDU: 'Rendu',
  CORRIGE: 'Corrige',
}

function getCountdown(targetDate: string): string {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'Passe'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 30) {
    const months = Math.floor(days / 30)
    return `${months} mois et ${days % 30} jours`
  }
  return `${days} jour${days > 1 ? 's' : ''}`
}

export default function ECFPage() {
  const [ecfs, setEcfs] = useState<ECF[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ECF | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stagiaire/ecf')
      .then((res) => res.json())
      .then((d) => setEcfs(d.ecfs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (ecfId: string, file: File) => {
    setUploading(ecfId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/stagiaire/ecf/${ecfId}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const updated = await res.json()
        setEcfs((prev) => prev.map((e) => (e.id === ecfId ? { ...e, ...updated } : e)))
        if (selected?.id === ecfId) {
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

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Evaluations en Cours de Formation (ECF)</h1>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.zip"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ecfs.map((ecf) => (
              <div
                key={ecf.id}
                className="card cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
                onClick={() => setSelected(ecf)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">ECF {ecf.numero}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[ecf.status]}`}>
                    {statusLabels[ecf.status]}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{ecf.title}</p>

                <div className="space-y-2 text-sm">
                  {ecf.dateDebut && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Debut</span>
                      <span>{new Date(ecf.dateDebut).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {ecf.dateFin && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fin</span>
                      <span>{new Date(ecf.dateFin).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {ecf.dateJury && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Jury</span>
                      <span className="font-medium text-orange-600">
                        {new Date(ecf.dateJury).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                {ecf.dateFin && ecf.status !== 'CORRIGE' && ecf.status !== 'RENDU' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Compte a rebours</p>
                    <p className="text-lg font-bold text-blue-700">{getCountdown(ecf.dateFin)}</p>
                  </div>
                )}

                {ecf.note !== null && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Note</p>
                    <p className="text-2xl font-bold text-green-700">{ecf.note}/20</p>
                  </div>
                )}

                <div className="mt-4">
                  {(ecf.status === 'EN_COURS') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        triggerUpload(ecf.id)
                      }}
                      disabled={uploading === ecf.id}
                      className="w-full px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {uploading === ecf.id ? 'Envoi...' : 'Deposer mon rendu'}
                    </button>
                  )}
                  {ecf.status === 'CORRIGE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(ecf)
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Voir la correction
                    </button>
                  )}
                </div>
              </div>
            ))}

            {ecfs.length === 0 && (
              <div className="col-span-3 card text-center py-12">
                <p className="text-gray-400">Aucun ECF disponible</p>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected ? `ECF ${selected.numero} - ${selected.title}` : 'ECF'}
          size="lg"
        >
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selected.status]}`}>
                    {statusLabels[selected.status]}
                  </span>
                </div>
                {selected.dateDebut && (
                  <div>
                    <p className="text-sm text-gray-500">Date de debut</p>
                    <p className="font-medium">
                      {new Date(selected.dateDebut).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selected.dateFin && (
                  <div>
                    <p className="text-sm text-gray-500">Date de fin</p>
                    <p className="font-medium">
                      {new Date(selected.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selected.dateJury && (
                  <div>
                    <p className="text-sm text-gray-500">Date du jury</p>
                    <p className="font-medium text-orange-600">
                      {new Date(selected.dateJury).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selected.note !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Note</p>
                    <p className="text-2xl font-bold text-green-700">{selected.note}/20</p>
                  </div>
                )}
              </div>

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
                <a
                  href={selected.renduFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                >
                  Telecharger mon rendu
                </a>
              )}

              {selected.status === 'CORRIGE' && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Correction</p>
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

              {selected.status === 'EN_COURS' && (
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
