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
  text: string
  timestamp: Date
  isFromUser: boolean
  isRead?: boolean
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
  const flatListRef = useRef<FlatList>(null)

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

    // 模拟聊天记录
    const mockMessages: ChatMessage[] = [
      {
        id: "1",
        text: "Hello! How can I help you today?",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isFromUser: false,
        isRead: true,
      },
      {
        id: "2",
        text: "Hi Dr. Sam, I've been feeling some chest discomfort lately.",
        timestamp: new Date(Date.now() - 3500000),
        isFromUser: true,
        isRead: true,
      },
      {
        id: "3",
        text: "I understand your concern. Can you describe the discomfort in more detail? When did it start?",
        timestamp: new Date(Date.now() - 3400000),
        isFromUser: false,
        isRead: true,
      },
      {
        id: "4",
        text: "It started about 3 days ago. It's a mild pressure feeling, especially when I walk upstairs.",
        timestamp: new Date(Date.now() - 3300000),
        isFromUser: true,
        isRead: true,
      },
      {
        id: "5",
        text: "Thank you for the details. Based on your symptoms, I'd recommend scheduling an in-person appointment for a proper examination. In the meantime, please avoid strenuous activities.",
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        isFromUser: false,
        isRead: false,
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
      }
      setMessages(prev => [...prev, doctorReply])
    }, 2000)

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
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
        <Text style={[
          $messageText,
          item.isFromUser ? $userMessageText : $doctorMessageText
        ]}>
          {item.text}
        </Text>
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
          style={$searchButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Search in conversation"
        >
          <Text style={$searchIcon}>🔍</Text>
        </Pressable>

        <Pressable
          style={$menuButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <Text style={$menuIcon}>☰</Text>
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

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={$inputArea}
      >
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
            style={[
              $sendButton,
              inputText.trim() ? $sendButtonActive : $sendButtonInactive
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={[
              $sendButtonText,
              inputText.trim() ? $sendButtonTextActive : $sendButtonTextInactive
            ]}>
              Send
            </Text>
          </Pressable>
        </View>
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

const $searchButton: ViewStyle = {
  padding: 8,
  marginLeft: 8,
}

const $searchIcon: TextStyle = {
  fontSize: 18,
  color: "#666",
}

const $menuButton: ViewStyle = {
  padding: 8,
  marginLeft: 8,
}

const $menuIcon: TextStyle = {
  fontSize: 18,
  color: "#666",
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
}

const $inputContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 12,
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
}

const $sendButton: ViewStyle = {
  borderRadius: 20,
  paddingHorizontal: 20,
  paddingVertical: 12,
  justifyContent: "center",
  alignItems: "center",
}

const $sendButtonActive: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $sendButtonInactive: ViewStyle = {
  backgroundColor: "#E0E0E0",
}

const $sendButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
}

const $sendButtonTextActive: TextStyle = {
  color: "#FFFFFF",
}

const $sendButtonTextInactive: TextStyle = {
  color: "#999999",
}
