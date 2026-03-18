'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'

interface Contact {
  id: string
  name: string
  role: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  createdAt: string
  isDemandeAide: boolean
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isDemandeAide, setIsDemandeAide] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id)
    }
  }, [selectedContact])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchContacts = () => {
    fetch('/api/stagiaire/messages/contacts')
      .then((res) => res.json())
      .then((d) => setContacts(d.contacts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchMessages = (contactId: string) => {
    setLoadingMessages(true)
    fetch(`/api/stagiaire/messages/${contactId}`)
      .then((res) => res.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => setLoadingMessages(false))
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) return
    setSending(true)
    try {
      const res = await fetch(`/api/stagiaire/messages/${selectedContact.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          isDemandeAide,
        }),
      })
      if (res.ok) {
        const sent = await res.json()
        setMessages((prev) => [...prev, sent])
        setNewMessage('')
        setIsDemandeAide(false)
        fetchContacts()
      }
    } catch {
      // error handled silently
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const roleLabels: Record<string, string> = {
    FORMATEUR: 'Formateur',
    ADMIN: 'Administrateur',
    TUTEUR: 'Tuteur',
  }

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <button
            onClick={() => setShowNewConversation(true)}
            className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Nouveau message
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden flex" style={{ height: 'calc(100vh - 220px)' }}>
            {/* Contacts list */}
            <div className="w-80 border-r border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Conversations
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.name}
                            </p>
                            {contact.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{roleLabels[contact.role] || contact.role}</p>
                          {contact.lastMessage && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {contact.lastMessage}
                            </p>
                          )}
                        </div>
                        {contact.lastMessageAt && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {new Date(contact.lastMessageAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Aucune conversation
                  </div>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <h3 className="font-medium text-gray-900">{selectedContact.name}</h3>
                    <p className="text-xs text-gray-500">
                      {roleLabels[selectedContact.role] || selectedContact.role}
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loadingMessages ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-weform-blue"></div>
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((msg) => {
                        const isMe = msg.senderId === session?.user?.id
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                msg.isDemandeAide
                                  ? 'bg-orange-100 border border-orange-200'
                                  : isMe
                                  ? 'bg-weform-blue text-white'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              {msg.isDemandeAide && (
                                <p className="text-xs font-medium text-orange-700 mb-1">
                                  Demande d&apos;aide
                                </p>
                              )}
                              <p
                                className={`text-sm whitespace-pre-wrap ${
                                  msg.isDemandeAide
                                    ? 'text-gray-800'
                                    : isMe
                                    ? 'text-white'
                                    : 'text-gray-800'
                                }`}
                              >
                                {msg.content}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.isDemandeAide
                                    ? 'text-orange-500'
                                    : isMe
                                    ? 'text-blue-200'
                                    : 'text-gray-400'
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center text-gray-400 text-sm py-8">
                        Aucun message. Commencez la conversation !
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isDemandeAide}
                          onChange={(e) => setIsDemandeAide(e.target.checked)}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-orange-600 font-medium">Demande d&apos;aide</span>
                      </label>
                    </div>
                    <div className="flex items-end gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-weform-blue text-sm"
                        placeholder="Ecrivez votre message..."
                        rows={2}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2 bg-weform-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm h-10"
                      >
                        {sending ? '...' : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-4">&#x1F4AC;</div>
                    <p>Selectionnez une conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Modal
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          title="Nouveau message"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selectionnez un destinataire pour demarrer une conversation.
            </p>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact)
                    setShowNewConversation(false)
                  }}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-xs text-gray-500">{roleLabels[contact.role] || contact.role}</p>
                </button>
              ))}
              {contacts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aucun contact disponible
                </p>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
