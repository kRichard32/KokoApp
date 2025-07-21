import { FC, useState } from "react"
import { TouchableOpacity, View, Alert, Linking } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"
import { useAuth } from "@/context/AuthContext"

const serverUrl = "http://10.0.2.2:8080"

export const OAuthLoginScreen: FC = function OAuthLoginScreen() {
  const { themed } = useAppTheme()
  const { checkLoginState, networkError, resetNetworkError, authToken, setAuthToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    resetNetworkError() // Clear any previous network errors
    try {
      // Get the OAuth URL from your server
      const response = await fetch(`${serverUrl}/auth/url`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.url) {
        // Open the OAuth URL in the default browser
        await Linking.openURL(data.url)
        
        // Check login state after user returns (you might want to add a listener for app state changes)
        setTimeout(() => {
          checkLoginState()
          setIsLoading(false)
        }, 2000)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('OAuth error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={$styles.container} safeAreaEdges={["top"]}>
      <View style={themed($container)}>
        <Text preset="heading" text="Welcome to Kindial" style={themed($title)} />
        <Text text="Choose your preferred sign-in method" style={themed($subtitle)} />

        {networkError && (
          <View style={themed($errorBanner)}>
            <Text text="⚠️ Network error occurred. Please check your connection." style={themed($errorText)} />
            <TouchableOpacity onPress={resetNetworkError} style={themed($dismissButton)}>
              <Text text="Dismiss" style={themed($dismissButtonText)} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={themed($oauthButton)}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Text text="🔍 Continue with Google" style={themed($buttonText)} />
        </TouchableOpacity>

        {isLoading && (
          <Text text="Authenticating..." style={themed($loadingText)} />
        )}
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<any> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  padding: spacing.lg,
})

const $title: ThemedStyle<any> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $subtitle: ThemedStyle<any> = ({ spacing, colors }) => ({
  textAlign: "center",
  color: colors.textDim,
  marginBottom: spacing.xl,
})

const $oauthButton: ThemedStyle<any> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 12,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
  alignItems: "center",
})

const $secondaryButton: ThemedStyle<any> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
})

const $buttonText: ThemedStyle<any> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "bold",
  fontSize: 16,
})

const $secondaryButtonText: ThemedStyle<any> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "bold",
  fontSize: 16,
})

const $loadingText: ThemedStyle<any> = ({ spacing, colors }) => ({
  textAlign: "center",
  color: colors.textDim,
  marginTop: spacing.md,
})

const $errorBanner: ThemedStyle<any> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.angry100,
  borderRadius: 8,
  padding: spacing.md,
  marginBottom: spacing.lg,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $errorText: ThemedStyle<any> = ({ colors }) => ({
  color: colors.palette.angry500,
  flex: 1,
  marginRight: 8,
})

const $dismissButton: ThemedStyle<any> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.angry500,
  borderRadius: 4,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $dismissButtonText: ThemedStyle<any> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 12,
  fontWeight: "bold",
})
