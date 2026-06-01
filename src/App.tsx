import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import ExecutiveDashboard from './components/dashboard/ExecutiveDashboard'
import { LoginPage } from './features/auth/LoginPage'
import { loginToTechStore, parseLoginResponse } from './lib/techstoreApi'
import type { AuthFormState, SyncStatus } from './types/techstore'
import './App.css'

const defaultAuth: AuthFormState = {
  username: '',
  password: '',
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.')
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

function isAccessTokenValid(token: string): boolean {
  const trimmedToken = token.trim()
  if (!trimmedToken) return false

  const payload = decodeJwtPayload(trimmedToken)
  if (!payload) return false

  const expiresAt = payload.exp
  if (typeof expiresAt !== 'number') return false

  return expiresAt * 1000 > Date.now()
}

function getStoredAccessToken(): string {
  const token = localStorage.getItem('techstore.token') ?? ''
  if (isAccessTokenValid(token)) return token

  localStorage.removeItem('techstore.token')
  localStorage.removeItem('token')
  return ''
}

export default function App() {
  const [auth, setAuth] = useState<AuthFormState>(defaultAuth)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncMessage, setSyncMessage] = useState('Listo para iniciar sesión.')
  const [accessToken, setAccessToken] = useState(getStoredAccessToken)

  const isAuthenticated = isAccessTokenValid(accessToken)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!auth.username.trim() || !auth.password.trim()) {
      setSyncStatus('error')
      setSyncMessage('Completa usuario y contraseña.')
      return
    }

    setSyncStatus('loading')
    setSyncMessage('Validando acceso...')

    try {
      const payload = await loginToTechStore(auth.username, auth.password)
      const loginResponse = parseLoginResponse(payload)

      if (!loginResponse) {
        setSyncStatus('error')
        setSyncMessage('El acceso no devolvió un token válido.')
        return
      }

      if (!isAccessTokenValid(loginResponse.access_token)) {
        setSyncStatus('error')
        setSyncMessage('El token recibido no es válido o está vencido.')
        return
      }

      setAccessToken(loginResponse.access_token)
      localStorage.setItem('techstore.token', loginResponse.access_token)
      setSyncStatus('ready')
      setSyncMessage('Acceso confirmado.')
    } catch (error) {
      setSyncStatus('error')
      setSyncMessage(error instanceof Error ? 'No se pudo completar el acceso.' : 'No se pudo completar el acceso.')
    }
  }

  const handleLogout = () => {
    setAccessToken('')
    setAuth(defaultAuth)
    setSyncStatus('idle')
    setSyncMessage('Sesión cerrada.')
    localStorage.removeItem('techstore.token')
    localStorage.removeItem('token')
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout()
      setSyncStatus('error')
      setSyncMessage('Tu sesión expiró o no está autorizada. Inicia sesión nuevamente.')
    }

    window.addEventListener('techstore:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('techstore:unauthorized', handleUnauthorized)
  }, [])

  const handleAuthChange = (next: Partial<AuthFormState>) => {
    setAuth((current) => ({ ...current, ...next }))
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        auth={auth}
        syncStatus={syncStatus}
        syncMessage={syncMessage}
        onAuthChange={handleAuthChange}
        onLogin={handleLogin}
      />
    )
  }

  return <ExecutiveDashboard onLogout={handleLogout} />
}
