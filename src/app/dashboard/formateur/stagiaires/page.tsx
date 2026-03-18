'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import ProgressBar from '@/components/ui/ProgressBar'
import Modal from '@/components/ui/Modal'

interface Stagiaire {
  id: string
  nom: string
  prenom: string
  email: string
  entreprise: string
  tuteurNom: string
  progressCours: number
  totalCours: number
  progressCasPratiques: number
  totalCasPratiques: number
  progressElearning: number
  totalElearning: number
  progressECF: number
  totalECF: number
  dossierProStatus: string
}

interface StagiaireDetail {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  entreprise: string
  tuteurNom: string
  tuteurEmail: string
  dateDebut: string
  dateFin: string
  coursDetails: { id: string; titre: string; date: string; status: string; note?: number }[]
  casPratiquesDetails: { id: string; titre: string; dateRendu: string; status: string; note?: number }[]
  elearningDetails: { id: string; titre: string; dateCompletion: string; status: string }[]
  ecfDetails: { id: string; titre: string; date: string; status: string; note?: number }[]
  dossierProElements: { id: string; titre: string; status: string }[]
}

export default function StagiairesPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [selectedStagiaire, setSelectedStagiaire] = useState<StagiaireDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!session?.user?.id) return
    fetchStagiaires()
  }, [session])

  useEffect(() => {
    if (selectedId) {
      openDetail(selectedId)
    }
  }, [selectedId])

  const fetchStagiaires = async () => {
    try {
      const res = await fetch('/api/formateur/stagiaires')
      if (res.ok) {
        const data = await res.json()
        setStagiaires(data.stagiaires || [])
      }
    } catch (error) {
      console.error('Erreur chargement stagiaires:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setShowDetail(true)
    try {
      const res = await fetch(`/api/formateur/stagiaires/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedStagiaire(data)
      }
    } catch (error) {
      console.error('Erreur chargement détail stagiaire:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredStagiaires = stagiaires.filter(
    (s) =>
      s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.entreprise.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      render: (s: Stagiaire) => (
        <span className="font-medium">{s.prenom} {s.nom}</span>
      ),
    },
    { key: 'entreprise', label: 'Entreprise' },
    { key: 'tuteurNom', label: 'Tuteur' },
    {
      key: 'progressCours',
      label: 'Cours',
      render: (s: Stagiaire) => (
        <ProgressBar value={s.progressCours} max={s.totalCours} color="bg-weform-blue" showCount />
      ),
    },
    {
      key: 'progressCasPratiques',
      label: 'Cas pratiques',
      render: (s: Stagiaire) => (
        <ProgressBar value={s.progressCasPratiques} max={s.totalCasPratiques} color="bg-green-500" showCount />
      ),
    },
    {
      key: 'progressElearning',
      label: 'E-learning',
      render: (s: Stagiaire) => (
        <ProgressBar value={s.progressElearning} max={s.totalElearning} color="bg-orange-500" showCount />
      ),
    },
    {
      key: 'progressECF',
      label: 'ECF',
      render: (s: Stagiaire) => (
        <ProgressBar value={s.progressECF} max={s.totalECF} color="bg-purple-500" showCount />
      ),
    },
    {
      key: 'dossierPro',
      label: 'Dossier Pro',
      render: (s: Stagiaire) => {
        const statusColors: Record<string, string> = {
          EN_COURS: 'bg-yellow-100 text-yellow-800',
          COMPLET: 'bg-green-100 text-green-800',
          NON_COMMENCE: 'bg-gray-100 text-gray-600',
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.dossierProStatus] || 'bg-gray-100 text-gray-600'}`}>
            {s.dossierProStatus === 'EN_COURS' ? 'En cours' : s.dossierProStatus === 'COMPLET' ? 'Complet' : 'Non commenc\u00e9'}
          </span>
        )
      },
    },
  ]

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes stagiaires</h1>
            <p className="text-gray-500 mt-1">{stagiaires.length} stagiaire{stagiaires.length > 1 ? 's' : ''} assign\u00e9{stagiaires.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <input
            type="text"
            placeholder="Rechercher un stagiaire (nom, pr\u00e9nom, entreprise)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredStagiaires}
            onRowClick={(s) => openDetail(s.id)}
            emptyMessage="Aucun stagiaire assign\u00e9"
          />
        )}

        {/* Detail Modal */}
        <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelectedStagiaire(null) }} title="D\u00e9tail du stagiaire" size="xl">
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
            </div>
          ) : selectedStagiaire ? (
            <div className="space-y-6">
              {/* Info g\u00e9n\u00e9rale */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Stagiaire</p>
                  <p className="font-medium">{selectedStagiaire.prenom} {selectedStagiaire.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedStagiaire.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entreprise</p>
                  <p className="font-medium">{selectedStagiaire.entreprise}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tuteur</p>
                  <p className="font-medium">{selectedStagiaire.tuteurNom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">D\u00e9but formation</p>
                  <p className="font-medium">{selectedStagiaire.dateDebut ? new Date(selectedStagiaire.dateDebut).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fin formation</p>
                  <p className="font-medium">{selectedStagiaire.dateFin ? new Date(selectedStagiaire.dateFin).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
              </div>

              {/* Progression cours */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cours</h4>
                {selectedStagiaire.coursDetails?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStagiaire.coursDetails.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{c.titre}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'COMPLETE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.status === 'COMPLETE' ? 'Termin\u00e9' : 'Planifi\u00e9'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Aucun cours</p>
                )}
              </div>

              {/* Cas pratiques */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cas pratiques</h4>
                {selectedStagiaire.casPratiquesDetails?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStagiaire.casPratiquesDetails.map((cp) => (
                      <div key={cp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{cp.titre}</span>
                        <div className="flex items-center gap-3">
                          {cp.note !== undefined && <span className="text-sm font-medium">{cp.note}/20</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            cp.status === 'CORRIGE' ? 'bg-green-100 text-green-700' :
                            cp.status === 'RENDU' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {cp.status === 'CORRIGE' ? 'Corrig\u00e9' : cp.status === 'RENDU' ? 'Rendu' : cp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Aucun cas pratique</p>
                )}
              </div>

              {/* Dossier Pro link */}
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetail(false)
                    window.location.href = `/dashboard/formateur/dossiers-pro?stagiaireId=${selectedStagiaire.id}`
                  }}
                  className="btn-primary w-full"
                >
                  Acc\u00e9der au dossier professionnel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center">Erreur de chargement</p>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
