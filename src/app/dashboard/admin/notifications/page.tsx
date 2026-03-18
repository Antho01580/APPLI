'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Notification {
  id: string
  titre: string
  contenu: string
  type: string
  lien: string | null
  lu: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function handleMarkAsRead(id: string) {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
        )
      }
    } catch (error) {
      console.error('Erreur lecture notification:', error)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch('/api/admin/notifications/read-all', {
        method: 'PATCH',
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
      }
    } catch (error) {
      console.error('Erreur lecture notifications:', error)
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'INFO': return 'bg-blue-100 text-blue-600'
      case 'WARNING': return 'bg-yellow-100 text-yellow-600'
      case 'SUCCESS': return 'bg-green-100 text-green-600'
      case 'ERROR': return 'bg-red-100 text-red-600'
      case 'DOCUMENT': return 'bg-purple-100 text-purple-600'
      case 'MESSAGE': return 'bg-indigo-100 text-indigo-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'INFO': return 'Info'
      case 'WARNING': return 'Attention'
      case 'SUCCESS': return 'Succes'
      case 'ERROR': return 'Erreur'
      case 'DOCUMENT': return 'Document'
      case 'MESSAGE': return 'Message'
      default: return type
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.lu)
    : notifications

  const unreadCount = notifications.filter((n) => !n.lu).length

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-weform-blue hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-weform-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-weform-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Non lues ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-400">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`card flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${
                  !n.lu ? 'border-l-4 border-l-weform-blue bg-blue-50/30' : ''
                }`}
                onClick={() => {
                  if (!n.lu) handleMarkAsRead(n.id)
                  if (n.lien) router.push(n.lien)
                }}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeIcon(n.type)}`}>
                  <span className="text-sm font-medium">{getTypeLabel(n.type)[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm ${!n.lu ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.titre}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded ${getTypeIcon(n.type)}`}>
                        {getTypeLabel(n.type)}
                      </span>
                      {!n.lu && (
                        <span className="w-2 h-2 rounded-full bg-weform-blue"></span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{n.contenu}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {!n.lu && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsRead(n.id)
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title="Marquer comme lu"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
