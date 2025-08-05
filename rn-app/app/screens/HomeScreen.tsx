// app/screens/HomeScreen.tsx
import { FC, useState, useEffect } from "react"
import {
  View,
  Pressable,
  TextInput,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageStyle,
} from "react-native"
import axios from "axios"
import messaging from '@react-native-firebase/messaging'
import '@/config/firebase' // Initialize Firebase

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { VoiceRecordingButton } from "@/components/VoiceRecordingButton"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

interface HomeScreenProps extends AppStackScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [userProfile, setUserProfile] = useState<any>(null)
  const [userName, setUserName] = useState("Agnes Freeman") // Default name
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null)

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile()
    
    // Register FCM token and set up cleanup
    const setupFCM = async () => {
      const cleanup = await registerFCMToken()
      return cleanup
    }
    
    let cleanupFn: (() => void) | undefined
    setupFCM().then(cleanup => {
      cleanupFn = cleanup
    })
    
    // Cleanup function for useEffect
    return () => {
      if (cleanupFn) {
        cleanupFn()
      }
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/profile/getUserProfile`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Profile data:', response.data)
      
      if (response.data && response.data.name) {
        setUserProfile(response.data)
        setUserName(response.data.name)
      }

      // Fetch profile picture
      await fetchProfilePicture()
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Keep default name if fetch fails
    }
  }

  const fetchProfilePicture = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/profile/getUserProfilePicture`, {
        withCredentials: true,
        responseType: 'arraybuffer', // Important for binary data
      })

      if (response.data && response.data.byteLength > 0) {
        // Convert byte array to base64
        const base64String = btoa(
          new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        
        // Create data URI
        const dataUri = `data:image/jpeg;base64,${base64String}`
        setProfilePictureUri(dataUri)
        console.log('Profile picture loaded successfully')
      } else {
        console.log('No profile picture found, using default avatar')
      }
    } catch (error: any) {
      // Don't treat missing profile picture as an error, just log it
      if (error.response?.status === 404) {
        console.log('No profile picture available, using default avatar')
      } else {
        console.log('Could not load profile picture, using default avatar:', error.message)
      }
      // Keep default profile picture - don't set profilePictureUri
    }
  }

  const registerFCMToken = async (): Promise<(() => void) | undefined> => {
    try {
      console.log('Registering FCM token for Android...')
      
      // Request notification permission
      const authStatus = await messaging().requestPermission()
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL

      if (!enabled) {
        console.log('Push notification permission denied')
        return undefined
      }

      // Get FCM token
      const fcmToken = await messaging().getToken()
      
      if (!fcmToken) {
        console.log('No FCM token available')
        return undefined
      }
      
      console.log('Android FCM Token:', fcmToken)
      
      // Register token with backend
      const response = await axios.post(`${serverUrl}/api/notifications/register-token`, {
        fcmToken,
        platform: Platform.OS, // 'android'
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('FCM token registered successfully:', response.data)

      // Set up foreground notification handling
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('Foreground notification received:', remoteMessage)
        
        if (remoteMessage.notification) {
          console.log('Notification Title:', remoteMessage.notification.title)
          console.log('Notification Body:', remoteMessage.notification.body)
          
          // You can show a custom in-app notification here if needed
          // For now, just log the notification details
        }
      })

      // Return cleanup function
      return unsubscribe

    } catch (error) {
      console.error('Error registering FCM token:', error)
      return undefined
    }
  }

  /** ====== 卡片按钮元数据 ====== */
  const ACTIONS = [
    { key: "Chat", emoji: "💬", tint: colors.palette.primary100, route: "Message" },
    { key: "Match", emoji: "🤝", tint: colors.palette.secondary100, route: "People" },
    { key: "Events", emoji: "🎉", tint: colors.palette.secondary100, route: "Events" },
    { key: "Reminders", emoji: "⏰", tint: colors.palette.primary100, route: "Reminders" },
  ] as const

  /** ====== 底栏按钮元数据 ====== */
  const BOTTOM_TABS = [
    { key: "Home", emoji: "😊" },
    { key: "Favorites", emoji: "❤️" },
    { key: "Alerts", emoji: "🔔" },
    { key: "Settings", emoji: "⚙️" },
  ] as const

  /** ====== 渲染函数 ====== */
  function renderActionCard({ key, emoji, tint, route }: (typeof ACTIONS)[number]) {
    return (
      <Pressable
        key={key}
        accessible
        accessibilityRole="button"
        accessibilityLabel={key}
        onPress={() => navigation.navigate(route as never)}
        style={[
          $card,
          { backgroundColor: tint, width: "48%", marginBottom: 12 },
        ]}
      >
        <Text size="xl" weight="bold">
          {emoji}
        </Text>
        <Text preset="formLabel" size="md" style={$cardLabel}>
          {key}
        </Text>
      </Pressable>
    )
  }

  /** ====== AI智能助理指令处理 ====== */
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()
    
    if (lowerCommand.includes("talk to mary") || lowerCommand.includes("mary")) {
      // 跳转到Mary Floyd的聊天界面
      navigation.navigate("ChatDetail", {
        conversationId: "mary-floyd",
      })
    }
    // 可以在这里添加更多语音指令处理
    // else if (lowerCommand.includes("reminders")) {
    //   navigation.navigate("Reminders")
    // }
    // else if (lowerCommand.includes("friends")) {
    //   navigation.navigate("Match")
    // }
  }

  return (
    <Screen
      preset="auto"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($container)}
    >
      {/* Greeting */}
      <View style={$greetingRow}>
        {/* 头像 - 点击进入健康打卡 */}
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel="Health Check-in"
          onPress={() => navigation.navigate("HealthCheck")}
        >
          <Image
            source={
              profilePictureUri 
                ? { uri: profilePictureUri }
                : require("../../assets/images/avatar-placeholder.jpg")
            }
            style={[
              $avatar,                      // 之前定义过的样式：48×48、borderRadius、marginRight、borderWidth
              { borderColor: colors.palette.neutral300 },
            ]}
            resizeMode="cover"
          />
        </Pressable>
        {/* 文本容器 */}
        <View>
          <Text size="xs" weight="light">
            Good morning
          </Text>
          <Text weight="medium">{userName}</Text>
        </View>
      </View>

      {/* 大标题 */}
      <Text preset="heading" style={themed($headline)}>
        What do {"\n"}
        you <Text style={{ color: colors.tint, textDecorationLine: 'underline', fontSize: 42, fontWeight: 'bold' }}>need?</Text> 😊
      </Text>

      {/* 4 宫格按钮 */}
      <View style={$cardGrid}>
        {ACTIONS.map(renderActionCard)}
      </View>

      {/* 语音提示卡片 */}
      <View style={$voicePromptCard}>
        <View style={$voicePromptHeader}>
          <Text style={$voicePromptIcon}>💬</Text>
          <Text preset="formLabel" size="md" weight="medium" style={$voicePromptTitle}>
            What can I say?
          </Text>
        </View>
        <View style={$voicePromptExamples}>
          <Text style={$voicePromptExample}>"Show me today's reminders"</Text>
          <Text style={$voicePromptExample}>"Find friends"</Text>
          <Text style={$voicePromptExample}>"Open chat"</Text>
        </View>
      </View>

      {/* 语音按钮 */}
      <VoiceRecordingButton navigation={navigation} />

      {/* 搜索栏；KeyboardAvoiding 让键盘不挡住输入 */}
      {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TextField
          placeholder="Enter search text"
          LeftAccessory={() => <Text style={$searchIcon}>🔍</Text>}
          containerStyle={[
            $searchField,
            { backgroundColor: colors.palette.neutral100, borderColor: "transparent" },
          ]}
          inputWrapperStyle={{ paddingVertical: spacing.md }}
          style={{ fontSize: 16, color: colors.palette.neutral600 }}
        />
      </KeyboardAvoidingView> */}

      {/* 底栏导航 */}
      {/* <View style={[$bottomBar, { borderTopColor: colors.border }]}>
        {BOTTOM_TABS.map(({ key, emoji }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={key}
            style={$bottomTabButton}
          >
            <Text size="lg">{emoji}</Text>
          </Pressable>
        ))}
      </View> */}
    </Screen>
  )
}

