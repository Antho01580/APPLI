'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'

interface RelationTrimestrielle {
  id: string
  trimestre: string
  annee: number
  problemes: string
  difficultes: string
  plateformeRetour: string
  ameliorationContinue: string
  status: string
  dateSoumission: string | null
  dateCreation: string
}

export default function RelationsPage() {
  const { data: session } = useSession()
  const [relations, setRelations] = useState<RelationTrimestrielle[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRelation, setSelectedRelation] = useState<RelationTrimestrielle | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    trimestre: 'T1',
    annee: new Date().getFullYear(),
    problemes: '',
    difficultes: '',
    plateformeRetour: '',
    ameliorationContinue: '',
  })

  useEffect(() => {
    if (!session?.user?.id) return
    fetchRelations()
  }, [session])

  const fetchRelations = async () => {
    try {
      const res = await fetch('/api/formateur/relations')
      if (res.ok) {
        const data = await res.json()
        setRelations(data.relations || [])
      }
    } catch (error) {
      console.error('Erreur chargement relations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/formateur/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setRelations((prev) => [data.relation, ...prev])
        setShowFormModal(false)
        setForm({
          trimestre: 'T1',
          annee: new Date().getFullYear(),
          problemes: '',
          difficultes: '',
          plateformeRetour: '',
          ameliorationContinue: '',
        })
      }
    } catch (error) {
      console.error('Erreur soumission relation:', error)
    } finally {
      setSaving(false)
    }
  }

  const openDetail = (r: RelationTrimestrielle) => {
    setSelectedRelation(r)
    setShowDetailModal(true)
  }

  const trimestreLabels: Record<string, string> = {
    T1: '1er trimestre',
    T2: '2\u00e8me trimestre',
    T3: '3\u00e8me trimestre',
    T4: '4\u00e8me trimestre',
  }

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relations trimestrielles</h1>
            <p className="text-gray-500 mt-1">Retours et am\u00e9liorations par trimestre</p>
          </div>
          <button onClick={() => setShowFormModal(true)} className="btn-primary">
            Nouvelle relation
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : relations.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 mb-4">Aucune relation trimestrielle soumise</p>
            <button onClick={() => setShowFormModal(true)} className="btn-primary">
              Cr\u00e9er la premi\u00e8re relation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relations.map((r) => (
              <div
                key={r.id}
                onClick={() => openDetail(r)}
                className="card cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {trimestreLabels[r.trimestre] || r.trimestre} {r.annee}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {r.dateSoumission
                        ? `Soumis le ${new Date(r.dateSoumission).toLocaleDateString('fr-FR')}`
                        : `Cr\u00e9\u00e9 le ${new Date(r.dateCreation).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.status === 'SOUMIS'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {r.status === 'SOUMIS' ? 'Soumis' : 'Brouillon'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Probl\u00e8mes</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{r.problemes || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Difficult\u00e9s</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{r.difficultes || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Relation Form Modal */}
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title="Nouvelle relation trimestrielle"
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trimestre</label>
                <select
                  value={form.trimestre}
                  onChange={(e) => setForm({ ...form, trimestre: e.target.value })}
                  className="input w-full"
                >
                  <option value="T1">1er trimestre</option>
                  <option value="T2">2\u00e8me trimestre</option>
                  <option value="T3">3\u00e8me trimestre</option>
                  <option value="T4">4\u00e8me trimestre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ann\u00e9e</label>
                <input
                  type="number"
                  value={form.annee}
                  onChange={(e) => setForm({ ...form, annee: parseInt(e.target.value) })}
                  className="input w-full"
                  min={2020}
                  max={2030}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Probl\u00e8mes rencontr\u00e9s
              </label>
              <textarea
                value={form.problemes}
                onChange={(e) => setForm({ ...form, problemes: e.target.value })}
                className="input w-full h-24 resize-none"
                placeholder="D\u00e9crivez les probl\u00e8mes rencontr\u00e9s ce trimestre..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficult\u00e9s
              </label>
              <textarea
                value={form.difficultes}
                onChange={(e) => setForm({ ...form, difficultes: e.target.value })}
                className="input w-full h-24 resize-none"
                placeholder="D\u00e9crivez les difficult\u00e9s observ\u00e9es..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retour plateforme
              </label>
              <textarea
                value={form.plateformeRetour}
                onChange={(e) => setForm({ ...form, plateformeRetour: e.target.value })}
                className="input w-full h-24 resize-none"
                placeholder="Vos retours sur la plateforme..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Am\u00e9lioration continue
              </label>
              <textarea
                value={form.ameliorationContinue}
                onChange={(e) => setForm({ ...form, ameliorationContinue: e.target.value })}
                className="input w-full h-24 resize-none"
                placeholder="Suggestions d'am\u00e9lioration..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowFormModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary">
                {saving ? 'Soumission...' : 'Soumettre'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={
            selectedRelation
              ? `${trimestreLabels[selectedRelation.trimestre] || selectedRelation.trimestre} ${selectedRelation.annee}`
              : 'D\u00e9tail'
          }
          size="xl"
        >
          {selectedRelation && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedRelation.status === 'SOUMIS'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {selectedRelation.status === 'SOUMIS' ? 'Soumis' : 'Brouillon'}
                </span>
                {selectedRelation.dateSoumission && (
                  <p className="text-sm text-gray-400">
                    Soumis le {new Date(selectedRelation.dateSoumission).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Probl\u00e8mes rencontr\u00e9s</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedRelation.problemes || 'Aucun probl\u00e8me signal\u00e9'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Difficult\u00e9s</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedRelation.difficultes || 'Aucune difficult\u00e9 signal\u00e9e'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Retour plateforme</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedRelation.plateformeRetour || 'Aucun retour'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Am\u00e9lioration continue</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedRelation.ameliorationContinue || 'Aucune suggestion'}
                </p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
