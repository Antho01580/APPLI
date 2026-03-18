'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Conversation {
  id: string
  stagiaireId: string
  stagiaireNom: string
  stagiairePrenom: string
  lastMessage: string
  lastMessageDate: string
  unreadCount: number
  isDemandeAide: boolean
}

interface Message {
  id: string
  contenu: string
  senderId: string
  senderNom: string
  senderRole: string
  createdAt: string
  isDemandeAide: boolean
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [filterAide, setFilterAide] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    fetchConversations()
  }, [session])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/formateur/messages/conversations')
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

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv)
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/formateur/messages/${conv.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
      // Mark as read
      await fetch(`/api/formateur/messages/${conv.id}/read`, { method: 'POST' })
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      )
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/formateur/messages/${selectedConv.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newMessage }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage('')
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConv.id
              ? { ...c, lastMessage: newMessage, lastMessageDate: new Date().toISOString() }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Erreur envoi message:', error)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = filterAide
    ? conversations.filter((c) => c.isDemandeAide)
    : conversations

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Conversations avec vos stagiaires</p>
        </div>

        <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
          <div className="flex h-full">
            {/* Conversations list */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterAide(false)}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg ${
                      !filterAide ? 'bg-weform-blue text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterAide(true)}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg ${
                      filterAide ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Demandes d&apos;aide
                  </button>
                </div>
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
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedConv?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {conv.stagiairePrenom} {conv.stagiaireNom}
                        </span>
                        <div className="flex items-center gap-2">
                          {conv.isDemandeAide && (
                            <span className="w-2 h-2 rounded-full bg-orange-500" title="Demande d'aide" />
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="bg-weform-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.lastMessageDate).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 flex flex-col">
              {selectedConv ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConv.stagiairePrenom} {selectedConv.stagiaireNom}
                        </h3>
                        {selectedConv.isDemandeAide && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            Demande d&apos;aide
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">Aucun message</p>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === session?.user?.id
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isMe
                                  ? 'bg-weform-blue text-white'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              {msg.isDemandeAide && (
                                <div className={`text-xs mb-1 ${isMe ? 'text-blue-100' : 'text-orange-500'}`}>
                                  Demande d&apos;aide
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.contenu}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="\u00c9crire un message..."
                        className="input flex-1"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="btn-primary px-6"
                      >
                        {sending ? '...' : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="text-gray-400">S\u00e9lectionnez une conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
