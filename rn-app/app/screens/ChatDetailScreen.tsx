// app/screens/ChatDetailScreen.tsx
import { FC, useState, useEffect, useRef } from "react"
import {
  View,
  Pressable,
  TextInput,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
  FlatList,
  ListRenderItem,
  KeyboardAvoidingView,
  Platform,
} from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// 消息数据类型
interface ChatMessage {
  id: string
  text?: string
  audioUrl?: string
  audioDuration?: number // 语音时长（秒）
  timestamp: Date
  isFromUser: boolean
  isRead?: boolean
  messageType: 'text' | 'voice'
  transcription?: string // 语音转文字结果
}

interface Contact {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  specialty?: string
}

interface ChatDetailScreenProps extends AppStackScreenProps<"ChatDetail"> {}

export const ChatDetailScreen: FC<ChatDetailScreenProps> = ({ navigation, route }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  // 从路由参数获取联系人信息
  const { contactId, contactName } = route.params

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [contact, setContact] = useState<Contact | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [showTranscription, setShowTranscription] = useState<{[key: string]: boolean}>({})
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice') // 输入模式切换
  const flatListRef = useRef<FlatList>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 模拟数据加载
  useEffect(() => {
    loadChatData()
  }, [contactId])

  // 预留的API接口函数
  const loadChatData = async () => {
    // TODO: 替换为真实的API调用
    // const chatResponse = await api.getChatMessages(contactId)
    // const contactResponse = await api.getContactInfo(contactId)
    
    // 模拟联系人数据
    const mockContact: Contact = {
      id: contactId,
      name: contactName,
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
      isOnline: true,
      specialty: "Cardiologist",
    }

    // 模拟聊天记录 - 混合语音和文字消息
    const mockMessages: ChatMessage[] = [
      {
        id: "1",
        text: "Hello! How can I help you today?",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isFromUser: false,
        isRead: true,
        messageType: 'text',
      },
      {
        id: "2",
        audioUrl: "mock://voice-message-1.mp3",
        audioDuration: 8,
        transcription: "Hi Dr. Sam, I've been feeling some chest discomfort lately.",
        timestamp: new Date(Date.now() - 3500000),
        isFromUser: true,
        isRead: true,
        messageType: 'voice',
      },
      {
        id: "3",
        audioUrl: "mock://voice-message-2.mp3",
        audioDuration: 15,
        transcription: "I understand your concern. Can you describe the discomfort in more detail? When did it start?",
        timestamp: new Date(Date.now() - 3400000),
        isFromUser: false,
        isRead: true,
        messageType: 'voice',
      },
      {
        id: "4",
        audioUrl: "mock://voice-message-3.mp3",
        audioDuration: 12,
        transcription: "It started about 3 days ago. It's a mild pressure feeling, especially when I walk upstairs.",
        timestamp: new Date(Date.now() - 3300000),
        isFromUser: true,
        isRead: true,
        messageType: 'voice',
      },
      {
        id: "5",
        audioUrl: "mock://voice-message-4.mp3",
        audioDuration: 25,
        transcription: "Thank you for the details. Based on your symptoms, I'd recommend scheduling an in-person appointment for a proper examination. In the meantime, please avoid strenuous activities.",
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        isFromUser: false,
        isRead: false,
        messageType: 'voice',
      },
    ]

    setContact(mockContact)
    setMessages(mockMessages)
  }

  // API接口函数 - 预留给后端集成
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      timestamp: new Date(),
      isFromUser: true,
      isRead: false,
      messageType: 'text',
    }

    // 添加用户消息
    setMessages(prev => [...prev, newMessage])
    setInputText("")

    // TODO: 发送到后端API
    // await api.sendMessage(contactId, messageText)

    // 模拟医生回复 (实际情况下这会通过WebSocket或推送通知接收)
    setTimeout(() => {
      const doctorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message. I'll review this and get back to you shortly.",
        timestamp: new Date(),
        isFromUser: false,
        isRead: false,
        messageType: 'text',
      }
      setMessages(prev => [...prev, doctorReply])
    }, 2000)

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  // 语音录制功能
  const startRecording = () => {
    setIsRecording(true)
    setRecordingDuration(0)
    
    // 开始计时
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)

    // TODO: 实际录音逻辑
    // await AudioRecorder.startRecording()
  }

  const stopRecording = async () => {
    setIsRecording(false)
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    // TODO: 停止录音并获取文件
    // const audioFile = await AudioRecorder.stopRecording()
    // const transcription = await api.transcribeAudio(audioFile)

    // 模拟语音消息
    const mockAudioUrl = `mock://voice-${Date.now()}.mp3`
    const mockTranscription = "This is a mock transcription of the voice message."

    const voiceMessage: ChatMessage = {
      id: Date.now().toString(),
      audioUrl: mockAudioUrl,
      audioDuration: recordingDuration,
      transcription: mockTranscription,
      timestamp: new Date(),
      isFromUser: true,
      isRead: false,
      messageType: 'voice',
    }

    setMessages(prev => [...prev, voiceMessage])
    setRecordingDuration(0)

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  // 播放语音
  const toggleVoicePlayback = (messageId: string) => {
    if (playingMessageId === messageId) {
      // 停止播放
      setPlayingMessageId(null)
      // TODO: 停止音频播放
      // AudioPlayer.stop()
    } else {
      // 开始播放
      setPlayingMessageId(messageId)
      // TODO: 播放音频
      // AudioPlayer.play(audioUrl)
      
      // 模拟播放完成
      setTimeout(() => {
        setPlayingMessageId(null)
      }, 3000)
    }
  }

  // 视频/语音通话功能
  const startVideoCall = () => {
    // 导航到视频通话界面
    navigation.navigate('VideoCall', { contactId, contactName })
  }

  const startVoiceCall = () => {
    // TODO: 启动语音通话功能
    console.log('Starting voice call with', contact?.name)
    // 可以导航到语音通话界面或直接在此界面启动语音通话
  }

  // 切换转文字显示
  const toggleTranscription = (messageId: string) => {
    setShowTranscription(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  // 格式化录音时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const renderMessage: ListRenderItem<ChatMessage> = ({ item }) => (
    <View style={[
      $messageContainer,
      item.isFromUser ? $userMessageContainer : $doctorMessageContainer
    ]}>
      {!item.isFromUser && (
        <Image
          source={{ uri: contact?.avatar }}
          style={$messageAvatar}
          defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
        />
      )}
      <View style={[
        $messageBubble,
        item.isFromUser ? $userMessageBubble : $doctorMessageBubble
      ]}>
        {item.messageType === 'voice' ? (
          // 语音消息
          <View style={$voiceMessageContainer}>
            <Pressable
              style={$playButton}
              onPress={() => toggleVoicePlayback(item.id)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={playingMessageId === item.id ? "Stop voice message" : "Play voice message"}
            >
              <Text style={[
                $playButtonText,
                item.isFromUser ? $userPlayButtonText : $doctorPlayButtonText
              ]}>
                {playingMessageId === item.id ? "⏸️" : "▶️"}
              </Text>
            </Pressable>
            
            <View style={$voiceInfo}>
              <View style={$waveformContainer}>
                {/* 简单的波形可视化 */}
                {Array.from({ length: 8 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      $waveformBar,
                      item.isFromUser ? $userWaveformBar : $doctorWaveformBar,
                      playingMessageId === item.id && $activeWaveformBar
                    ]}
                  />
                ))}
              </View>
              <Text style={[
                $voiceDuration,
                item.isFromUser ? $userVoiceDuration : $doctorVoiceDuration
              ]}>
                {formatDuration(item.audioDuration || 0)}
              </Text>
            </View>

            {/* 转文字按钮 */}
            <Pressable
              style={$transcriptionButton}
              onPress={() => toggleTranscription(item.id)}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Toggle transcription"
            >
              <Text style={[
                $transcriptionButtonText,
                item.isFromUser ? $userTranscriptionButtonText : $doctorTranscriptionButtonText
              ]}>
                Aa
              </Text>
            </Pressable>
          </View>
        ) : (
          // 文字消息
          <Text style={[
            $messageText,
            item.isFromUser ? $userMessageText : $doctorMessageText
          ]}>
            {item.text}
          </Text>
        )}

        {/* 显示转文字结果 */}
        {item.messageType === 'voice' && showTranscription[item.id] && item.transcription && (
          <View style={$transcriptionContainer}>
            <Text style={[
              $transcriptionText,
              item.isFromUser ? $userTranscriptionText : $doctorTranscriptionText
            ]}>
              "{item.transcription}"
            </Text>
          </View>
        )}

        <Text style={[
          $messageTime,
          item.isFromUser ? $userMessageTime : $doctorMessageTime
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  )

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($container)}
    >
      {/* Header */}
      <View style={$header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={$backButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back to messages"
        >
          <Text style={$backIcon}>←</Text>
        </Pressable>
        
        <View style={$contactHeader}>
          <Image
            source={{ uri: contact?.avatar }}
            style={$headerAvatar}
            defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
          />
          <View style={$contactInfo}>
            <Text style={$contactName}>{contact?.name}</Text>
            {contact?.isOnline && (
              <Text style={$onlineStatus}>● Online</Text>
            )}
          </View>
        </View>

        <Pressable
          style={$videoCallButton}
          onPress={startVideoCall}
          onLongPress={startVoiceCall}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Start video call with ${contact?.name}. Long press for voice call`}
          accessibilityHint="Tap for video call, long press for voice call"
        >
          <Text style={$videoCallIcon}>📹</Text>
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={$messagesList}
        contentContainerStyle={$messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area - 大麦克风设计 */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={$inputArea}
      >
        {inputMode === 'text' ? (
          // 文字输入模式
          <View style={$inputContainer}>
            <TextInput
              style={$textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              accessible
              accessibilityLabel="Message input"
            />
            <Pressable
              style={$sendButton}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Send text message"
            >
              <Text style={$sendButtonText}>Send</Text>
            </Pressable>
          </View>
        ) : (
          // 语音输入模式 - 大麦克风
          <View style={$voiceInputContainer}>
            {isRecording && (
              <View style={$recordingIndicator}>
                <View style={$recordingDot} />
                <Text style={$recordingTime}>{formatDuration(recordingDuration)}</Text>
              </View>
            )}
            
            <Pressable
              style={[
                $largeMicButton,
                isRecording ? $largeMicButtonRecording : $largeMicButtonIdle
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              accessible
              accessibilityRole="button"
              accessibilityLabel={isRecording ? "Recording voice message, release to send" : "Hold to record voice message"}
            >
              <Text style={$largeMicIcon}>
                {isRecording ? "🔴" : "🎤"}
              </Text>
            </Pressable>

            {/* 录音提示 */}
            {isRecording ? (
              <Text style={$recordingHintText}>🔴 Recording... Release to send</Text>
            ) : (
              <Text style={$micHintText}>Hold to record voice message</Text>
            )}
          </View>
        )}

        {/* 模式切换按钮 - 右下角 */}
        <Pressable
          style={$modeToggleButton}
          onPress={() => setInputMode(prev => prev === 'voice' ? 'text' : 'voice')}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${inputMode === 'voice' ? 'text' : 'voice'} input mode`}
        >
          <Text style={$modeToggleIcon}>
            {inputMode === 'voice' ? '💬' : '🎤'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "#FFFFFF",
})

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
  backgroundColor: "#FFFFFF",
}

const $backButton: ViewStyle = {
  padding: 8,
  marginRight: 8,
}

const $backIcon: TextStyle = {
  fontSize: 24,
  color: "#666",
}

const $contactHeader: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
}

