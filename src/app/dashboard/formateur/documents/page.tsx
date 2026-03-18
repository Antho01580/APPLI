'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Document {
  id: string
  titre: string
  description: string
  categorie: string
  fichierUrl: string
  dateAjout: string
  taille: string
}

const CATEGORIES = [
  { key: 'GUIDE_FORMATEUR', label: 'Guide du formateur', icon: '&#128214;', color: 'bg-blue-100 text-blue-700' },
  { key: 'PROCEDURE_HANDICAP', label: 'Proc\u00e9dure handicap', icon: '&#9829;', color: 'bg-red-100 text-red-700' },
  { key: 'ELEMENTS_DIPLOME', label: '\u00c9l\u00e9ments dipl\u00f4me', icon: '&#127891;', color: 'bg-green-100 text-green-700' },
  { key: 'PLAQUETTE', label: 'Plaquette', icon: '&#128196;', color: 'bg-purple-100 text-purple-700' },
]

export default function DocumentsPage() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    fetchDocuments()
  }, [session])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/formateur/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = selectedCategorie
    ? documents.filter((d) => d.categorie === selectedCategorie)
    : documents

  const getDocsByCategory = (cat: string) => documents.filter((d) => d.categorie === cat)

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents formateur</h1>
          <p className="text-gray-500 mt-1">Ressources et documents utiles</p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const count = getDocsByCategory(cat.key).length
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategorie(selectedCategorie === cat.key ? null : cat.key)}
                className={`card text-center hover:shadow-md transition-all ${
                  selectedCategorie === cat.key ? 'ring-2 ring-weform-blue' : ''
                }`}
              >
                <span className="text-3xl" dangerouslySetInnerHTML={{ __html: cat.icon }} />
                <p className="font-medium text-gray-900 mt-2">{cat.label}</p>
                <p className="text-sm text-gray-500">{count} document{count > 1 ? 's' : ''}</p>
              </button>
            )
          })}
        </div>

        {/* Documents list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400">
              {selectedCategorie ? 'Aucun document dans cette cat\u00e9gorie' : 'Aucun document disponible'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {CATEGORIES.filter((cat) => !selectedCategorie || cat.key === selectedCategorie).map((cat) => {
              const catDocs = getDocsByCategory(cat.key)
              if (catDocs.length === 0) return null
              return (
                <div key={cat.key}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{cat.label}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {catDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fichierUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card flex items-start gap-4 hover:shadow-md transition-shadow group"
                      >
                        <div className={`p-3 rounded-lg ${cat.color}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-weform-blue transition-colors">
                            {doc.titre}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(doc.dateAjout).toLocaleDateString('fr-FR')}
                            </span>
                            {doc.taille && (
                              <span className="text-xs text-gray-400">{doc.taille}</span>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-weform-blue flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> Certains documents seront fournis ult\u00e9rieurement par l&apos;administration WE-FORM.
            Vous serez notifi\u00e9 lorsqu&apos;ils seront disponibles.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
