'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'

interface Mission {
  id: string
  trimestre: number
  year: number
  description: string
  fichePosteUrl: string | null
  updatedAt: string
  isEditable: boolean
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null)

  useEffect(() => {
    fetchMissions()
  }, [])

  const fetchMissions = () => {
    fetch('/api/stagiaire/missions')
      .then((res) => res.json())
      .then((d) => setMissions(d.missions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleSave = async () => {
    if (!editingMission) return
    setSaving(true)
    try {
      const res = await fetch(`/api/stagiaire/missions/${editingMission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDescription }),
      })
      if (res.ok) {
        setMissions((prev) =>
          prev.map((m) =>
            m.id === editingMission.id
              ? { ...m, description: editDescription, updatedAt: new Date().toISOString() }
              : m
          )
        )
        setEditingMission(null)
      }
    } catch {
      // error handled silently
    } finally {
      setSaving(false)
    }
  }

  const handleUploadFichePoste = async (missionId: string, file: File) => {
    setUploading(missionId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/stagiaire/missions/${missionId}/fiche-poste`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        fetchMissions()
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
      handleUploadFichePoste(uploadTargetId, file)
    }
    e.target.value = ''
  }

  const trimestreLabels = ['1er trimestre', '2e trimestre', '3e trimestre', '4e trimestre']

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes missions</h1>
          <p className="text-sm text-gray-500 mt-1">
            4 mises a jour par an - une par trimestre
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`card border ${
                  mission.isEditable
                    ? 'border-weform-blue/30 bg-blue-50/30'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {trimestreLabels[mission.trimestre - 1] || `Trimestre ${mission.trimestre}`} {mission.year}
                  </h2>
                  {mission.isEditable && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      En cours
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {mission.description || 'Aucune description pour le moment.'}
                  </p>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  Derniere mise a jour :{' '}
                  {new Date(mission.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>

                <div className="flex items-center gap-2 border-t pt-4">
                  {mission.isEditable && (
                    <button
                      onClick={() => {
                        setEditingMission(mission)
                        setEditDescription(mission.description)
                      }}
                      className="px-3 py-1.5 text-xs bg-weform-blue text-white rounded-lg hover:bg-blue-700"
                    >
                      Modifier
                    </button>
                  )}
                  <button
                    onClick={() => triggerUpload(mission.id)}
                    disabled={uploading === mission.id}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {uploading === mission.id
                      ? 'Envoi...'
                      : mission.fichePosteUrl
                      ? 'Remplacer fiche de poste'
                      : 'Deposer fiche de poste'}
                  </button>
                  {mission.fichePosteUrl && (
                    <a
                      href={mission.fichePosteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Voir fiche
                    </a>
                  )}
                </div>
              </div>
            ))}

            {missions.length === 0 && (
              <div className="col-span-2 card text-center py-12">
                <p className="text-gray-400">Aucune mission pour le moment</p>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={!!editingMission}
          onClose={() => setEditingMission(null)}
          title={
            editingMission
              ? `Modifier - ${trimestreLabels[editingMission.trimestre - 1]} ${editingMission.year}`
              : 'Modifier mission'
          }
          size="lg"
        >
          <div className="space-y-4">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-weform-blue focus:border-transparent text-sm"
              placeholder="Decrivez vos missions actuelles..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingMission(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
