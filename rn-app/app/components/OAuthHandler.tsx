import { useEffect } from "react"
import { AppState, Linking } from "react-native"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { navigationRef } from "@/navigators/navigationUtilities"
import { CommonActions } from "@react-navigation/native"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

export const OAuthHandler = () => {
  const { checkLoginState, setAuthToken } = useAuth()

  const navigateToInitialScreen = () => {
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
        console.log('Navigated to OAuthLogin screen')
      } catch (navError) {
        console.error('Navigation error:', navError)
        // Fallback to reset if navigate fails
        try {
          navigationRef.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'OAuthLogin' }],
            })
          )
        } catch (resetError) {
          console.error('Reset navigation also failed:', resetError)
        }
      }
    } else {
      console.log('Navigation not ready, skipping navigation to OAuthLogin')
    }
  }

  useEffect(() => {
    // Handle OAuth callback URLs
    const handleURL = async (url: string) => {
      console.log('=== DEEP LINK RECEIVED ===')
      console.log('Full URL:', url)
      console.log('URL Length:', url.length)
      console.log('URL Type:', typeof url)
      
      if (url.includes('koko://oauth-callback')) {
        console.log('=== OAUTH CALLBACK DETECTED ===')
        // Extract the query parameters from the OAuth callback
        try {
          const urlObj = new URL(url)
          console.log('URL Object created successfully')
          console.log('Protocol:', urlObj.protocol)
          console.log('Host:', urlObj.host)
          console.log('Pathname:', urlObj.pathname)
          console.log('Search params:', urlObj.search)
          console.log('Hash:', urlObj.hash)
          
          const code = urlObj.searchParams.get('code')
          const state = urlObj.searchParams.get('state')
          const error = urlObj.searchParams.get('error')
          const success = urlObj.searchParams.get('success')
          
          console.log('=== EXTRACTED PARAMETERS ===')
          console.log('Code:', code)
          console.log('State:', state)
          console.log('Error:', error)
          console.log('Success:', success)
          console.log('All search params:')
          urlObj.searchParams.forEach((value, key) => {
            console.log(`  ${key}: ${value}`)
          })
          
          if (error) {
            console.error('OAuth error detected:', error)
          } else if (code) {
            console.log('OAuth success - Authorization code received:', code)
            console.log('OAuth state parameter:', state)
            
            // Exchange authorization code for token using query parameters from deep link
            try {
              // Extract query string from the URL (similar to window.location.search)
              const urlObj = new URL(url)
              const queryString = urlObj.search // This gives us "?code=abc&state=xyz"
              
              console.log('Query string to send:', queryString)
              
              const res = await axios.get(`${serverUrl}/auth/token${queryString}`, {
                withCredentials: true, // Similar to credentials: 'include'
                headers: {
                  'Content-Type': 'application/json',
                },
              })
              
              console.log('Token exchange successful:', res.data)
              // Store the token if it's returned in the response
              if (res.data.idToken) {
                const token = res.data.idToken
                console.log('Storing received token:', token.substring(0, 20) + '...')
                console.log('Token length:', token.length)
                setAuthToken(token)
                console.log('Token has been set in context')
                
                // Set up axios default authorization header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                console.log('Axios authorization header set')
              } else {
                console.error('No idToken found in response. Authentication failed.')
                navigateToInitialScreen()
                return
              }
              
              // Check login state after successful token exchange to validate token and navigate
              console.log('=== CHECKING LOGIN STATE AFTER TOKEN EXCHANGE ===')
              try {
                await checkLoginState()
                console.log('Login state check completed successfully after token exchange')
                console.log('Authentication status should now be updated, navigation will happen automatically')
              } catch (loginError) {
                console.error('Network error during login state check after token exchange:', loginError)
                console.error('Token may be invalid or server is unreachable')
                navigateToInitialScreen()
              }
            } catch (tokenError) {
              console.error('Error during token exchange:', tokenError)
              console.error('This could mean the authorization code is invalid or expired')
              navigateToInitialScreen()
            }
          } else if (success) {
            console.log('OAuth success flag received:', success)
          } else {
            console.log('No recognized OAuth parameters found')
          }
          
          // Note: Login state check now happens after successful token exchange above
        } catch (error) {
          console.error('=== ERROR PARSING OAUTH CALLBACK URL ===')
          console.error('Error details:', error)
          console.error('Original URL:', url)
          navigateToInitialScreen()
        }
      } else {
        console.log('=== NON-OAUTH DEEP LINK ===')
        console.log('URL does not contain oauth-callback, ignoring')
      }
      console.log('=== DEEP LINK PROCESSING COMPLETE ===')
    }

    // Listen for URL events
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('=== URL EVENT LISTENER TRIGGERED ===')
      console.log('Event object:', JSON.stringify(event, null, 2))
      console.log('Event URL:', event.url)
      handleURL(event.url)
    })

    // Handle initial URL if app was opened by a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('=== INITIAL URL DETECTED ===')
        console.log('App was opened with initial URL:', url)
        handleURL(url)
      } else {
        console.log('=== NO INITIAL URL ===')
        console.log('App was not opened with a deep link')
      }
    }).catch((error) => {
      console.error('=== ERROR GETTING INITIAL URL ===')
      console.error('Error:', error)
    })

    // Handle app state changes (when user returns from browser)
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Small delay to ensure OAuth flow is complete
        setTimeout(async () => {
          try {
            await checkLoginState()
          } catch (error) {
            console.error('Network error during app state change:', error)
            navigateToInitialScreen()
          }
        }, 1000)
      }
    }

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription?.remove()
      appStateSubscription?.remove()
    }
  }, [checkLoginState])

  return null // This component doesn't render anything
}
