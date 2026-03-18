'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'

interface DossierPro {
  id: string
  content: string
  lastUpdated: string
  formateurElements: {
    id: string
    content: string
    addedBy: string
    addedAt: string
  }[]
  dedicatedDay: {
    date: string
    status: string
  } | null
}

export default function DossierProPage() {
  const [dossier, setDossier] = useState<DossierPro | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduling, setScheduling] = useState(false)

  useEffect(() => {
    fetch('/api/stagiaire/dossier-pro')
      .then((res) => res.json())
      .then((d) => {
        setDossier(d)
        setContent(d.content || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/stagiaire/dossier-pro', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDossier((prev) => (prev ? { ...prev, content, lastUpdated: updated.lastUpdated } : prev))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // error handled silently
    } finally {
      setSaving(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduleDate) return
    setScheduling(true)
    try {
      const res = await fetch('/api/stagiaire/dossier-pro/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: scheduleDate }),
      })
      if (res.ok) {
        const data = await res.json()
        setDossier((prev) => (prev ? { ...prev, dedicatedDay: data.dedicatedDay } : prev))
        setShowSchedule(false)
        setScheduleDate('')
      }
    } catch {
      // error handled silently
    } finally {
      setScheduling(false)
    }
  }

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dossier professionnel</h1>
          <button
            onClick={() => setShowSchedule(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Planifier une journee dediee
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <>
            {dossier?.dedicatedDay && (
              <div className="card bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Journee dediee planifiee</p>
                    <p className="text-lg font-bold text-blue-900">
                      {new Date(dossier.dedicatedDay.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {dossier.dedicatedDay.status}
                  </span>
                </div>
              </div>
            )}

            {/* Editor */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Contenu du dossier</h2>
                <div className="flex items-center gap-3">
                  {dossier?.lastUpdated && (
                    <span className="text-xs text-gray-400">
                      Derniere modification :{' '}
                      {new Date(dossier.lastUpdated).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  {saved && (
                    <span className="text-sm text-green-600 font-medium">Sauvegarde !</span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-weform-blue focus:border-transparent text-sm leading-relaxed"
                placeholder="Redigez votre dossier professionnel ici..."
              />
            </div>

            {/* Formateur elements */}
            {dossier?.formateurElements && dossier.formateurElements.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Elements ajoutes par le formateur
                </h2>
                <div className="space-y-3">
                  {dossier.formateurElements.map((el) => (
                    <div key={el.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-800">{el.addedBy}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(el.addedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{el.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Modal
          isOpen={showSchedule}
          onClose={() => setShowSchedule(false)}
          title="Planifier une journee dediee"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choisissez une date pour votre journee dediee au dossier professionnel.
            </p>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-weform-blue"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSchedule(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSchedule}
                disabled={scheduling || !scheduleDate}
                className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {scheduling ? 'Planification...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
