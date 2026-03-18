'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface QuestionnaireInitial {
  id: string
  nom: string
  prenom: string
  club: string
  prerequis: string | null
  besoinsClub: string | null
  besoinPC: boolean
  createdAt: string
  stagiaire: {
    id: string
    prerequisValides: boolean
    user: { email: string }
    formation: { nom: string } | null
  }
}

interface CompteRendu {
  id: string
  commercial: string
  contenu: string
  prerequisValides: boolean
  dateEntretien: string
  stagiaire: {
    id: string
    user: { nom: string; prenom: string }
  }
}

export default function RecrutementPage() {
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'entretien' | 'prerequis'>('questionnaire')
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireInitial[]>([])
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)
  const [showEntretienModal, setShowEntretienModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [questionnaireForm, setQuestionnaireForm] = useState({
    stagiaireId: '',
    nom: '',
    prenom: '',
    club: '',
    prerequis: '',
    besoinsClub: '',
    besoinPC: false,
  })

  const [entretienForm, setEntretienForm] = useState({
    stagiaireId: '',
    commercial: '',
    contenu: '',
    prerequisValides: false,
    dateEntretien: '',
  })

  const [stagiairesOptions, setStagiairesOptions] = useState<{ id: string; nom: string; prenom: string }[]>([])

  async function fetchData() {
    setLoading(true)
    try {
      const [qRes, crRes, stRes] = await Promise.all([
        fetch('/api/admin/recrutement/questionnaires'),
        fetch('/api/admin/recrutement/entretiens'),
        fetch('/api/admin/stagiaires?limit=100'),
      ])
      if (qRes.ok) {
        const data = await qRes.json()
        setQuestionnaires(data.questionnaires || [])
      }
      if (crRes.ok) {
        const data = await crRes.json()
        setComptesRendus(data.comptesRendus || [])
      }
      if (stRes.ok) {
        const data = await stRes.json()
        setStagiairesOptions(
          (data.stagiaires || []).map((s: any) => ({
            id: s.id,
            nom: s.user.nom,
            prenom: s.user.prenom,
          }))
        )
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

  async function handleCreateQuestionnaire(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/recrutement/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionnaireForm),
      })
      if (res.ok) {
        setShowQuestionnaireModal(false)
        setQuestionnaireForm({ stagiaireId: '', nom: '', prenom: '', club: '', prerequis: '', besoinsClub: '', besoinPC: false })
        fetchData()
      }
    } catch (error) {
      console.error('Erreur creation questionnaire:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateEntretien(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/recrutement/entretiens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entretienForm),
      })
      if (res.ok) {
        setShowEntretienModal(false)
        setEntretienForm({ stagiaireId: '', commercial: '', contenu: '', prerequisValides: false, dateEntretien: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Erreur creation entretien:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleValidatePrerequis(stagiaireId: string) {
    try {
      await fetch(`/api/admin/stagiaires/${stagiaireId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prerequisValides: true }),
      })
      fetchData()
    } catch (error) {
      console.error('Erreur validation prerequis:', error)
    }
  }

  const questionnaireColumns = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prenom' },
    { key: 'club', label: 'Club' },
    {
      key: 'prerequis',
      label: 'Prerequis',
      render: (q: QuestionnaireInitial) => q.prerequis || <span className="text-gray-400">-</span>,
    },
    {
      key: 'besoinsClub',
      label: 'Besoins du club',
      render: (q: QuestionnaireInitial) => q.besoinsClub || <span className="text-gray-400">-</span>,
    },
    {
      key: 'besoinPC',
      label: 'Besoin PC',
      render: (q: QuestionnaireInitial) => (
        <span className={`text-xs px-2 py-1 rounded-full ${q.besoinPC ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
          {q.besoinPC ? 'Oui' : 'Non'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (q: QuestionnaireInitial) => new Date(q.createdAt).toLocaleDateString('fr-FR'),
    },
  ]

  const entretienColumns = [
    {
      key: 'stagiaire',
      label: 'Stagiaire',
      render: (cr: CompteRendu) => `${cr.stagiaire.user.prenom} ${cr.stagiaire.user.nom}`,
    },
    { key: 'commercial', label: 'Commercial' },
    {
      key: 'dateEntretien',
      label: 'Date',
      render: (cr: CompteRendu) => new Date(cr.dateEntretien).toLocaleDateString('fr-FR'),
    },
    {
      key: 'contenu',
      label: 'Compte-rendu',
      render: (cr: CompteRendu) => (
        <span className="text-sm line-clamp-2">{cr.contenu}</span>
      ),
    },
    {
      key: 'prerequisValides',
      label: 'Prerequis',
      render: (cr: CompteRendu) => (
        <span className={`text-xs px-2 py-1 rounded-full ${cr.prerequisValides ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {cr.prerequisValides ? 'Valides' : 'Non valides'}
        </span>
      ),
    },
  ]

  const prerequisColumns = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prenom' },
    { key: 'club', label: 'Club' },
    {
      key: 'formation',
      label: 'Formation',
      render: (q: QuestionnaireInitial) => q.stagiaire?.formation?.nom || <span className="text-gray-400">-</span>,
    },
    {
      key: 'prerequis',
      label: 'Prerequis declares',
      render: (q: QuestionnaireInitial) => q.prerequis || <span className="text-gray-400">-</span>,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (q: QuestionnaireInitial) => (
        <span className={`text-xs px-2 py-1 rounded-full ${q.stagiaire.prerequisValides ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {q.stagiaire.prerequisValides ? 'Valides' : 'A valider'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (q: QuestionnaireInitial) =>
        !q.stagiaire.prerequisValides ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleValidatePrerequis(q.stagiaire.id)
            }}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
          >
            Valider
          </button>
        ) : (
          <span className="text-xs text-gray-400">Valides</span>
        ),
    },
  ]

  const tabs = [
    { id: 'questionnaire' as const, label: 'Questionnaire fin de RDV' },
    { id: 'entretien' as const, label: 'Comptes-rendus d\'entretien' },
    { id: 'prerequis' as const, label: 'Validation prerequis' },
  ]

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Recrutement</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-weform-blue text-weform-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <>
            {activeTab === 'questionnaire' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowQuestionnaireModal(true)} className="btn-primary">
                    Nouveau questionnaire
                  </button>
                </div>
                <DataTable columns={questionnaireColumns} data={questionnaires} emptyMessage="Aucun questionnaire" />
              </div>
            )}

            {activeTab === 'entretien' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowEntretienModal(true)} className="btn-primary">
                    Nouveau compte-rendu
                  </button>
                </div>
                <DataTable columns={entretienColumns} data={comptesRendus} emptyMessage="Aucun compte-rendu" />
              </div>
            )}

            {activeTab === 'prerequis' && (
              <DataTable columns={prerequisColumns} data={questionnaires} emptyMessage="Aucun questionnaire" />
            )}
          </>
        )}

        {/* Questionnaire Modal */}
        <Modal isOpen={showQuestionnaireModal} onClose={() => setShowQuestionnaireModal(false)} title="Questionnaire de fin de rendez-vous" size="lg">
          <form onSubmit={handleCreateQuestionnaire} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stagiaire</label>
              <select
                className="input-field"
                value={questionnaireForm.stagiaireId}
                onChange={(e) => setQuestionnaireForm({ ...questionnaireForm, stagiaireId: e.target.value })}
                required
              >
                <option value="">Selectionner un stagiaire</option>
                {stagiairesOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  className="input-field"
                  value={questionnaireForm.nom}
                  onChange={(e) => setQuestionnaireForm({ ...questionnaireForm, nom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                <input
                  type="text"
                  className="input-field"
                  value={questionnaireForm.prenom}
                  onChange={(e) => setQuestionnaireForm({ ...questionnaireForm, prenom: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <input
                type="text"
                className="input-field"
                value={questionnaireForm.club}
                onChange={(e) => setQuestionnaireForm({ ...questionnaireForm, club: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prerequis</label>
              <textarea
                className="input-field"
                rows={3}
                value={questionnaireForm.prerequis}
                onChange={(e) => setQuestionnaireForm({ ...questionnaireForm, prerequis: e.target.value })}
                placeholder="Diplomes, experience..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Besoins du club</label>
              <textarea
                className="input-field"
                rows={3}
                value={questionnaireForm.besoinsClub}
                onChange={(e) => setQuestionnaireForm({ ...questionnaireForm, besoinsClub: e.target.value })}
                placeholder="Besoins identifies par le club..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="besoinPC"
                checked={questionnaireForm.besoinPC}
                onChange={(e) => setQuestionnaireForm({ ...questionnaireForm, besoinPC: e.target.checked })}
                className="rounded border-gray-300 text-weform-blue focus:ring-weform-blue"
              />
              <label htmlFor="besoinPC" className="text-sm text-gray-700">Besoin d&apos;un PC</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowQuestionnaireModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Entretien Modal */}
        <Modal isOpen={showEntretienModal} onClose={() => setShowEntretienModal(false)} title="Compte-rendu d'entretien" size="lg">
          <form onSubmit={handleCreateEntretien} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stagiaire</label>
              <select
                className="input-field"
                value={entretienForm.stagiaireId}
                onChange={(e) => setEntretienForm({ ...entretienForm, stagiaireId: e.target.value })}
                required
              >
                <option value="">Selectionner un stagiaire</option>
                {stagiairesOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commercial</label>
                <input
                  type="text"
                  className="input-field"
                  value={entretienForm.commercial}
                  onChange={(e) => setEntretienForm({ ...entretienForm, commercial: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de l&apos;entretien</label>
                <input
                  type="date"
                  className="input-field"
                  value={entretienForm.dateEntretien}
                  onChange={(e) => setEntretienForm({ ...entretienForm, dateEntretien: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compte-rendu</label>
              <textarea
                className="input-field"
                rows={5}
                value={entretienForm.contenu}
                onChange={(e) => setEntretienForm({ ...entretienForm, contenu: e.target.value })}
                required
                placeholder="Resume de l'entretien, observations..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prerequisValides"
                checked={entretienForm.prerequisValides}
                onChange={(e) => setEntretienForm({ ...entretienForm, prerequisValides: e.target.checked })}
                className="rounded border-gray-300 text-weform-blue focus:ring-weform-blue"
              />
              <label htmlFor="prerequisValides" className="text-sm text-gray-700">Prerequis valides</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowEntretienModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
