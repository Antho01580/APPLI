'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import ProgressBar from '@/components/ui/ProgressBar'
import Modal from '@/components/ui/Modal'

interface StagiaireDossier {
  id: string
  nom: string
  prenom: string
  entreprise: string
  dossierProStatus: string
  elementsCompletes: number
  totalElements: number
  needsDedicatedDay: boolean
}

interface DossierElement {
  id: string
  titre: string
  type: string
  status: string
  contenu: string | null
  commentaireFormateur: string | null
  dateModification: string | null
}

interface DossierDetail {
  stagiaireId: string
  stagiaireNom: string
  stagiairePrenom: string
  elements: DossierElement[]
}

export default function DossiersProPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('stagiaireId')
  const [stagiaires, setStagiaires] = useState<StagiaireDossier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDossier, setSelectedDossier] = useState<DossierDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showElementModal, setShowElementModal] = useState(false)
  const [selectedElement, setSelectedElement] = useState<DossierElement | null>(null)
  const [elementComment, setElementComment] = useState('')
  const [newElementTitle, setNewElementTitle] = useState('')
  const [newElementType, setNewElementType] = useState('ANNEXE')
  const [showAddModal, setShowAddModal] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    fetchStagiaires()
  }, [session])

  useEffect(() => {
    if (preselectedId && stagiaires.length > 0) {
      openDossier(preselectedId)
    }
  }, [preselectedId, stagiaires])

  const fetchStagiaires = async () => {
    try {
      const res = await fetch('/api/formateur/dossiers-pro')
      if (res.ok) {
        const data = await res.json()
        setStagiaires(data.stagiaires || [])
      }
    } catch (error) {
      console.error('Erreur chargement dossiers pro:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDossier = async (stagiaireId: string) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    try {
      const res = await fetch(`/api/formateur/dossiers-pro/${stagiaireId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedDossier(data)
      }
    } catch (error) {
      console.error('Erreur chargement dossier:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const openElement = (element: DossierElement) => {
    setSelectedElement(element)
    setElementComment(element.commentaireFormateur || '')
    setShowElementModal(true)
  }

  const handleSaveComment = async () => {
    if (!selectedDossier || !selectedElement) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/formateur/dossiers-pro/${selectedDossier.stagiaireId}/elements/${selectedElement.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commentaireFormateur: elementComment }),
        }
      )
      if (res.ok) {
        setSelectedDossier((prev) => {
          if (!prev) return null
          return {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === selectedElement.id ? { ...el, commentaireFormateur: elementComment } : el
            ),
          }
        })
        setShowElementModal(false)
      }
    } catch (error) {
      console.error('Erreur sauvegarde commentaire:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddElement = async () => {
    if (!selectedDossier || !newElementTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/formateur/dossiers-pro/${selectedDossier.stagiaireId}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: newElementTitle, type: newElementType }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedDossier((prev) => {
          if (!prev) return null
          return { ...prev, elements: [...prev.elements, data.element] }
        })
        setShowAddModal(false)
        setNewElementTitle('')
        setNewElementType('ANNEXE')
      }
    } catch (error) {
      console.error('Erreur ajout \u00e9l\u00e9ment:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleNotifyDedicatedDay = async (stagiaireId: string) => {
    try {
      await fetch(`/api/formateur/dossiers-pro/${stagiaireId}/notify-dedicated-day`, {
        method: 'POST',
      })
      alert('Notification envoy\u00e9e au stagiaire pour planifier une journ\u00e9e d\u00e9di\u00e9e.')
    } catch (error) {
      console.error('Erreur notification:', error)
    }
  }

  const statusColors: Record<string, string> = {
    NON_COMMENCE: 'bg-gray-100 text-gray-600',
    EN_COURS: 'bg-yellow-100 text-yellow-700',
    COMPLET: 'bg-green-100 text-green-700',
    A_REVISER: 'bg-orange-100 text-orange-700',
  }

  const statusLabels: Record<string, string> = {
    NON_COMMENCE: 'Non commenc\u00e9',
    EN_COURS: 'En cours',
    COMPLET: 'Complet',
    A_REVISER: '\u00c0 r\u00e9viser',
  }

  const columns = [
    {
      key: 'nom',
      label: 'Stagiaire',
      render: (s: StagiaireDossier) => <span className="font-medium">{s.prenom} {s.nom}</span>,
    },
    { key: 'entreprise', label: 'Entreprise' },
    {
      key: 'progression',
      label: 'Progression',
      render: (s: StagiaireDossier) => (
        <ProgressBar value={s.elementsCompletes} max={s.totalElements} color="bg-weform-blue" showCount />
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (s: StagiaireDossier) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.dossierProStatus] || 'bg-gray-100 text-gray-600'}`}>
          {statusLabels[s.dossierProStatus] || s.dossierProStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (s: StagiaireDossier) =>
        s.needsDedicatedDay ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNotifyDedicatedDay(s.id)
            }}
            className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200"
          >
            Planifier journ\u00e9e d\u00e9di\u00e9e
          </button>
        ) : null,
    },
  ]

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dossiers professionnels</h1>
          <p className="text-gray-500 mt-1">Suivi et accompagnement des dossiers de vos stagiaires</p>
        </div>

        {/* Alerts */}
        {stagiaires.filter((s) => s.needsDedicatedDay).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium text-orange-800">
                {stagiaires.filter((s) => s.needsDedicatedDay).length} stagiaire(s) doivent planifier une journ\u00e9e d\u00e9di\u00e9e au dossier pro
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={stagiaires}
            onRowClick={(s) => openDossier(s.id)}
            emptyMessage="Aucun dossier professionnel"
          />
        )}

        {/* Dossier Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setSelectedDossier(null) }}
          title={selectedDossier ? `Dossier de ${selectedDossier.stagiairePrenom} ${selectedDossier.stagiaireNom}` : 'Dossier professionnel'}
          size="xl"
        >
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
            </div>
          ) : selectedDossier ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selectedDossier.elements.filter((e) => e.status === 'COMPLET').length} / {selectedDossier.elements.length} \u00e9l\u00e9ments compl\u00e9t\u00e9s
                </p>
                <button onClick={() => setShowAddModal(true)} className="btn-secondary text-sm">
                  Ajouter un \u00e9l\u00e9ment
                </button>
              </div>

              <div className="space-y-2">
                {selectedDossier.elements.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => openElement(el)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{el.titre}</p>
                      <p className="text-xs text-gray-500">{el.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {el.commentaireFormateur && (
                        <svg className="w-4 h-4 text-weform-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[el.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[el.status] || el.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center">Erreur de chargement</p>
          )}
        </Modal>

        {/* Element Detail Modal */}
        <Modal
          isOpen={showElementModal}
          onClose={() => setShowElementModal(false)}
          title={selectedElement?.titre || '\u00c9l\u00e9ment'}
          size="lg"
        >
          {selectedElement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{selectedElement.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedElement.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[selectedElement.status] || selectedElement.status}
                  </span>
                </div>
              </div>

              {selectedElement.contenu && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contenu du stagiaire</h4>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedElement.contenu}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Commentaire / amendement formateur</h4>
                <textarea
                  value={elementComment}
                  onChange={(e) => setElementComment(e.target.value)}
                  className="input w-full h-32 resize-none"
                  placeholder="Ajouter un commentaire ou un amendement..."
                />
                <button onClick={handleSaveComment} disabled={saving} className="btn-primary mt-2">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Element Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Ajouter un \u00e9l\u00e9ment"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={newElementTitle}
                onChange={(e) => setNewElementTitle(e.target.value)}
                className="input w-full"
                placeholder="Titre de l'\u00e9l\u00e9ment..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newElementType}
                onChange={(e) => setNewElementType(e.target.value)}
                className="input w-full"
              >
                <option value="ANNEXE">Annexe</option>
                <option value="FICHE_ACTIVITE">Fiche d&apos;activit\u00e9</option>
                <option value="COMPTE_RENDU">Compte-rendu</option>
                <option value="ATTESTATION">Attestation</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button
                onClick={handleAddElement}
                disabled={saving || !newElementTitle.trim()}
                className="btn-primary"
              >
                {saving ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
