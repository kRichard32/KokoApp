import { FC, useEffect } from "react"
import { View } from "react-native"
import { useAuth } from "@/context/AuthContext"
import { useAppTheme } from "@/theme/context"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"

interface OAuthCallbackScreenProps extends AppStackScreenProps<"OAuthCallback"> {}

export const OAuthCallbackScreen: FC<OAuthCallbackScreenProps> = function OAuthCallbackScreen({ navigation }) {
  const { themed } = useAppTheme()
  const { checkLoginState, loggedIn} = useAuth()
  useEffect(() => {
    
    // Navigate to Home screen when user is logged in
    if (loggedIn) {
      console.log('User is logged in, navigating to Home screen')
      navigation.replace('Home')
    }
  }, [loggedIn, navigation])

  useEffect(() => {
    // Automatically check login state when this screen loads
    const checkAuth = async () => {
      try {
        console.log('OAuth callback screen loaded - checking login state')
        await checkLoginState()
      } catch (error) {
        console.error('Error checking login state from callback screen:', error)
      }
    }

    // Small delay to ensure the OAuth process is complete
    const timer = setTimeout(checkAuth, 500)
    
    return () => clearTimeout(timer)
  }, [checkLoginState])

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($content)}>
        <Text preset="heading" text="Processing Login..." style={themed($title)} />
        <Text text="Please wait while we complete your authentication." style={themed($subtitle)} />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<any> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $content: ThemedStyle<any> = ({ spacing }) => ({
  alignItems: "center",
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
