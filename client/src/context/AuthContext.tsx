import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../types'
import api from '../lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (full_name: string, email: string, password: string, phone?: string) => Promise<void>
  loginWithGoogle: (access_token: string) => Promise<void>
  loginWithFacebook: (access_token: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  isAdmin: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.data.token)
    setUser(data.data.user)
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('user', JSON.stringify(data.data.user))
  }

  const register = async (full_name: string, email: string, password: string, phone?: string) => {
    const { data } = await api.post('/auth/register', { full_name, email, password, phone })
    setToken(data.data.token)
    setUser(data.data.user)
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('user', JSON.stringify(data.data.user))
  }

  const loginWithSocial = async (provider: string, access_token: string) => {
    const { data } = await api.post('/auth/social', { provider, access_token })
    setToken(data.data.token)
    setUser(data.data.user)
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('user', JSON.stringify(data.data.user))
  }

  const loginWithGoogle = (access_token: string) => loginWithSocial('google', access_token)
  const loginWithFacebook = (access_token: string) => loginWithSocial('facebook', access_token)

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateUser = (user: User) => {
    setUser(user)
    localStorage.setItem('user', JSON.stringify(user))
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      loginWithGoogle,
      loginWithFacebook,
      logout,
      updateUser,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!user && !!token,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
