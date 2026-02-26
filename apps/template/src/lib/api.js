import { useAuth } from '../contexts/AuthContext'

const AUTH_HEADER = 'Authorization'

/**
 * Cliente para llamar a las APIs con el código de acceso en headers.
 */
export function useApi() {
  const { getAccessCode } = useAuth()

  const fetchApi = async (path, options = {}) => {
    const headers = {
      [AUTH_HEADER]: getAccessCode(),
      'Content-Type': 'application/json',
      ...options.headers
    }
    const res = await fetch(path, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Error en la petición')
    return data
  }

  return { fetchApi }
}
