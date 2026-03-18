'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface User {
  id: string
  nom: string
  prenom: string
  role: string
}

interface Message {
  id: string
  contenu: string
  type: string
  lu: boolean
  createdAt: string
  sender: User
  receiver: User
}

interface Conversation {
  userId: string
  user: User
  lastMessage: string
  lastDate: string
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  async function fetchConversations() {
    try {
      const res = await fetch('/api/admin/messages/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages(userId: string) {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/admin/messages?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.userId)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          contenu: newMessage,
        }),
      })
      if (res.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation.userId)
        fetchConversations()
      }
    } catch (error) {
      console.error('Erreur envoi message:', error)
    } finally {
      setSending(false)
    }
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case 'FORMATEUR': return 'bg-purple-100 text-purple-700'
      case 'STAGIAIRE': return 'bg-blue-100 text-blue-700'
      case 'TUTEUR': return 'bg-green-100 text-green-700'
      case 'ADMIN': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchUser) return true
    const fullName = `${c.user.prenom} ${c.user.nom}`.toLowerCase()
    return fullName.includes(searchUser.toLowerCase())
  })

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>

        <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Rechercher un utilisateur..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Aucune conversation</p>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.userId}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        selectedConversation?.userId === conv.userId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {conv.user.prenom} {conv.user.nom}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeClass(conv.user.role)}`}>
                          {conv.user.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(conv.lastDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{conv.lastMessage}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="text-gray-400">Selectionnez une conversation</p>
                    <p className="text-xs text-gray-300 mt-1">Vous pouvez voir tous les echanges formateur-stagiaire</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-weform-blue text-white rounded-full flex items-center justify-center font-medium">
                        {selectedConversation.user.prenom[0]}{selectedConversation.user.nom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedConversation.user.prenom} {selectedConversation.user.nom}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeClass(selectedConversation.user.role)}`}>
                          {selectedConversation.user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {loadingMessages ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">Aucun message</p>
                    ) : (
                      messages.map((msg) => {
                        const isAdmin = msg.sender.role === 'ADMIN'
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isAdmin
                                ? 'bg-weform-blue text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}>
                              {!isAdmin && (
                                <p className="text-xs font-medium mb-1 opacity-70">
                                  {msg.sender.prenom} {msg.sender.nom}
                                </p>
                              )}
                              <p className="text-sm">{msg.contenu}</p>
                              <p className={`text-xs mt-1 ${isAdmin ? 'text-blue-100' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="input-field flex-1"
                        placeholder="Ecrire un message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={sending || !newMessage.trim()}
                      >
                        {sending ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
