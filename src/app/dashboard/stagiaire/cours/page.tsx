'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

interface Cours {
  id: string
  title: string
  date: string
  status: 'PLANIFIE' | 'EFFECTUE' | 'ABSENT'
  teamsLink: string | null
  compteRendu: string | null
  signatureStagiaire: boolean
  casPratiqueAssociated: {
    id: string
    title: string
    status: string
  } | null
}

const statusColors: Record<string, string> = {
  PLANIFIE: 'bg-blue-100 text-blue-800',
  EFFECTUE: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  PLANIFIE: 'Planifie',
  EFFECTUE: 'Effectue',
  ABSENT: 'Absent',
}

export default function CoursPage() {
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null)
  const [signing, setSigning] = useState<string | null>(null)

  useEffect(() => {
    fetchCours()
  }, [])

  const fetchCours = () => {
    fetch('/api/stagiaire/cours')
      .then((res) => res.json())
      .then((d) => setCours(d.cours || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleSign = async (coursId: string) => {
    setSigning(coursId)
    try {
      const res = await fetch(`/api/stagiaire/cours/${coursId}/sign`, {
        method: 'POST',
      })
      if (res.ok) {
        setCours((prev) =>
          prev.map((c) =>
            c.id === coursId ? { ...c, signatureStagiaire: true } : c
          )
        )
      }
    } catch {
      // error handled silently
    } finally {
      setSigning(null)
    }
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (item: Cours) => (
        <span className="text-sm">
          {new Date(item.date).toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Cours',
      render: (item: Cours) => (
        <span className="font-medium text-gray-900">{item.title}</span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: Cours) => (
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[item.status]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'signature',
      label: 'Signature',
      render: (item: Cours) =>
        item.signatureStagiaire ? (
          <span className="text-green-600 text-sm font-medium">Signe</span>
        ) : item.status === 'EFFECTUE' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSign(item.id)
            }}
            disabled={signing === item.id}
            className="px-3 py-1 text-xs bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {signing === item.id ? 'Signature...' : 'Signer'}
          </button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: 'teams',
      label: 'Teams',
      render: (item: Cours) =>
        item.teamsLink ? (
          <a
            href={item.teamsLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Rejoindre
          </a>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: 'casPratique',
      label: 'Cas pratique associe',
      render: (item: Cours) =>
        item.casPratiqueAssociated ? (
          <span className="text-sm text-purple-600">{item.casPratiqueAssociated.title}</span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
  ]

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={cours}
            onRowClick={(item) => setSelectedCours(item)}
            emptyMessage="Aucun cours disponible"
          />
        )}

        <Modal
          isOpen={!!selectedCours}
          onClose={() => setSelectedCours(null)}
          title={selectedCours?.title || 'Detail du cours'}
          size="lg"
        >
          {selectedCours && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedCours.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedCours.status]}`}>
                    {statusLabels[selectedCours.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Signature</p>
                  <p className="font-medium">
                    {selectedCours.signatureStagiaire ? 'Signe' : 'Non signe'}
                  </p>
                </div>
              </div>

              {selectedCours.compteRendu && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Compte-rendu</p>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedCours.compteRendu}
                  </div>
                </div>
              )}

              {selectedCours.teamsLink && (
                <a
                  href={selectedCours.teamsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Rejoindre sur Teams
                </a>
              )}

              {selectedCours.casPratiqueAssociated && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-1">Cas pratique a rendre</p>
                  <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
                    <span className="font-medium text-purple-800">
                      {selectedCours.casPratiqueAssociated.title}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                      {selectedCours.casPratiqueAssociated.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
