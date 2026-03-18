'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'

interface UploadableDocument {
  key: string
  label: string
  uploaded: boolean
  fileUrl: string | null
  uploadedAt: string | null
}

interface DownloadableDocument {
  key: string
  label: string
  fileUrl: string
  available: boolean
}

interface DocumentsData {
  uploads: UploadableDocument[]
  dossierAccueil: DownloadableDocument[]
  livretPedagogique: DownloadableDocument | null
  carteEtudiante: DownloadableDocument | null
  photoUploaded: boolean
}

const uploadDocumentTypes = [
  { key: 'ci', label: "Carte d'identite" },
  { key: 'diplome', label: 'Diplome' },
  { key: 'carte_vitale', label: 'Carte vitale' },
  { key: 'cv', label: 'CV' },
  { key: 'lettre_motivation', label: 'Lettre de motivation' },
  { key: 'fiche_poste', label: 'Fiche de poste' },
  { key: 'photo', label: 'Photo' },
]

export default function DocumentsPage() {
  const [data, setData] = useState<DocumentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<UploadableDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetKey, setUploadTargetKey] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    fetch('/api/stagiaire/documents')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleUpload = async (docKey: string, file: File) => {
    setUploading(docKey)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', docKey)
      const res = await fetch('/api/stagiaire/documents/upload', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        fetchData()
      }
    } catch {
      // error handled silently
    } finally {
      setUploading(null)
      setUploadTargetKey(null)
    }
  }

  const triggerUpload = (key: string) => {
    setUploadTargetKey(key)
    fileInputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadTargetKey) {
      handleUpload(uploadTargetKey, file)
    }
    e.target.value = ''
  }

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <>
            {/* Upload Section */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents a deposer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadDocumentTypes.map((docType) => {
                  const doc = data?.uploads.find((u) => u.key === docType.key)
                  const isUploaded = doc?.uploaded || false
                  return (
                    <div
                      key={docType.key}
                      className={`border rounded-lg p-4 ${
                        isUploaded
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-800">{docType.label}</h3>
                        {isUploaded ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Depose
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            A deposer
                          </span>
                        )}
                      </div>
                      {isUploaded && doc?.uploadedAt && (
                        <p className="text-xs text-gray-400 mb-2">
                          Depose le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerUpload(docType.key)}
                          disabled={uploading === docType.key}
                          className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${
                            isUploaded
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-weform-blue text-white hover:bg-blue-700'
                          } disabled:opacity-50`}
                        >
                          {uploading === docType.key
                            ? 'Envoi...'
                            : isUploaded
                            ? 'Remplacer'
                            : 'Deposer'}
                        </button>
                        {isUploaded && doc?.fileUrl && (
                          <button
                            onClick={() => setShowPreview(doc)}
                            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            Voir
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Download Section - Dossier d'accueil */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dossier d&apos;accueil - Documents a telecharger
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data?.dossierAccueil || []).map((doc) => (
                  <a
                    key={doc.key}
                    href={doc.available ? doc.fileUrl : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                      doc.available
                        ? 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                    onClick={(e) => {
                      if (!doc.available) e.preventDefault()
                    }}
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-lg">
                      &#x1F4C4;
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                      <p className="text-xs text-gray-400">
                        {doc.available ? 'Cliquez pour telecharger' : 'Non disponible'}
                      </p>
                    </div>
                  </a>
                ))}

                {(!data?.dossierAccueil || data.dossierAccueil.length === 0) && (
                  <div className="col-span-2">
                    {[
                      'Guide de formation',
                      'Certification',
                      'Recapitulatif diplome',
                      'Information handicap',
                      'Reglement interieur',
                      'Conditions generales de vente',
                    ].map((label) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50 opacity-50 mb-2"
                      >
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-lg">
                          &#x1F4C4;
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-400">Non disponible</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Livret pédagogique */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Livret pedagogique</h2>
              {data?.livretPedagogique?.available ? (
                <a
                  href={data.livretPedagogique.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-lg">
                    &#x1F4D6;
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Livret pedagogique</p>
                    <p className="text-xs text-gray-400">Cliquez pour telecharger</p>
                  </div>
                </a>
              ) : (
                <p className="text-gray-400 text-sm">Le livret pedagogique n&apos;est pas encore disponible.</p>
              )}
            </div>

            {/* Carte étudiante */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Carte etudiante</h2>
              {data?.photoUploaded ? (
                data?.carteEtudiante?.available ? (
                  <a
                    href={data.carteEtudiante.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-lg">
                      &#x1F4B3;
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Carte etudiante</p>
                      <p className="text-xs text-gray-400">Cliquez pour telecharger</p>
                    </div>
                  </a>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Votre carte etudiante est en cours de generation. Revenez plus tard.
                  </p>
                )
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Veuillez d&apos;abord deposer votre photo dans la section ci-dessus pour generer votre carte etudiante.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <Modal
          isOpen={!!showPreview}
          onClose={() => setShowPreview(null)}
          title={showPreview?.label || 'Document'}
          size="lg"
        >
          {showPreview?.fileUrl && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">&#x1F4C4;</div>
                <p className="text-sm text-gray-600 mb-4">{showPreview.label}</p>
                <a
                  href={showPreview.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Telecharger
                </a>
              </div>
              {showPreview.uploadedAt && (
                <p className="text-xs text-gray-400 text-center">
                  Depose le{' '}
                  {new Date(showPreview.uploadedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
