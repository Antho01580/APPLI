'use client'

import { useState, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'

interface PreviewRow {
  nom: string
  prenom: string
  email: string
  formation: string
  club: string
  format: string
  dateDebutContrat: string
  dateFinContrat: string
  dateDebutFormation: string
  dateFinFormation: string
  [key: string]: string
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setMessage(null)
    setImportResult(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setPreviewData(data.rows || [])
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.message || 'Erreur lors de la lecture du fichier' })
        setPreviewData([])
      }
    } catch (error) {
      console.error('Erreur preview:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la lecture du fichier' })
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!file) return

    setImporting(true)
    setMessage(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setImportResult({ created: data.created || 0, errors: data.errors || [] })
        setMessage({ type: 'success', text: `Import reussi : ${data.created || 0} stagiaire(s) cree(s)` })
        setPreviewData([])
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de l\'import' })
      }
    } catch (error) {
      console.error('Erreur import:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'import' })
    } finally {
      setImporting(false)
    }
  }

  function handleReset() {
    setFile(null)
    setPreviewData([])
    setMessage(null)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const previewColumns = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prenom' },
    { key: 'email', label: 'Email' },
    { key: 'formation', label: 'Formation' },
    { key: 'club', label: 'Club' },
    { key: 'format', label: 'Format' },
    { key: 'dateDebutContrat', label: 'Debut contrat' },
    { key: 'dateFinContrat', label: 'Fin contrat' },
  ]

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Filiz (Excel)</h1>

        {/* Info Card */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Format attendu du fichier Excel</h3>
          <p className="text-sm text-blue-800 mb-2">
            Le fichier Excel doit contenir les colonnes suivantes :
          </p>
          <div className="flex flex-wrap gap-2">
            {['Nom', 'Prenom', 'Email', 'Formation', 'Club', 'Format', 'Date debut contrat', 'Date fin contrat', 'Date debut formation', 'Date fin formation'].map((col) => (
              <span key={col} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Selectionner un fichier</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="btn-primary cursor-pointer inline-block"
            >
              Choisir un fichier Excel
            </label>
            <p className="text-sm text-gray-500 mt-2">
              {file ? file.name : 'Formats acceptes : .xlsx, .xls, .csv'}
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`card ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {importResult && importResult.errors.length > 0 && (
          <div className="card bg-yellow-50 border border-yellow-200">
            <h3 className="font-medium text-yellow-900 mb-2">Avertissements ({importResult.errors.length})</h3>
            <ul className="list-disc list-inside space-y-1">
              {importResult.errors.map((err, idx) => (
                <li key={idx} className="text-sm text-yellow-800">{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Apercu des donnees ({previewData.length} ligne{previewData.length > 1 ? 's' : ''})
              </h2>
              <div className="flex gap-3">
                <button onClick={handleReset} className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-primary"
                >
                  {importing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Import en cours...
                    </span>
                  ) : (
                    `Importer ${previewData.length} stagiaire${previewData.length > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>

            <DataTable
              columns={previewColumns}
              data={previewData}
              emptyMessage="Aucune donnee"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
