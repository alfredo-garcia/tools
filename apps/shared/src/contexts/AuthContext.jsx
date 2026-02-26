import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'app_access_token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const validateStoredCode = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setIsAuthenticated(false)
      setIsChecking(false)
      return
    }
    setIsAuthenticated(true)
    setIsChecking(false)
  }, [])

  useEffect(() => {
    validateStoredCode()
  }, [validateStoredCode])

  const login = useCallback((code) => {
    localStorage.setItem(STORAGE_KEY, code)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setIsAuthenticated(false)
  }, [])

  const getAccessCode = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  }, [])

  const value = {
    isAuthenticated,
    isChecking,
    login,
    logout,
    getAccessCode,
    storageKey: STORAGE_KEY
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