const $headerAvatar: ImageStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 12,
  backgroundColor: "#F0F0F0",
}

const $contactInfo: ViewStyle = {
  flex: 1,
}

const $contactName: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#000",
  marginBottom: 2,
}

const $onlineStatus: TextStyle = {
  fontSize: 12,
  color: "#34C759",
  fontWeight: "500",
}

const $videoCallButton: ViewStyle = {
  padding: 12,
  marginLeft: 8,
  backgroundColor: "#34C759",
  borderRadius: 22,
  minWidth: 44,
  minHeight: 44,
  alignItems: "center",
  justifyContent: "center",
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
}

const $videoCallIcon: TextStyle = {
  fontSize: 20,
}

const $messagesList: ViewStyle = {
  flex: 1,
}

const $messagesContainer: ViewStyle = {
  paddingVertical: 16,
  paddingHorizontal: 16,
}

const $messageContainer: ViewStyle = {
  flexDirection: "row",
  marginBottom: 16,
  alignItems: "flex-end",
}

const $userMessageContainer: ViewStyle = {
  justifyContent: "flex-end",
  paddingLeft: 60,
}

const $doctorMessageContainer: ViewStyle = {
  justifyContent: "flex-start",
  paddingRight: 60,
}

const $messageAvatar: ImageStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  marginRight: 8,
  backgroundColor: "#F0F0F0",
}

