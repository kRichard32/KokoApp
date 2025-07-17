// app/screens/HomeScreen.tsx
import { FC, useState } from "react"
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
  Animated,
  StyleSheet,
} from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface HomeScreenProps extends AppStackScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  // 语音录制状态
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const scaleAnim = useState(new Animated.Value(1))[0]
  const pulseAnim = useState(new Animated.Value(1))[0]
  const textOpacityAnim = useState(new Animated.Value(0))[0]
  // Siri波形动画
  const waveAnim1 = useState(new Animated.Value(0.5))[0]
  const waveAnim2 = useState(new Animated.Value(0.7))[0]
  const waveAnim3 = useState(new Animated.Value(0.3))[0]
  const waveAnim4 = useState(new Animated.Value(0.8))[0]
  const waveAnim5 = useState(new Animated.Value(0.6))[0]

  /** ====== 卡片按钮元数据 ====== */
  const ACTIONS = [
    { key: "Chat", emoji: "💬", tint: colors.palette.primary100, route: "Message" },
    { key: "Match", emoji: "🤝", tint: colors.palette.secondary100, route: "Match" },
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

  /** ====== 语音处理函数 ====== */
  const mockVoiceRecognition = () => {
    const sampleTexts = [
      "I want to talk to Mary",
      // "Show me today's reminders", 
      // "Find my friends",
      // "Open chat messages",
      // "What events are coming up",
      // "Help me with medication",
      // "Call my family",
      // "Schedule a doctor appointment"
    ]
    
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)]
    
    // 模拟语音识别处理时间
    setTimeout(() => {
      setRecognizedText(randomText)
      setIsProcessing(false)
      
      // 文字淡入动画，像Siri一样从下往上滑入
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.05, // 轻微放大
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        })
      ]).start()
      
      // AI智能助理行为：处理语音指令
      setTimeout(() => {
        handleVoiceCommand(randomText)
      }, 1500) // 显示文字1.5秒后执行指令
      
    }, 800 + Math.random() * 1200) // 稍微缩短处理时间
  }

  /** ====== AI智能助理指令处理 ====== */
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()
    
    if (lowerCommand.includes("talk to mary") || lowerCommand.includes("mary")) {
      // 淡出当前界面并跳转到Mary的聊天
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        })
      ]).start(() => {
        setRecognizedText("")
        // 跳转到Mary Floyd的聊天界面
        navigation.navigate("ChatDetail", {
          contactId: "mary-floyd",
          contactName: "Mary Floyd"
        })
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

  const startRecording = () => {
    if (isRecording) return // 防止重复触发
    
    setIsRecording(true)
    setIsProcessing(true)
    setRecognizedText("")
    textOpacityAnim.setValue(0)
    
    // 按钮放大动画
    Animated.spring(scaleAnim, {
      toValue: 1.2,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start()

    // 脉冲动画
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulseAnimation.start()

    // Siri波形动画
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600 + delay,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0.2,
            duration: 600 + delay,
            useNativeDriver: false,
          }),
        ])
      )
    }

    createWaveAnimation(waveAnim1, 0).start()
    createWaveAnimation(waveAnim2, 100).start()
    createWaveAnimation(waveAnim3, 200).start()
    createWaveAnimation(waveAnim4, 50).start()
    createWaveAnimation(waveAnim5, 150).start()

    // 开始模拟语音识别
    mockVoiceRecognition()

    console.log("Recording started - implement voice recognition here")
  }

  const stopRecording = () => {
    if (!isRecording) return // 防止重复触发
    
    setIsRecording(false)
    setIsProcessing(false)
    
    // 停止所有动画并重置按钮大小
    pulseAnim.stopAnimation()
    waveAnim1.stopAnimation()
    waveAnim2.stopAnimation()
    waveAnim3.stopAnimation()
    waveAnim4.stopAnimation()
    waveAnim5.stopAnimation()
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()

    console.log("Recording stopped")
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
            source={require("../../assets/images/avatar-placeholder.jpg")}
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
          <Text weight="medium">Agnes Freeman</Text>
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
      <Animated.View
        style={[
          { 
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            zIndex: 1000, // 确保按钮在遮罩之上
            elevation: 1000, // Android elevation
          }
        ]}
      >
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel={isRecording ? "Stop recording" : "Voice command"}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={[
            $voiceButton,
            { 
              backgroundColor: isRecording ? "#FFE4E1" : colors.palette.accent100, 
              borderColor: isRecording ? "#FF6B6B" : colors.palette.accent500,
            },
          ]}
        >
          <Text size="xxl" style={$voiceIcon}>
            {isRecording ? "🔴" : "🎤"}
          </Text>
          <Text preset="formLabel" size="lg" weight="medium" style={$voiceLabel}>
            {isRecording ? "Listening..." : "Hold to speak"}
          </Text>
        </Pressable>
      </Animated.View>

      {/* 录制时的取消按钮 */}
      {isRecording && (
        <Pressable
          style={$cancelButton}
          onPress={stopRecording}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Cancel recording"
        >
          <Text preset="formLabel" size="md" style={$cancelButtonText}>
            Cancel
          </Text>
        </Pressable>
      )}

      {/* 录制时的背景遮罩 */}
      {isRecording && (
        <View
          pointerEvents="none"
          style={$recordingOverlay}
        >
          {/* Siri风格的语音识别界面 */}
          <View style={$siriContainer}>
            {isProcessing ? (
              <View style={$siriProcessingContainer}>
                <View style={$siriWaveformContainer}>
                    <Text style={$siriIcon}>🗣️</Text>
                  <View style={$siriWaveform}>
                    <View style={[$siriWaveBar, { height: 20 }]} />
                    <View style={[$siriWaveBar, { height: 35 }]} />
                    <View style={[$siriWaveBar, { height: 15 }]} />
                    <View style={[$siriWaveBar, { height: 28 }]} />
                    <View style={[$siriWaveBar, { height: 22 }]} />
                  </View>
                </View>
                <Text style={$siriProcessingText}>Listening...</Text>
              </View>
            ) : (
              recognizedText && (
                <Animated.View style={[
                  $siriResultContainer,
                  { 
                    opacity: textOpacityAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}>
                  <View style={$siriResultHeader}>
                    <Text style={$siriResultIcon}>✓</Text>
                    <Text style={$siriResultTitle}>I heard:</Text>
                  </View>
                  <Text style={$siriResultText}>"{recognizedText}"</Text>
                  <View style={$siriResultActions}>
                    <Text style={$siriResultHint}>
                      {recognizedText.toLowerCase().includes("mary") 
                        ? "Opening chat with Mary..." 
                        : "Processing your request..."
                      }
                    </Text>
                  </View>
                </Animated.View>
              )
            )}
          </View>
        </View>
      )}

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
  fontSize: 42,
  lineHeight: 52,
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
  fontSize: 18,
  marginRight: 8,
}

const $voicePromptTitle: TextStyle = {
  color: "#374151",
  fontWeight: "600",
}

const $voicePromptExamples: ViewStyle = {
  gap: 6,
}

const $voicePromptExample: TextStyle = {
  fontSize: 14,
  color: "#6B7280",
  fontStyle: "italic",
  lineHeight: 20,
}

const $voiceButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 25,
  paddingVertical: 16,
  paddingHorizontal: 24,
  marginBottom: 20,
  borderWidth: 2,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $voiceIcon: TextStyle = {
  marginRight: 12,
}

const $voiceLabel: TextStyle = {
  color: "#2D5016", // 深绿色，老年人友好
}

const $cancelButton: ViewStyle = {
  alignSelf: "center",
  backgroundColor: "#FFF",
  borderRadius: 20,
  paddingVertical: 12,
  paddingHorizontal: 24,
  marginTop: 16,
  borderWidth: 1,
  borderColor: "#FF6B6B",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $cancelButtonText: TextStyle = {
  color: "#FF6B6B",
  fontWeight: "600",
}

const $recordingOverlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0, 0, 0, 0.75)", // 更深的背景，像Siri
  zIndex: 500,
}

// Siri风格的样式
const $siriContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
}

