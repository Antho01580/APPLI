'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface Cours {
  id: string
  titre: string
  date: string
  heureDebut: string
  heureFin: string
  stagiaires: { id: string; nom: string; prenom: string; present: boolean }[]
  signatureFormateur: boolean
  commentaire: string | null
  compteRendu: string | null
  casPratiqueEnvoye: boolean
  status: string
}

type CasPratiqueType = 'REEL' | 'MIXTE' | 'CLUB_FICTIF'

export default function CoursPage() {
  const { data: session } = useSession()
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCasPratiqueModal, setShowCasPratiqueModal] = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [compteRendu, setCompteRendu] = useState('')
  const [casPratiqueType, setCasPratiqueType] = useState<CasPratiqueType>('REEL')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    if (!session?.user?.id) return
    fetchCours()
  }, [session])

  const fetchCours = async () => {
    try {
      const res = await fetch('/api/formateur/cours')
      if (res.ok) {
        const data = await res.json()
        setCours(data.cours || [])
      }
    } catch (error) {
      console.error('Erreur chargement cours:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (c: Cours) => {
    setSelectedCours(c)
    setCommentaire(c.commentaire || '')
    setCompteRendu(c.compteRendu || '')
    setShowDetailModal(true)
  }

  const handleSignature = async () => {
    if (!selectedCours) return
    setSaving(true)
    try {
      const res = await fetch(`/api/formateur/cours/${selectedCours.id}/signer`, {
        method: 'POST',
      })
      if (res.ok) {
        setCours((prev) =>
          prev.map((c) => (c.id === selectedCours.id ? { ...c, signatureFormateur: true } : c))
        )
        setSelectedCours((prev) => prev ? { ...prev, signatureFormateur: true } : null)
      }
    } catch (error) {
      console.error('Erreur signature:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCommentaire = async () => {
    if (!selectedCours) return
    setSaving(true)
    try {
      const res = await fetch(`/api/formateur/cours/${selectedCours.id}/commentaire`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentaire }),
      })
      if (res.ok) {
        setCours((prev) =>
          prev.map((c) => (c.id === selectedCours.id ? { ...c, commentaire } : c))
        )
        setSelectedCours((prev) => prev ? { ...prev, commentaire } : null)
      }
    } catch (error) {
      console.error('Erreur sauvegarde commentaire:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCompteRendu = async () => {
    if (!selectedCours) return
    setSaving(true)
    try {
      const res = await fetch(`/api/formateur/cours/${selectedCours.id}/compte-rendu`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compteRendu }),
      })
      if (res.ok) {
        setCours((prev) =>
          prev.map((c) => (c.id === selectedCours.id ? { ...c, compteRendu } : c))
        )
        setSelectedCours((prev) => prev ? { ...prev, compteRendu } : null)
      }
    } catch (error) {
      console.error('Erreur sauvegarde compte-rendu:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSendCasPratique = async () => {
    if (!selectedCours) return
    setSaving(true)
    try {
      const res = await fetch(`/api/formateur/cours/${selectedCours.id}/cas-pratique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: casPratiqueType }),
      })
      if (res.ok) {
        setCours((prev) =>
          prev.map((c) => (c.id === selectedCours.id ? { ...c, casPratiqueEnvoye: true } : c))
        )
        setSelectedCours((prev) => prev ? { ...prev, casPratiqueEnvoye: true } : null)
        setShowCasPratiqueModal(false)
      }
    } catch (error) {
      console.error('Erreur envoi cas pratique:', error)
    } finally {
      setSaving(false)
    }
  }

  const now = new Date()
  const filteredCours = cours.filter((c) => {
    if (filter === 'upcoming') return new Date(c.date) >= now
    if (filter === 'past') return new Date(c.date) < now
    return true
  })

  const columns = [
    {
      key: 'titre',
      label: 'Cours',
      render: (c: Cours) => <span className="font-medium">{c.titre}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (c: Cours) => (
        <span>
          {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'horaires',
      label: 'Horaires',
      render: (c: Cours) => <span>{c.heureDebut} - {c.heureFin}</span>,
    },
    {
      key: 'stagiaires',
      label: 'Stagiaires',
      render: (c: Cours) => <span>{c.stagiaires?.length || 0} stagiaire(s)</span>,
    },
    {
      key: 'signatureFormateur',
      label: 'Signature',
      render: (c: Cours) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          c.signatureFormateur ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {c.signatureFormateur ? 'Fait' : 'En attente'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (c: Cours) => {
        const statusMap: Record<string, { label: string; cls: string }> = {
          PLANIFIE: { label: 'Planifi\u00e9', cls: 'bg-blue-100 text-blue-700' },
          EN_COURS: { label: 'En cours', cls: 'bg-yellow-100 text-yellow-700' },
          TERMINE: { label: 'Termin\u00e9', cls: 'bg-green-100 text-green-700' },
          ANNULE: { label: 'Annul\u00e9', cls: 'bg-red-100 text-red-700' },
        }
        const s = statusMap[c.status] || { label: c.status, cls: 'bg-gray-100 text-gray-600' }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
      },
    },
  ]

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des cours</h1>
          <p className="text-gray-500 mt-1">Planification, signatures et suivi des cours</p>
        </div>

        {/* Filters */}
        <div className="card flex items-center gap-4">
          <span className="text-sm text-gray-500">Filtrer :</span>
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-weform-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'upcoming' ? '\u00c0 venir' : 'Pass\u00e9s'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredCours}
            onRowClick={openDetail}
            emptyMessage="Aucun cours trouv\u00e9"
          />
        )}

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedCours?.titre || 'D\u00e9tail du cours'}
          size="xl"
        >
          {selectedCours && (
            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedCours.date).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Horaires</p>
                  <p className="font-medium">{selectedCours.heureDebut} - {selectedCours.heureFin}</p>
                </div>
              </div>

              {/* Attendance */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Stagiaires pr\u00e9sents</h4>
                <div className="space-y-2">
                  {selectedCours.stagiaires?.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{s.prenom} {s.nom}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {s.present ? 'Pr\u00e9sent' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Signature formateur</h4>
                    <p className="text-sm text-gray-500">
                      {selectedCours.signatureFormateur ? 'Cours sign\u00e9' : 'En attente de signature'}
                    </p>
                  </div>
                  {!selectedCours.signatureFormateur && (
                    <button
                      onClick={handleSignature}
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving ? 'Signature...' : 'Signer le cours'}
                    </button>
                  )}
                </div>
              </div>

              {/* Commentaire */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Commentaire</h4>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="input w-full h-24 resize-none"
                  placeholder="Ajouter un commentaire sur le cours..."
                />
                <button
                  onClick={handleSaveCommentaire}
                  disabled={saving}
                  className="btn-secondary mt-2"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder le commentaire'}
                </button>
              </div>

              {/* Compte-rendu */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Compte-rendu</h4>
                <textarea
                  value={compteRendu}
                  onChange={(e) => setCompteRendu(e.target.value)}
                  className="input w-full h-32 resize-none"
                  placeholder="R\u00e9diger le compte-rendu du cours..."
                />
                <button
                  onClick={handleSaveCompteRendu}
                  disabled={saving}
                  className="btn-secondary mt-2"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder le compte-rendu'}
                </button>
              </div>

              {/* Cas pratique */}
              {selectedCours.status === 'TERMINE' && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Cas pratique</h4>
                      <p className="text-sm text-gray-500">
                        {selectedCours.casPratiqueEnvoye
                          ? 'Cas pratique envoy\u00e9 aux stagiaires'
                          : 'Envoyer le cas pratique aux stagiaires'}
                      </p>
                    </div>
                    {!selectedCours.casPratiqueEnvoye && (
                      <button
                        onClick={() => setShowCasPratiqueModal(true)}
                        className="btn-primary"
                      >
                        Envoyer cas pratique
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Cas Pratique Type Modal */}
        <Modal
          isOpen={showCasPratiqueModal}
          onClose={() => setShowCasPratiqueModal(false)}
          title="Envoyer un cas pratique"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choisissez le type de cas pratique \u00e0 envoyer aux stagiaires :
            </p>
            <div className="space-y-3">
              {([
                { value: 'REEL' as CasPratiqueType, label: 'R\u00e9el', desc: 'Bas\u00e9 sur un cas r\u00e9el d\'entreprise' },
                { value: 'MIXTE' as CasPratiqueType, label: 'Mixte', desc: 'Combinaison de cas r\u00e9el et fictif' },
                { value: 'CLUB_FICTIF' as CasPratiqueType, label: 'Club Fictif', desc: 'Cas pratique bas\u00e9 sur le club fictif' },
              ]).map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    casPratiqueType === option.value
                      ? 'border-weform-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="casPratiqueType"
                    value={option.value}
                    checked={casPratiqueType === option.value}
                    onChange={(e) => setCasPratiqueType(e.target.value as CasPratiqueType)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowCasPratiqueModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleSendCasPratique}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
