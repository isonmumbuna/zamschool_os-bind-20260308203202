'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', userId)
        .single()
      if (error) throw error
      setProfile(data)
      setSchool(data?.schools || null)
    } catch (err) {
      console.error('Profile load error:', err)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setSchool(null)
      }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setSchool(null)
  }

  return (
    <AppContext.Provider value={{ user, profile, school, loading, refreshProfile, signOut }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