/* ————————— 样式 ————————— */

export const palette = {
  primary: "#1E40AF",
  accent:  "#22C55E",
  chatBg:  "#E0F2FE",
  schedBg: "#EDE9FE",
  newsBg:  "#FEF3C7",
  pharmBg:"#DCFCE7",
  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray300: "#D1D5DB",
}

const $avatar: ImageStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  marginRight: 8,
  borderWidth: 1,
  borderColor: palette.gray300,
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
})

const $greetingRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 24,
}

const $headline: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
  fontSize: 54,
  lineHeight: 64,
  fontWeight: 'bold',
})

const $cardGrid: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: -70, // 减少底部间距
}

const $card: ViewStyle = {
  borderRadius: 20,
  aspectRatio: 0.85, // 让按钮更高一些，从正方形变成稍微高一点的矩形
  justifyContent: "center",
  alignItems: "center",
  minHeight: 160,
}

const $cardLabel: TextStyle = {
  marginTop: 8,
  fontSize: 24,
}

const $voicePromptCard: ViewStyle = {
  backgroundColor: "#F8F9FF",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#E1E5F7",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  elevation: 2,
}

const $voicePromptHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
}

const $voicePromptIcon: TextStyle = {
  fontSize: 28,
  marginRight: 8,
}

const $voicePromptTitle: TextStyle = {
  color: "#374151",
  fontWeight: "600",
  fontSize: 22,
}

const $voicePromptExamples: ViewStyle = {
  gap: 6,
}

const $voicePromptExample: TextStyle = {
  fontSize: 18,
  color: "#6B7280",
  fontStyle: "italic",
  lineHeight: 26,
}

const $searchField: ViewStyle = {
  borderWidth: 0,
  borderRadius: 20,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
}

const $searchIcon: TextStyle = {
  marginLeft: 4,
  marginRight: 8,
  opacity: 0.6,
}

const $bottomBar: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  borderTopWidth: 1,
  paddingVertical: 8,
}

const $bottomTabButton: ViewStyle = {
  padding: 8,
}
