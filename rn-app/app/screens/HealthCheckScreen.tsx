// app/screens/HealthCheckScreen.tsx
import { FC, useState, useEffect } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  Animated,
  StyleSheet,
  Alert,
  Vibration,
} from "react-native"
import * as ImagePicker from 'expo-image-picker'
import axios from "axios"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useAuth } from "@/context/AuthContext"

const serverUrl = "http://10.0.2.2:8080"

interface HealthCheckScreenProps extends AppStackScreenProps<"HealthCheck"> {}

interface HealthQuestion {
  id: string
  questionCN: string
  questionEN: string
  options: {
    id: string
    labelCN: string
    labelEN: string
    icon: string
    value: number // 1-5 评分
  }[]
}

interface Answer {
  questionId: string
  optionId: string
  value: number
  timestamp: Date
}

export const HealthCheckScreen: FC<HealthCheckScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // 健康问题数据 - 简化为只有英文
  const healthQuestions: HealthQuestion[] = [
    {
      id: "mood",
      questionCN: "今天您的心情如何？",
      questionEN: "How are you feeling today?",
      options: [
        { id: "excellent", labelCN: "很好", labelEN: "Great", icon: "😊", value: 5 },
        { id: "good", labelCN: "好", labelEN: "Good", icon: "🙂", value: 4 },
        { id: "neutral", labelCN: "一般", labelEN: "Okay", icon: "😐", value: 3 },
        { id: "poor", labelCN: "不好", labelEN: "Not Good", icon: "😔", value: 2 },
        { id: "terrible", labelCN: "很差", labelEN: "Bad", icon: "😞", value: 1 },
      ]
    },
    {
      id: "sleep",
      questionCN: "昨晚您睡得怎么样？",
      questionEN: "How did you sleep last night?",
      options: [
        { id: "very-well", labelCN: "很好", labelEN: "Very Well", icon: "😴", value: 5 },
        { id: "well", labelCN: "好", labelEN: "Well", icon: "😌", value: 4 },
        { id: "fair", labelCN: "一般", labelEN: "Fair", icon: "😪", value: 3 },
        { id: "poor", labelCN: "不好", labelEN: "Poor", icon: "😓", value: 2 },
        { id: "very-poor", labelCN: "很差", labelEN: "Very Poor", icon: "😵", value: 1 },
      ]
    },
    {
      id: "appetite",
      questionCN: "今天您的食欲如何？",
      questionEN: "How is your appetite today?",
      options: [
        { id: "excellent", labelCN: "很好", labelEN: "Great", icon: "😋", value: 5 },
        { id: "good", labelCN: "好", labelEN: "Good", icon: "🙂", value: 4 },
        { id: "normal", labelCN: "一般", labelEN: "Okay", icon: "😐", value: 3 },
        { id: "poor", labelCN: "不好", labelEN: "Poor", icon: "😕", value: 2 },
        { id: "no-appetite", labelCN: "没胃口", labelEN: "No Appetite", icon: "🤢", value: 1 },
      ]
    },
    {
      id: "pain",
      questionCN: "今天您有感到疼痛吗？",
      questionEN: "Are you in any pain today?",
      options: [
        { id: "no-pain", labelCN: "没有", labelEN: "No Pain", icon: "😌", value: 5 },
        { id: "mild", labelCN: "轻微", labelEN: "A Little", icon: "🙂", value: 4 },
        { id: "moderate", labelCN: "中等", labelEN: "Some Pain", icon: "😐", value: 3 },
        { id: "severe", labelCN: "严重", labelEN: "Bad Pain", icon: "😣", value: 2 },
        { id: "very-severe", labelCN: "非常严重", labelEN: "Very Bad", icon: "😫", value: 1 },
      ]
    }
  ]

  // 状态管理 - 简化版本，移除按钮相关状态
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isShowingSummary, setIsShowingSummary] = useState(false)
  const [checkinDay, setCheckinDay] = useState(1) // 打卡天数
  const [hasStarted, setHasStarted] = useState(false) // 是否已开始打卡
  // const [isRecording, setIsRecording] = useState(false) // 全程录音状态 - 暂时注释

  // 动画值 - 简化
  const highlightAnim = useState(new Animated.Value(0))[0]

  const currentQuestion = healthQuestions[currentQuestionIndex]
  const totalQuestions = healthQuestions.length
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  // 获取今天的日期
  const getTodayDate = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }
    return today.toLocaleDateString('en-US', options) // 改为英文日期
  }

  // 开始打卡
  const startHealthCheck = () => {
    setHasStarted(true)
    // TODO: 在这里开始全程录音
    // setIsRecording(true)
    // startContinuousListening()
  }

  // 处理语音回答 - 简化版本
  const handleVoiceAnswer = (spokenText: string) => {
    // TODO: 实现真实的语音识别和匹配逻辑
    // 目前只是模拟自动进入下一题
    
    // 震动反馈
    Vibration.vibrate(100)

    // 语音确认（模拟）
    Alert.alert(
      "Voice Confirmed",
      `I heard: "${spokenText}"`,
      [
        { text: "Try Again", onPress: () => {} },
        { text: "Continue", onPress: () => handleNext(spokenText) }
      ]
    )
  }

  // 下一题 - 简化版本
  const handleNext = (voiceAnswer?: string) => {
    // 模拟保存语音答案
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      optionId: "voice-answer", // 语音回答标识
      value: 3, // 默认值，实际应根据语音识别结果确定
      timestamp: new Date()
    }
    setAnswers(prev => [...prev, newAnswer])

    if (isLastQuestion) {
      // 显示摘要
      setIsShowingSummary(true)
    } else {
      // 下一题
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // 跳过
  const handleSkip = () => {
    if (isLastQuestion) {
      setIsShowingSummary(true)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // 模拟语音识别 - 简化版本
  const mockVoiceRecognition = () => {
    const sampleAnswers = ["Great", "Good", "Okay", "Not good", "Bad"]
    const randomAnswer = sampleAnswers[Math.floor(Math.random() * sampleAnswers.length)]
    
    // 模拟语音识别延迟
    setTimeout(() => {
      handleVoiceAnswer(randomAnswer)
    }, 2000 + Math.random() * 2000)
  }

  // 处理登出
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      Alert.alert("Logged Out", "You have been successfully logged out.")
    } catch (error) {
      console.error('Logout error:', error)
      Alert.alert("Logout Error", "Failed to logout. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  // 处理头像上传
  const handleProfilePictureUpload = async () => {
    try {
      // 请求权限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos to upload a profile picture.")
        return
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
      Alert.alert("Error", "Failed to select image. Please try again.")
    }
  }

  // 上传头像到服务器
  const uploadProfilePicture = async (imageUri: string) => {
    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      
      // 添加图片文件
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any)

      const response = await axios.post(`${serverUrl}/api/profile/addProfilePicture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      })

      console.log('Profile picture uploaded successfully:', response.data)
      Alert.alert(
        "Success!",
        "Profile picture uploaded successfully!",
        [{ text: "OK" }]
      )
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      const errorMessage = error.response?.data?.message || "Failed to upload profile picture. Please try again."
      Alert.alert("Upload Error", errorMessage)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // 渲染开始页面 - 专注语音交互
  const renderStartPage = () => (
    <View style={$startContainer}>
      <View style={$startContent}>
        <Text style={$startTitle}>
          Ready for today's health check-in?
        </Text>
        
        <Text style={$startSubtitle}>
          {getTodayDate()}
        </Text>
        
        <Text style={$startDescription}>
          I'll ask you {totalQuestions} simple questions about how you're feeling. Just speak your answers naturally.
        </Text>

        <Text style={$dayCounter}>
          Day {checkinDay} • Check-in
        </Text>

        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel="Start health check-in"
          onPress={startHealthCheck}
          style={$startButton}
        >
          <Text style={$startButtonText}>Let's Go! 🚀</Text>
        </Pressable>

        <Text style={$startNote}>
          {/* TODO: 实现全程录音功能 */}
          Voice recording will start automatically.{"\n"}
          No buttons to press - just speak your answers!
        </Text>

        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel="Upload profile picture"
          onPress={handleProfilePictureUpload}
          disabled={isUploadingPhoto}
          style={$profilePictureButton}
        >
          <Text style={$profilePictureButtonText}>
            {isUploadingPhoto ? "Uploading..." : "📷 Upload Profile Picture"}
          </Text>
        </Pressable>

        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel="Logout"
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={$logoutButton}
        >
          <Text style={$logoutButtonText}>
            {isLoggingOut ? "Logging out..." : "🚪 Logout"}
          </Text>
        </Pressable>
      </View>
    </View>
  )

  // 渲染摘要页面 - 简化语音答案显示
  const renderSummary = () => (
    <View style={$summaryContainer}>
      <Text style={$summaryTitle}>
        Health Check-in Complete!
      </Text>
      <Text style={$summarySubtitle}>
        {getTodayDate()}
      </Text>

      <View style={$summaryContent}>
        {answers.map((answer, index) => {
          const question = healthQuestions.find(q => q.id === answer.questionId)
          return (
            <View key={answer.questionId} style={$summaryItem}>
              <Text style={$summaryQuestion}>
                {index + 1}. {question?.questionEN}
              </Text>
              <Text style={$summaryAnswer}>
                🎙️ Voice answer recorded
              </Text>
            </View>
          )
        })}
      </View>

      <View style={$summaryActions}>
        <Pressable
          style={[$summaryButton, { backgroundColor: colors.palette.primary500 }]}
          onPress={() => {
            Alert.alert("Sent!", "Health check-in results sent to caregiver")
            navigation.goBack()
          }}
        >
          <Text style={$summaryButtonText}>📤 Send to Caregiver</Text>
        </Pressable>

        <Pressable
          style={[$summaryButton, { backgroundColor: colors.palette.neutral400 }]}
          onPress={() => {
            setIsShowingSummary(false)
            setHasStarted(false)
            setCurrentQuestionIndex(0)
            setAnswers([])
          }}
        >
          <Text style={$summaryButtonText}>↻ Start Over</Text>
        </Pressable>
      </View>
    </View>
  )

  // 渲染问题页面 - 极简版本，专注语音交互
  const renderQuestion = () => (
    <View style={$questionContainer}>
      {/* 头部信息 - 简化 */}
      <View style={$header}>
        <View style={$progressContainer}>
          <Text style={$progressText}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
          <View style={$progressBar}>
            <View 
              style={[
                $progressFill, 
                { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* 主问题 - 只显示英文大字 */}
      <View style={$questionSection}>
        <Text style={$questionMainText}>
          {currentQuestion.questionEN}
        </Text>
      </View>

      {/* 语音提示 - 鼓励用户说话，更大更清晰，移除麦克风图标 */}
      <View style={$voiceInstructionContainer}>
        <Text style={$voiceInstructionText}>
          Please speak your answer
        </Text>
        <Text style={$voiceInstructionSubtext}>
          For example: "Great", "Good", "Okay",{"\n"}"Not good", or "Bad"
        </Text>
      </View>

      {/* 录音状态提示 - 移到中间位置，避免遮挡 */}
      <View style={$recordingHint}>
        <Text style={$recordingHintIcon}>🎙️</Text>
        <Text style={$recordingHintText}>
          Voice recording in progress...
        </Text>
        <Text style={$recordingHintSubtext}>
          Listening for your answer
        </Text>
      </View>

      {/* 底部导航 - 只保留跳过按钮 */}
      <View style={$bottomNavigation}>
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel="Skip this question"
          onPress={handleSkip}
          style={$skipButton}
        >
          <Text style={$skipButtonText}>
            Skip ⏭️
          </Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <Screen
      preset="auto"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($container)}
    >
      {!hasStarted ? renderStartPage() : isShowingSummary ? renderSummary() : renderQuestion()}
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  backgroundColor: "#FAFBFC",
})

const $questionContainer: ViewStyle = {
  flex: 1,
}

const $header: ViewStyle = {
  marginBottom: 24,
}

const $dateContainer: ViewStyle = {
  alignItems: "center",
  marginBottom: 16,
}

const $dateText: TextStyle = {
  fontSize: 20,
  fontWeight: "600",
  color: "#1F2937",
  textAlign: "center",
}

const $dayCounter: TextStyle = {
  fontSize: 16,
  color: "#6B7280",
  marginTop: 4,
  textAlign: "center",
}

const $progressContainer: ViewStyle = {
  alignItems: "center",
}

const $progressText: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: "#374151",
}

const $progressSubtext: TextStyle = {
  fontSize: 14,
  color: "#6B7280",
  marginTop: 2,
}

const $progressBar: ViewStyle = {
  width: "100%",
  height: 8,
  backgroundColor: "#E5E7EB",
  borderRadius: 4,
  marginTop: 8,
}

const $progressFill: ViewStyle = {
  height: "100%",
  backgroundColor: "#10B981",
  borderRadius: 4,
}

const $questionSection: ViewStyle = {
  alignItems: "center",
  marginBottom: 32,
  paddingHorizontal: 16,
}

const $questionMainText: TextStyle = {
  fontSize: 36, // 大字体，只显示英文
  fontWeight: "bold",
  color: "#111827",
  textAlign: "center",
  lineHeight: 44,
  marginBottom: 16,
}

const $optionsContainer: ViewStyle = {
  gap: 16,
  marginBottom: 24,
}

const $optionButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  padding: 20, // ≥64dp触控区域
  borderRadius: 16,
  borderWidth: 2,
  borderColor: "#E5E7EB",
  minHeight: 80, // 确保≥64dp
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $optionButtonSelected: ViewStyle = {
  borderColor: "#10B981",
  borderWidth: 3,
  shadowOpacity: 0.15,
}

const $optionIcon: TextStyle = {
  fontSize: 32,
  marginRight: 16,
}

const $optionText: TextStyle = {
  fontSize: 24, // 大字体，只显示英文
  fontWeight: "600",
  color: "#111827",
  lineHeight: 30,
  flex: 1,
}

const $optionTextSelected: TextStyle = {
  color: "#059669",
}

// 新增的开始页面样式
const $startContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
}

const $startContent: ViewStyle = {
  alignItems: "center",
  maxWidth: 400,
}

const $startTitle: TextStyle = {
  fontSize: 42,
  fontWeight: "bold",
  color: "#111827",
  textAlign: "center",
  lineHeight: 50,
  marginBottom: 16,
}

const $startSubtitle: TextStyle = {
  fontSize: 20,
  color: "#6B7280",
  textAlign: "center",
  marginBottom: 24,
}

const $startDescription: TextStyle = {
  fontSize: 18,
  color: "#374151",
  textAlign: "center",
  lineHeight: 26,
  marginBottom: 32,
}

const $startButton: ViewStyle = {
  backgroundColor: "#10B981",
  paddingVertical: 20,
  paddingHorizontal: 40,
  borderRadius: 16,
  marginBottom: 20,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 8,
}

const $startButtonText: TextStyle = {
  fontSize: 24,
  fontWeight: "bold",
  color: "#FFFFFF",
  textAlign: "center",
}

const $startNote: TextStyle = {
  fontSize: 14,
  color: "#6B7280",
  textAlign: "center",
  fontStyle: "italic",
}

const $logoutButton: ViewStyle = {
  backgroundColor: "#EF4444",
  paddingVertical: 16,
  paddingHorizontal: 32,
  borderRadius: 12,
  marginTop: 24,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 4,
}

const $logoutButtonText: TextStyle = {
  fontSize: 18,
  fontWeight: "bold",
  color: "#FFFFFF",
  textAlign: "center",
}

const $profilePictureButton: ViewStyle = {
  backgroundColor: "#3B82F6",
  paddingVertical: 16,
  paddingHorizontal: 32,
  borderRadius: 12,
  marginTop: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 4,
}

const $profilePictureButtonText: TextStyle = {
  fontSize: 18,
  fontWeight: "bold",
  color: "#FFFFFF",
  textAlign: "center",
}

// 语音指导样式 - 更大更清晰的适老化设计，移除麦克风图标
const $voiceInstructionContainer: ViewStyle = {
  alignItems: "center",
  marginBottom: 40,
  backgroundColor: "#F0F9FF",
  padding: 32, // 增加内边距
  borderRadius: 20, // 更大的圆角
  borderWidth: 3, // 更粗的边框
  borderColor: "#0EA5E9",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
  minHeight: 140, // 减少最小高度，因为没有麦克风图标了
}

const $voiceInstructionIcon: TextStyle = {
  fontSize: 48, // 更大的麦克风图标
  marginBottom: 16,
}

const $voiceInstructionText: TextStyle = {
  fontSize: 28, // 更大的字体
  fontWeight: "bold",
  color: "#0369A1",
  textAlign: "center",
  marginBottom: 12,
  lineHeight: 36,
}

const $voiceInstructionSubtext: TextStyle = {
  fontSize: 20, // 增大示例文字
  color: "#0284C7",
  textAlign: "center",
  lineHeight: 28,
  fontWeight: "500", // 稍微加粗
}

// 简化的底部导航样式 - 更适老化
const $skipButton: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 20, // 增加垂直内边距
  paddingHorizontal: 40, // 增加水平内边距
  borderRadius: 20, // 更大的圆角
  backgroundColor: "#F3F4F6",
  borderWidth: 3, // 更粗的边框
  borderColor: "#D1D5DB",
  minHeight: 80, // 增加最小高度
  minWidth: 160, // 增加最小宽度
  alignSelf: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 6,
}

const $skipButtonText: TextStyle = {
  fontSize: 22, // 增大字体
  fontWeight: "bold", // 加粗
  color: "#374151",
  textAlign: "center",
  lineHeight: 28,
}

// 录音提示样式 - 修复麦克风被遮挡问题
const $recordingHint: ViewStyle = {
  alignItems: "center",
  marginTop: 30, // 增加顶部间距
  marginBottom: 40, // 增加底部间距
  backgroundColor: "#FEF3C7",
  padding: 24, // 增加内边距
  borderRadius: 16,
  borderWidth: 3, // 更粗的边框
  borderColor: "#FCD34D",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 6,
  minHeight: 120, // 保证足够高度
}

const $recordingHintIcon: TextStyle = {
  fontSize: 36,
  // 让行高 >= 图标的真实高度
  lineHeight: 44,
  marginBottom: 12,
}
const $recordingHintText: TextStyle = {
  fontSize: 18, // 增大字体
  fontWeight: "bold", // 加粗
  color: "#92400E",
  textAlign: "center",
  marginBottom: 8, // 增加底部间距
  lineHeight: 24,
}

const $recordingHintSubtext: TextStyle = {
  fontSize: 16, // 增大字体
  color: "#A16207",
  textAlign: "center",
  fontWeight: "500", // 稍微加粗
  lineHeight: 22,
}

const $bottomNavigation: ViewStyle = {
  alignItems: "center",
  paddingVertical: 20, // 增加内边距
  marginTop: 10, // 确保与上方元素有足够间距
}

// 摘要页面样式
const $summaryContainer: ViewStyle = {
  flex: 1,
  alignItems: "center",
  paddingTop: 32,
}

const $summaryTitle: TextStyle = {
  fontSize: 32,
  fontWeight: "bold",
  color: "#059669",
  textAlign: "center",
  marginBottom: 8,
}

const $summarySubtitle: TextStyle = {
  fontSize: 18,
  color: "#6B7280",
  textAlign: "center",
  marginBottom: 32,
}

const $summaryContent: ViewStyle = {
  width: "100%",
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
  marginBottom: 32,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
}

const $summaryItem: ViewStyle = {
  marginBottom: 20,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#F3F4F6",
}

const $summaryQuestion: TextStyle = {
  fontSize: 16,
  fontWeight: "500",
  color: "#374151",
  marginBottom: 8,
}

const $summaryAnswer: TextStyle = {
  fontSize: 20,
  fontWeight: "600",
  color: "#059669",
}

const $summaryActions: ViewStyle = {
  width: "100%",
  gap: 16,
}

const $summaryButton: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 18,
  paddingHorizontal: 24,
  borderRadius: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 4,
}

const $summaryButtonText: TextStyle = {
  fontSize: 18,
  fontWeight: "bold",
  color: "#FFFFFF",
}