const $messageBubble: ViewStyle = {
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 12,
  maxWidth: "80%",
}

const $userMessageBubble: ViewStyle = {
  backgroundColor: "#007AFF",
  marginLeft: "auto",
}

const $doctorMessageBubble: ViewStyle = {
  backgroundColor: "#F0F0F0",
}

const $messageText: TextStyle = {
  fontSize: 16,
  lineHeight: 22,
  marginBottom: 4,
}

const $userMessageText: TextStyle = {
  color: "#FFFFFF",
}

const $doctorMessageText: TextStyle = {
  color: "#000000",
}

const $messageTime: TextStyle = {
  fontSize: 12,
  opacity: 0.7,
}

const $userMessageTime: TextStyle = {
  color: "#FFFFFF",
  textAlign: "right",
}

const $doctorMessageTime: TextStyle = {
  color: "#666666",
}

const $inputArea: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderTopWidth: 1,
  borderTopColor: "#F0F0F0",
  position: "relative",
}

const $inputContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 12,
}

// 语音输入容器样式
const $voiceInputContainer: ViewStyle = {
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 32,
  minHeight: 160,
  justifyContent: "center",
}

// 大麦克风按钮样式
const $largeMicButton: ViewStyle = {
  width: 100,
  height: 100,
  borderRadius: 50,
  justifyContent: "center",
  alignItems: "center",
  elevation: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  marginBottom: 20,
  zIndex: 10,
}

