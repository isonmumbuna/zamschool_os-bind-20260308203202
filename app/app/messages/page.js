'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/lib/appContext'
import { getMessages, sendMessage, markMessageRead } from '@/lib/services/messages'
import { getSchoolDirectory } from '@/lib/services/profiles'
import PageHeader from '@/components/PageHeader'
import { Send, MessageSquare, X } from 'lucide-react'
import Image from 'next/image'
import { formatDateTime, getInitials } from '@/lib/utils'

export default function MessagesPage() {
  const { profile, school } = useApp()
  const [conversations, setConversations] = useState([])
  const [selectedRecipient, setSelectedRecipient] = useState(null)
  const [messageContent, setMessageContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [directory, setDirectory] = useState([])
  const messagesEndRef = useRef(null)
  const sid = profile?.school_id

  const loadDirectory = useCallback(async () => {
    if (!sid) return
    try {
      const dir = await getSchoolDirectory(sid)
      setDirectory(dir.filter(p => p.id !== profile.id)) // Exclude self
    } catch (e) { console.error(e) }
  }, [sid, profile?.id])

  const loadMessages = useCallback(async () => {
    if (!sid || !profile?.id) return
    setLoading(true)
    try {
      const msgs = await getMessages(sid, profile.id)
      // Group messages by conversation partner
      const grouped = {}
      msgs.forEach(msg => {
        const partnerId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id
        if (!grouped[partnerId]) {
          grouped[partnerId] = {
            partner: msg.sender_id === profile.id ? msg.receiver : msg.sender,
            messages: []
          }
        }
        grouped[partnerId].messages.push(msg)
      })
      setConversations(Object.values(grouped))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid, profile?.id])

  useEffect(() => {
    loadDirectory()
    loadMessages()
  }, [loadDirectory, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedRecipient, conversations])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageContent.trim() || !selectedRecipient) return
    setSending(true)
    try {
      await sendMessage(sid, profile.id, selectedRecipient.id, messageContent)
      setMessageContent('')
      await loadMessages() // Reload messages to show new one
    } catch (err) { alert(err.message) }
    finally { setSending(false) }
  }

  const selectRecipient = async (recipient) => {
    setSelectedRecipient(recipient)
    // Mark all messages from this recipient as read
    const conv = conversations.find(c => c.partner.id === recipient.id)
    if (conv) {
      const unreadMessages = conv.messages.filter(m => !m.is_read && m.sender_id === recipient.id)
      for (const msg of unreadMessages) {
        await markMessageRead(msg.id)
      }
      await loadMessages() // Reload to update read status
    }
  }

  const currentConversation = selectedRecipient
    ? conversations.find(c => c.partner.id === selectedRecipient.id)
    : null

  return (
    <div className="p-6 flex h-[calc(100vh-80px)]"> {/* Adjust height based on header */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading chats...</div>
          ) : (
            <>
              {directory.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs uppercase text-gray-500 font-semibold px-2 py-1">New Chat</h3>
                  <select
                    className="input w-full text-sm"
                    onChange={(e) => {
                      const recipientId = e.target.value
                      const rec = directory.find(d => d.id === recipientId)
                      if (rec) setSelectedRecipient(rec)
                      e.target.value = '' // Reset select
                    }}
                    value=""
                  >
                    <option value="">Start a new conversation</option>
                    {directory.map(d => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.role})</option>
                    ))}
                  </select>
                </div>
              )}
              <h3 className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Conversations</h3>
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">No conversations yet.</div>
              ) : (
                conversations.map(conv => {
                  const partner = conv.partner
                  const unreadCount = conv.messages.filter(m => !m.is_read && m.sender_id === partner.id).length
                  return (
                    <button
                      key={partner.id}
                      onClick={() => selectRecipient(partner)}
                      className={`flex items-center gap-3 p-4 w-full text-left hover:bg-gray-50 transition-colors ${selectedRecipient?.id === partner.id ? 'bg-brand-50' : ''}`}
                    >
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
                        {partner.avatar_url ? <Image src={partner.avatar_url} alt={getInitials(partner.first_name, partner.last_name)} width={32} height={32} className="w-full h-full rounded-full object-cover" /> : getInitials(partner.first_name, partner.last_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{partner.first_name} {partner.last_name}</p>
                        <p className="text-xs text-gray-500 truncate">{conv.messages[conv.messages.length - 1]?.content}</p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none flex-shrink-0">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 ml-6 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
        {selectedRecipient ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
                  {selectedRecipient.avatar_url ? <Image src={selectedRecipient.avatar_url} alt={getInitials(selectedRecipient.first_name, selectedRecipient.last_name)} width={36} height={36} className="w-full h-full rounded-full object-cover" /> : getInitials(selectedRecipient.first_name, selectedRecipient.last_name)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedRecipient.first_name} {selectedRecipient.last_name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{selectedRecipient.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRecipient(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {currentConversation?.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl ${msg.sender_id === profile.id ? 'bg-brand-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === profile.id ? 'text-brand-200' : 'text-gray-500'}`}>{formatDateTime(msg.created_at)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex items-center gap-3">
              <input
                type="text"
                className="input flex-1"
                placeholder="Type your message..."
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn-primary p-2.5" disabled={sending}>
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-center">
            <div className="p-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a conversation or start a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
