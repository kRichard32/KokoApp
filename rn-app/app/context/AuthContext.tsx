import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo, useEffect, useState } from "react"
import { useMMKVString } from "react-native-mmkv"
import { CommonActions } from "@react-navigation/native"
import { navigationRef } from "@/navigators/navigationUtilities"
import axios from "axios"

const serverUrl = "http://10.0.2.2:8080"

export type AuthContextType = {
  isAuthenticated: boolean
  authToken?: string
  authEmail?: string
  user?: any
  isLoading: boolean
  networkError: boolean
  loggedIn: boolean
  setAuthToken: (token?: string) => void
  setAuthEmail: (email: string) => void
  logout: () => void
  checkLoginState: (showNetworkError?: boolean) => Promise<void>
  resetNetworkError: () => void
  validationError: string
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  const [authToken, setAuthToken] = useMMKVString("AuthProvider.authToken")
  const [authEmail, setAuthEmail] = useMMKVString("AuthProvider.authEmail")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  // Set up axios interceptor to include auth token in requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (authToken && authToken !== "authenticated") {
          config.headers.Authorization = `Bearer ${authToken}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.request.eject(interceptor)
    }
  }, [authToken])

  const resetNetworkError = useCallback(() => {
    setNetworkError(false)
  }, [])

  const navigateToInitialScreen = useCallback(() => {
    if (navigationRef.isReady()) {
      try {
        // Check if we're already on the OAuth login screen
        const currentRoute = navigationRef.getCurrentRoute()
        if (currentRoute?.name === 'OAuthLogin') {
          console.log('Already on OAuthLogin screen, no navigation needed')
          return
        }

        // Use navigate instead of reset for more reliable navigation
        navigationRef.navigate('OAuthLogin' as never)
        console.log('Navigated to OAuthLogin screen from AuthContext')
      } catch (navError) {
        console.error('Navigation error in AuthContext:', navError)
        // Fallback to reset if navigate fails
        try {
          navigationRef.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'OAuthLogin' }],
            })
          )
        } catch (resetError) {
          console.error('Reset navigation also failed in AuthContext:', resetError)
        }
      }
    } else {
      console.log('Navigation not ready in AuthContext, skipping navigation')
    }
  }, [])

  const checkLoginState = useCallback(async (showNetworkError = true) => {
    try {
      const {
        data: { loggedIn: logged_in, user },
      } = await axios.get(`${serverUrl}/auth/logged_in`, {
        withCredentials: true, // Include cookies
      })
      setLoggedIn(logged_in)
      user && setUser(user)
      if (logged_in) {
        setAuthToken("authenticated") // Set a token to indicate authentication
        setNetworkError(false) // Clear any previous network errors
      } else {
        setAuthToken(undefined)
        setUser(null)
      }
    } catch (err) {
      console.error('Network error during login check:', err)
      setAuthToken(undefined)
      setUser(null)
      setLoggedIn(false)
      
      // Only show network error and navigate if explicitly requested
      if (showNetworkError) {
        setNetworkError(true) // Set network error flag
        // Clear axios authorization header
        delete axios.defaults.headers.common['Authorization']
        navigateToInitialScreen() // Navigate back to initial screen
      } else {
        console.log('Initial login check failed silently - server may not be running')
      }
    } finally {
      setIsLoading(false)
    }
  }, [setAuthToken, navigateToInitialScreen])

  useEffect(() => {
    // Initial login check - don't show network error if server is not running
    checkLoginState(false)
  }, [checkLoginState])

  const logout = useCallback(async () => {
    try {
      await fetch(`${serverUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      setNetworkError(false) // Clear network error on successful logout
    } catch (error) {
      console.error('Error logging out:', error)
      setNetworkError(true) // Set network error flag
      navigateToInitialScreen() // Navigate back to initial screen
    } finally {
      setAuthToken(undefined)
      setAuthEmail("")
      setUser(null)
      setLoggedIn(false)
      // Clear axios authorization header
      delete axios.defaults.headers.common['Authorization']
    }
  }, [setAuthEmail, setAuthToken, navigateToInitialScreen])

  const validationError = useMemo(() => {
    if (!authEmail || authEmail.length === 0) return "can't be blank"
    if (authEmail.length < 6) return "must be at least 6 characters"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) return "must be a valid email address"
    return ""
  }, [authEmail])

  const value = {
    isAuthenticated: !!authToken,
    authToken,
    authEmail,
    user,
    isLoading,
    networkError,
    loggedIn,
    setAuthToken,
    setAuthEmail,
    logout,
    checkLoginState,
    resetNetworkError,
    validationError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