const $largeMicButtonIdle: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $largeMicButtonRecording: ViewStyle = {
  backgroundColor: "#FF3B30",
}

const $largeMicIcon: TextStyle = {
  fontSize: 40,
  textAlign: "center",
  lineHeight: 50,
}

const $micHintText: TextStyle = {
  fontSize: 16,
  color: "#666",
  textAlign: "center",
  fontWeight: "500",
}

// 模式切换按钮样式
const $modeToggleButton: ViewStyle = {
  position: "absolute",
  right: 20,
  bottom: 20,
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: "#F0F0F0",
  justifyContent: "center",
  alignItems: "center",
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 5,
  zIndex: 5,
}

const $modeToggleIcon: TextStyle = {
  fontSize: 24,
}

const $textInput: TextStyle = {
  flex: 1,
  borderWidth: 1,
  borderColor: "#E0E0E0",
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  maxHeight: 100,
  color: "#000",
  backgroundColor: "#F8F8F8",
  marginRight: 8,
}

const $voiceButtonContainer: ViewStyle = {
  alignItems: "center",
  position: "relative",
}

const $recordingIndicator: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 24,
  paddingHorizontal: 16,
  paddingVertical: 8,
  backgroundColor: "#FF3B30",
  borderRadius: 20,
  elevation: 3,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
}

const $recordingDot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#FFFFFF",
  marginRight: 6,
}

const $recordingTime: TextStyle = {
  fontSize: 14,
  color: "#FFFFFF",
  fontWeight: "600",
}

const $voiceButton: ViewStyle = {
  width: 60,
  height: 60,
  borderRadius: 30,
  justifyContent: "center",
  alignItems: "center",
  elevation: 3,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
}

const $voiceButtonIdle: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $voiceButtonRecording: ViewStyle = {
  backgroundColor: "#FF3B30",
}

const $voiceButtonText: TextStyle = {
  fontSize: 24,
}

const $sendButton: ViewStyle = {
  borderRadius: 20,
  paddingHorizontal: 20,
  paddingVertical: 12,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#007AFF",
  marginLeft: 8,
}

const $sendButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#FFFFFF",
}

const $recordingHint: ViewStyle = {
  alignItems: "center",
  paddingVertical: 8,
}

const $recordingHintText: TextStyle = {
  fontSize: 14,
  color: "#FF3B30",
  fontWeight: "500",
}

// 语音消息相关样式
const $voiceMessageContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  minWidth: 200,
}

const $playButton: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 8,
}

const $playButtonText: TextStyle = {
  fontSize: 18,
}

const $userPlayButtonText: TextStyle = {
  color: "#FFFFFF",
}

const $doctorPlayButtonText: TextStyle = {
  color: "#007AFF",
}

const $voiceInfo: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $waveformContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
  marginRight: 8,
}

const $waveformBar: ViewStyle = {
  width: 3,
  backgroundColor: "#C0C0C0",
  marginRight: 2,
  borderRadius: 1.5,
}

const $userWaveformBar: ViewStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  height: Math.random() * 20 + 10, // 随机高度模拟波形
}

const $doctorWaveformBar: ViewStyle = {
  backgroundColor: "#C0C0C0",
  height: Math.random() * 20 + 10,
}

const $activeWaveformBar: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $voiceDuration: TextStyle = {
  fontSize: 12,
  fontWeight: "500",
}

const $userVoiceDuration: TextStyle = {
  color: "rgba(255, 255, 255, 0.8)",
}

const $doctorVoiceDuration: TextStyle = {
  color: "#666",
}

const $transcriptionButton: ViewStyle = {
  padding: 4,
  borderRadius: 12,
  marginLeft: 8,
}

const $transcriptionButtonText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
}

const $userTranscriptionButtonText: TextStyle = {
  color: "rgba(255, 255, 255, 0.8)",
}

const $doctorTranscriptionButtonText: TextStyle = {
  color: "#007AFF",
}

const $transcriptionContainer: ViewStyle = {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: "rgba(255, 255, 255, 0.2)",
}

const $transcriptionText: TextStyle = {
  fontSize: 14,
  fontStyle: "italic",
}

const $userTranscriptionText: TextStyle = {
  color: "rgba(255, 255, 255, 0.9)",
}

const $doctorTranscriptionText: TextStyle = {
  color: "#666",
}