const $siriProcessingContainer: ViewStyle = {
  alignItems: "center",
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderRadius: 24,
  padding: 32,
  minWidth: 280,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 16,
}

const $siriWaveformContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 20,
}

const $siriIcon: TextStyle = {
  fontSize: 24,
  marginRight: 16,
}

const $siriWaveform: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
}

const $siriWaveBar: ViewStyle = {
  width: 4,
  backgroundColor: "#007AFF", // iOS蓝色
  borderRadius: 2,
  opacity: 0.8,
}

const $siriProcessingText: TextStyle = {
  fontSize: 20,
  fontWeight: "500",
  color: "#1D1D1F",
  textAlign: "center",
}

const $siriResultContainer: ViewStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderRadius: 28,
  padding: 36,
  maxWidth: "92%",
  minWidth: 320,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 12,
  },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 20,
}

const $siriResultHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 20,
}

const $siriResultIcon: TextStyle = {
  fontSize: 20,
  color: "#34C759", // iOS绿色
  marginRight: 12,
  fontWeight: "bold",
}

const $siriResultTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: "#8E8E93",
}

const $siriResultText: TextStyle = {
  fontSize: 28, // 大字体，老年人友好
  fontWeight: "600",
  color: "#1D1D1F",
  textAlign: "center",
  lineHeight: 36,
  marginBottom: 24,
  letterSpacing: 0.5,
}

const $siriResultActions: ViewStyle = {
  alignItems: "center",
}

const $siriResultHint: TextStyle = {
  fontSize: 16,
  fontWeight: "500",
  color: "#007AFF",
  textAlign: "center",
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
