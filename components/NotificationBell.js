'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/services/notifications'
import { formatDateTime } from '@/lib/utils'

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const unread = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!userId) return
    getNotifications(userId).then(setNotifications).catch(console.error)
  }, [userId])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead(userId)
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label={`${unread} unread notifications`}>
        <Bell className="w-5 h-5" />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && <button onClick={handleMarkAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Mark all read</button>}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0
              ? <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications</div>
              : notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-brand-50/50' : ''}`} onClick={() => !n.is_read && handleMarkRead(n.id)}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />}
                    <div className={!n.is_read ? '' : 'ml-4'}>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
