import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo, useEffect, useState } from "react"
import { useMMKVString } from "react-native-mmkv"
import { CommonActions } from "@react-navigation/native"
import { navigationRef } from "@/navigators/navigationUtilities"
import { SecureStorage } from "@/utils/secureStorage"

import axios from "axios"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

export type AuthContextType = {
  isAuthenticated: boolean
  authToken?: string
  authEmail?: string
  user?: any
  isLoading: boolean
  networkError: boolean
  loggedIn: boolean
  profileChecked: boolean
  hasProfile: boolean
  setAuthToken: (token?: string) => void
  setAuthEmail: (email: string) => void
  logout: () => void
  checkLoginState: (showNetworkError?: boolean) => Promise<void>
  resetNetworkError: () => void
  refreshTokenIfNeeded: () => Promise<boolean>
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
  const [profileChecked, setProfileChecked] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false) // Track if we're already refreshing

  // Set up axios interceptors to include auth token and handle token refresh
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (authToken && authToken !== "authenticated") {
          config.headers.Authorization = `Bearer ${authToken}`
          console.log('Request interceptor: Adding token', authToken.substring(0, 20) + '...')
        } else {
          console.log('Request interceptor: No valid token available, authToken:', authToken)
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Cleanup interceptor on unmount or token change
    return () => {
      axios.interceptors.request.eject(requestInterceptor)
    }
  }, [authToken]) // Only depend on authToken changes

  // Set up response interceptor separately to avoid re-registration
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        // If we get a 401 and haven't already tried to refresh this specific request
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
          originalRequest._retry = true
          setIsRefreshing(true) // Prevent multiple simultaneous refresh attempts
          
          console.log('Received 401, attempting token refresh...')
          try {
            // Check if we have a refresh token
            const refreshToken = await SecureStorage.getRefreshToken()
            console.log('Refresh token check:', refreshToken ? 'Found' : 'Not found')
            
            if (!refreshToken) {
              console.log('No refresh token available for auto-refresh')
              setIsRefreshing(false)
              await SecureStorage.clearAllTokens()
              setAuthToken(undefined)
              setLoggedIn(false)
              navigateToInitialScreen()
              return Promise.reject(error)
            }

            console.log('Attempting to refresh access token with refresh token...')
            const newAccessToken = await SecureStorage.refreshAccessToken(serverUrl || '')
            
            if (newAccessToken) {
              console.log('Auto-refresh successful, new token:', newAccessToken.substring(0, 20) + '...')
              
              // Update the context state first
              setAuthToken(newAccessToken)
              
              // Update the global axios headers
              axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
              console.log('Updated axios default headers')
              
              // Ensure the original request has the new token
              if (!originalRequest.headers) {
                originalRequest.headers = {}
              }
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
              console.log('Updated original request headers')
              
              setIsRefreshing(false)
              
              // Log the headers being sent
              console.log('Retrying request with headers:', originalRequest.headers.Authorization?.substring(0, 30) + '...')
              
              return axios(originalRequest)
            } else {
              console.log('Auto-refresh failed')
              await SecureStorage.clearAllTokens()
              setAuthToken(undefined)
              setLoggedIn(false)
              setIsRefreshing(false)
            }
          } catch (refreshError) {
            console.error('Error during auto-refresh:', refreshError)
            await SecureStorage.clearAllTokens()
            setAuthToken(undefined)
            setLoggedIn(false)
            setIsRefreshing(false)
          }
        }
        
        return Promise.reject(error)
      }
    )

    // Cleanup response interceptor
    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, []) // Empty dependency array - only setup once

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

  const checkUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/profile/getUserProfile`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Profile found:', response.data)
      
      if (!response.data || Object.keys(response.data).length === 0) {
        console.log('No user profile found')
        setHasProfile(false)
      } else {
        console.log('User profile exists')
        setHasProfile(true)
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
      setHasProfile(false)
    } finally {
      setProfileChecked(true)
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
        
        // Check user profile after successful authentication
        await checkUserProfile()
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
  }, [setAuthToken, navigateToInitialScreen, checkUserProfile])

  useEffect(() => {
    // Initial login check - don't show network error if server is not running
    checkLoginState(false)
  }, [checkLoginState])

  // Initialize tokens from secure storage on app start
  useEffect(() => {
    const initializeTokens = async () => {
      try {
        const storedAccessToken = await SecureStorage.getAccessToken()
        if (storedAccessToken && storedAccessToken !== authToken) {
          console.log('Loading stored access token from secure storage')
          setAuthToken(storedAccessToken)
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`
        }
      } catch (error) {
        console.error('Failed to load tokens from secure storage:', error)
      }
    }

    initializeTokens()
  }, []) // Only run once on mount

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
      setProfileChecked(false)
      setHasProfile(false)
      
      // Clear tokens from secure storage
      try {
        await SecureStorage.clearAllTokens()
        console.log('Tokens cleared from secure storage during logout')
      } catch (storageError) {
        console.error('Failed to clear tokens from secure storage:', storageError)
      }
      
      navigateToInitialScreen()
      // Clear axios authorization header
      delete axios.defaults.headers.common['Authorization']
    }
  }, [setAuthEmail, setAuthToken, navigateToInitialScreen])

  // Function to refresh access token using stored refresh token
  const refreshTokenIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Checking if token refresh is needed...')
      
      // Check if we have a refresh token
      const hasRefreshToken = await SecureStorage.hasRefreshToken()
      if (!hasRefreshToken) {
        console.log('No refresh token available')
        return false
      }

      // Try to refresh the access token
      const newAccessToken = await SecureStorage.refreshAccessToken(serverUrl || '')
      
      if (newAccessToken) {
        console.log('Access token refreshed successfully')
        setAuthToken(newAccessToken)
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
        return true
      } else {
        console.log('Failed to refresh access token')
        // Clear invalid tokens and redirect to login
        await SecureStorage.clearAllTokens()
        setAuthToken(undefined)
        setLoggedIn(false)
        navigateToInitialScreen()
        return false
      }
    } catch (error) {
      console.error('Error during token refresh:', error)
      // Clear tokens and redirect to login on error
      await SecureStorage.clearAllTokens()
      setAuthToken(undefined)
      setLoggedIn(false)
      navigateToInitialScreen()
      return false
    }
  }, [setAuthToken, navigateToInitialScreen])

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
    profileChecked,
    hasProfile,
    setAuthToken,
    setAuthEmail,
    logout,
    checkLoginState,
    resetNetworkError,
    refreshTokenIfNeeded,
    validationError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
