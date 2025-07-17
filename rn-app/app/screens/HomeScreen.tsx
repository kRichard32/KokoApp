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
  Dimensions,
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

  // 获取屏幕尺寸进行自适应
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window')
  const isSmallScreen = screenHeight < 700 // 小屏幕设备
  const isMediumScreen = screenHeight >= 700 && screenHeight < 850 // 中等屏幕

  // 语音录制状态
  const [isRecording, setIsRecording] = useState(false)
  const scaleAnim = useState(new Animated.Value(1))[0]
  const pulseAnim = useState(new Animated.Value(1))[0]

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
          { 
            backgroundColor: tint, 
            width: "48%", 
            marginBottom: isSmallScreen ? 8 : 12,
            minHeight: isSmallScreen ? 120 : isMediumScreen ? 130 : 140, // 响应式高度
          },
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
  const startRecording = () => {
    if (isRecording) return // 防止重复触发
    
    setIsRecording(true)
    
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

    console.log("Recording started - implement voice recognition here")
  }

  const stopRecording = () => {
    if (!isRecording) return // 防止重复触发
    
    setIsRecording(false)
    
    // 停止脉冲动画并重置按钮大小
    pulseAnim.stopAnimation()
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
      <Text preset="heading" style={[
        themed($headline),
        { fontSize: isSmallScreen ? 32 : isMediumScreen ? 36 : 38 } // 响应式字体大小
      ]}>
        What do {"\n"}
        you <Text style={{ 
          color: colors.tint, 
          textDecorationLine: 'underline', 
          fontSize: isSmallScreen ? 32 : isMediumScreen ? 36 : 38, 
          fontWeight: 'bold' 
        }}>need?</Text> 😊
      </Text>

      {/* 4 宫格按钮 */}
      <View style={$cardGrid}>
        {ACTIONS.map(renderActionCard)}
      </View>

      {/* 语音提示卡片 - 小屏幕时可选择隐藏或简化 */}
      {!isSmallScreen && (
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
      )}

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
        />
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
  paddingTop: spacing.lg, // 减少顶部间距
})

const $greetingRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16, // 减少间距
}

const $headline: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg, // 减少底部间距
  fontSize: 38, // 略微减小字体
  lineHeight: 46, // 相应调整行高
  fontWeight: 'bold',
})

const $cardGrid: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: -60, // 减少底部间距，缩短与语音部分的距离
}

const $card: ViewStyle = {
  borderRadius: 16, // 略微减小圆角
  aspectRatio: 0.9, // 调整比例，让卡片稍微不那么高
  justifyContent: "center",
  alignItems: "center",
  minHeight: 140, // 减少最小高度
}

const $cardLabel: TextStyle = {
  marginTop: 8,
}

const $voicePromptCard: ViewStyle = {
  backgroundColor: "#F8F9FF",
  borderRadius: 16, // 增大圆角
  padding: 20, // 增大内边距
  marginBottom: 20, // 增大底部间距
  borderWidth: 2, // 增加边框宽度
  borderColor: "#E1E5F7",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.12, // 增加阴影透明度
  shadowRadius: 5, // 增大阴影半径
  elevation: 3,
  minHeight: 120, // 设置最小高度
}

const $voicePromptHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 14, // 增大间距
}

const $voicePromptIcon: TextStyle = {
  fontSize: 22, // 增大图标
  marginRight: 10,
}

const $voicePromptTitle: TextStyle = {
  color: "#374151",
  fontWeight: "bold", // 加粗
  fontSize: 18, // 增大字体
}

const $voicePromptExamples: ViewStyle = {
  gap: 8, // 增大行间距
}

const $voicePromptExample: TextStyle = {
  fontSize: 16, // 增大字体
  color: "#6B7280",
  fontStyle: "italic",
  lineHeight: 24, // 增大行高
}

const $voiceButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 25, // 增大圆角
  paddingVertical: 18, // 增大垂直内边距
  paddingHorizontal: 28, // 增大水平内边距
  marginBottom: 20, // 增大底部间距
  borderWidth: 3, // 增加边框宽度
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 5,
  minHeight: 70, // 设置最小高度
}

const $voiceIcon: TextStyle = {
  marginRight: 14, // 增加间距
  fontSize: 28, // 增大图标
}

const $voiceLabel: TextStyle = {
  color: "#2D5016", // 深绿色，老年人友好
  fontSize: 20, // 增大字体
  fontWeight: "bold", // 加粗
}

const $cancelButton: ViewStyle = {
  alignSelf: "center",
  backgroundColor: "#FFF",
  borderRadius: 16, // 稍微减小圆角
  paddingVertical: 10, // 减少垂直内边距
  paddingHorizontal: 20, // 减少水平内边距
  marginTop: 12, // 减少顶部间距
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
  backgroundColor: "rgba(0, 0, 0, 0.3)",
  zIndex: 500, // 低于语音按钮的 zIndex (1000)
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
