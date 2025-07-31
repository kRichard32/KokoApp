// app/screens/MessageScreen.tsx
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
  ScrollView,
  Animated,
} from "react-native"
import axios from "axios"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

// 数据类型定义
interface People {
  id: string
  name: string
  specialty: string
  avatar: any // 改为 any 类型以支持 require() 导入
  isOnline: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface Conversation {
  id: string
  title: string
  users: string[]
  lastMessage: string
  lastMessageTime: string
  unreadCount?: number
}

interface MessageScreenProps extends AppStackScreenProps<"Message"> {}

export const MessageScreen: FC<MessageScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [recentPeople, setRecentPeople] = useState<People[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  
  // 滚动动画值
  const scrollY = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current // 顶部导航栏中的标题透明度
  const largeTitleOpacity = useRef(new Animated.Value(1)).current // 大标题的透明度
  const titleHeight = useRef(new Animated.Value(70)).current // 大标题容器高度
  const lastScrollY = useRef(0) // 记录上次滚动位置
  const isHeaderCollapsed = useRef(false) // 记录header状态

  // 模拟数据加载 - 这里将来替换为API调用
  useEffect(() => {
    // loadMockData() // Removed mock data loading
    setupScrollAnimations()
    fetchConversations()
  }, [])

  // 获取用户对话列表
  const fetchConversations = async () => {
  try {
    const response = await axios.get(`${serverUrl}/api/messages/getUserConversations`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Conversations data:', response.data)
    
    if (response.data && Array.isArray(response.data)) {
      // 将API响应转换为我们的对话格式
      const formattedConversations: Conversation[] = response.data.map((conv: any) => {
        // Helper function to safely get user name
        const getUserName = (user: any): string => {
          if (typeof user === 'string') return user;
          if (user && typeof user.name === 'string') return user.name;
          return 'Unknown User';
        }
        
        // Generate title safely
        let title = 'Unknown Conversation';
        if (conv.users && Array.isArray(conv.users) && conv.users.length > 0) {
          if (conv.users.length === 1) {
            title = getUserName(conv.users[0]);
          } else {
            title = conv.users.map(getUserName).join(', ');
          }
        }
        
        return {
          id: conv.id,
          title: title || 'Unknown Conversation',
          users: conv.users || [],
          lastMessage: conv.lastMessage || 'No messages yet',
          lastMessageTime: conv.timestamp || 'Just now',
          unreadCount: conv.unreadCount || 0,
        };
      })
      
      setConversations(formattedConversations)

      // 使用前3个对话创建"最近"人员列表
      const recentFromConversations: People[] = formattedConversations.slice(0, 3).map((conv, index) => ({
        id: conv.id,
        name: conv.title,
        specialty: `${conv.users.length} participants`,
        avatar: require("../../assets/images/avatar-placeholder.jpg"), // 使用默认头像
        isOnline: true, // 假设都在线
      }))
      
      setRecentPeople(recentFromConversations)
    } else {
      // 如果没有对话，设置空数组
      console.log('No conversations found')
      setConversations([])
      setRecentPeople([])
    }
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    
    // Set empty state when API fails
    setConversations([])
    setRecentPeople([])
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      } else if (error.request) {
        console.error('No response received:', error.request)
      } else {
        console.error('Error setting up request:', error.message)
      }
    } else {
      console.error('Unexpected error:', error)
    }
  }
}

  // 设置滚动动画
  const setupScrollAnimations = () => {
    // 不需要预设动画，将在滚动事件中实时计算
  }

  // 处理滚动事件
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y
        const scrollDirection = offsetY > lastScrollY.current ? 'down' : 'up'
        
        // 基础阈值：必须滚动超过20px才开始判断方向
        const minScrollThreshold = 20
        
        if (offsetY < minScrollThreshold) {
          // 滚动到顶部附近，显示大标题
          if (isHeaderCollapsed.current) {
            isHeaderCollapsed.current = false
            // 平滑动画到展开状态
            Animated.timing(titleOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start()
            Animated.timing(largeTitleOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }).start()
            Animated.timing(titleHeight, {
              toValue: 70,
              duration: 200,
              useNativeDriver: false,
            }).start()
          }
        } else {
          // 根据滚动方向决定标题状态
          if (scrollDirection === 'down' && !isHeaderCollapsed.current) {
            // 向下滚动且当前是展开状态 -> 收起
            isHeaderCollapsed.current = true
            Animated.timing(titleOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }).start()
            Animated.timing(largeTitleOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start()
            Animated.timing(titleHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start()
          } else if (scrollDirection === 'up' && isHeaderCollapsed.current && offsetY < 100) {
            // 向上滚动且当前是收起状态，并且滚动位置不太远 -> 展开
            isHeaderCollapsed.current = false
            Animated.timing(titleOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start()
            Animated.timing(largeTitleOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }).start()
            Animated.timing(titleHeight, {
              toValue: 70,
              duration: 200,
              useNativeDriver: false,
            }).start()
          }
        }
        
        // 更新上次滚动位置
        lastScrollY.current = offsetY
      }
    }
  )

  // 预留的API接口函数
  // loadMockData function removed - using only real API data now

  // API接口函数 - 预留给后端集成
  const searchDoctors = async (query: string) => {
    // TODO: 实现搜索API调用
    // const results = await api.searchDoctors(query)
    // return results
  }

  const openChat = (conversationId: string, conversationName: string) => {
    // 导航到聊天详情页面
    navigation.navigate("ChatDetail", { conversationId })
    console.log(`Opening chat with ${conversationName}`)
  }

  const renderPersonItem: ListRenderItem<People> = ({ item }) => (
    <Pressable
      style={$personItem}
      onPress={() => openChat(item.id, item.name)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${item.name}, ${item.specialty}`}
    >
      <View style={$personImageContainer}>
        <Image
          source={
            item.avatar && typeof item.avatar === 'string'
              ? { uri: item.avatar }
              : require("../../assets/images/avatar-placeholder.jpg")
          }
          style={$personImage}
          defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
        />
        {item.isOnline && <View style={$onlineIndicator} />}
      </View>
      <View style={$personInfo}>
        <Text style={$personName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  )

  const renderConversationItem: ListRenderItem<Conversation> = ({ item }) => (
    <Pressable
      style={$contactItem}
      onPress={() => openChat(item.id, item.title)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${item.title}`}
    >
      <View style={$contactImageContainer}>
        <Image
          source={require("../../assets/images/avatar-placeholder.jpg")}
          style={$contactImage}
        />
      </View>
      <View style={$contactInfo}>
        <View style={$contactHeader}>
          <Text style={$conversationName} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={$messageTime}>
            {item.lastMessageTime}
          </Text>
        </View>
        <Text style={$contactSpecialty} numberOfLines={1}>
          {item.users.length} participants
        </Text>
        <Text style={$lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unreadCount && item.unreadCount > 0 && (
        <View style={$unreadBadge}>
          <Text style={$unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  )

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($container)}
    >
      {/* Fixed Header with Navigation */}
      <View style={$headerNav}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={$backButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={$backIcon}>←</Text>
        </Pressable>
        
        {/* 顶部导航栏中的小标题 - 初始隐藏 */}
        <Animated.View style={{ opacity: titleOpacity }}>
          <Text style={$navTitle}>Message</Text>
        </Animated.View>
        
        <Pressable
          style={$menuButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Menu"
        >
          <Text style={$menuIcon}>☰</Text>
        </Pressable>
      </View>

      {/* Large Title Container - 动态高度 */}
      <Animated.View style={[
        $titleContainer,
        { 
          height: titleHeight,
          opacity: largeTitleOpacity,
        }
      ]}>
        <Text preset="heading" style={$headerTitle}>
          Message
        </Text>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        style={$scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Recent People Section - Only show if there are recent people */}
        {recentPeople.length > 0 && (
          <View style={$section}>
            <View style={$sectionHeader}>
              <Text preset="subheading" style={$sectionTitle}>
                Recent
              </Text>
              <Pressable accessible accessibilityRole="button" accessibilityLabel="See more recent people">
                <Text style={$seeMore}>See more</Text>
              </Pressable>
            </View>
            <FlatList
              data={recentPeople}
              renderItem={renderPersonItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={$peopleContainer}
            />
          </View>
        )}

        {/* Conversations List */}
        <View style={$section}>
          <Text preset="subheading" style={$sectionTitle}>
            Conversations
          </Text>
          {conversations.length === 0 ? (
            // Empty state when no conversations
            <View style={$emptyStateContainer}>
              <Text style={$emptyStateIcon}>💬</Text>
              <Text style={$emptyStateTitle}>No Conversations Yet</Text>
              <Text style={$emptyStateDescription}>
                You haven't started any conversations. Find people to chat with!
              </Text>
              <Pressable
                style={$findPeopleButton}
                onPress={() => navigation.navigate("People")}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Go to match screen to find people"
              >
                <Text style={$findPeopleButtonText}>Find People to Chat</Text>
              </Pressable>
            </View>
          ) : (
            // Show conversations when they exist
            conversations.map((item) => (
              <Pressable
                key={item.id}
                style={$contactItem}
                onPress={() => openChat(item.id, item.title)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Open conversation with ${item.title}`}
              >
                <View style={$contactImageContainer}>
                  <Image
                    source={require("../../assets/images/avatar-placeholder.jpg")}
                    style={$contactImage}
                  />
                </View>
                <View style={$contactInfo}>
                  <View style={$contactHeader}>
                    <Text style={$conversationName} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={$messageTime}>
                      {item.lastMessageTime}
                    </Text>
                  </View>
                  <Text style={$contactSpecialty} numberOfLines={1}>
                    {item.users.length} participants
                  </Text>
                  <Text style={$lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
                {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                  <View style={$unreadBadge}>
                    <Text style={$unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  backgroundColor: "#FFFFFF",
})

const $scrollContainer: ViewStyle = {
  flex: 1,
}

const $headerNav: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#FFFFFF",
  zIndex: 10,
}

const $navTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: "#000",
}

const $titleContainer: ViewStyle = {
  paddingHorizontal: 16,
  justifyContent: "center", // 垂直居中文字
  backgroundColor: "#FFFFFF",
}

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 20, // 增加垂直padding为更大的标题留空间
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
  backgroundColor: "#FFFFFF",
  zIndex: 10, // 确保header在最上层
}

const $backButton: ViewStyle = {
  padding: 8,
  borderRadius: 20,
}

const $backIcon: TextStyle = {
  fontSize: 24,
  color: "#666",
}

const $headerTitle: TextStyle = {
  fontSize: 34, // 稍微调小一点，更合适
  fontWeight: "700",
  color: "#000",
}

const $menuButton: ViewStyle = {
  padding: 8,
  borderRadius: 20,
}

const $menuIcon: TextStyle = {
  fontSize: 20,
  color: "#666",
}

const $section: ViewStyle = {
  paddingHorizontal: 16,
  marginBottom: 24, // 增加section间距
}

const $sectionHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20, // 增加margin为更大的元素留空间
}

const $sectionTitle: TextStyle = {
  fontSize: 24, // 更大的section标题
  fontWeight: "700",
  color: "#000",
}

const $seeMore: TextStyle = {
  fontSize: 14,
  color: "#FF9500",
  fontWeight: "500",
}

const $peopleContainer: ViewStyle = {
  paddingRight: 16,
}

const $personItem: ViewStyle = {
  alignItems: "center",
  marginRight: 24, // 增加间距
  width: 100, // 增加宽度适应更大的头像
}

const $personImageContainer: ViewStyle = {
  position: "relative",
  marginBottom: 8,
}

const $personImage: ImageStyle = {
  width: 80, // 增大头像尺寸
  height: 80,
  borderRadius: 40,
  backgroundColor: "#F0F0F0",
}

const $onlineIndicator: ViewStyle = {
  position: "absolute",
  bottom: 2,
  right: 2,
  width: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: "#34C759",
  borderWidth: 2,
  borderColor: "#FFFFFF",
}

const $personInfo: ViewStyle = {
  alignItems: "center",
}

const $personName: TextStyle = {
  fontSize: 16, // 增大人员姓名字体
  fontWeight: "600",
  color: "#000",
  textAlign: "center",
}

const $contactsContainer: ViewStyle = {
  paddingBottom: 20,
}

const $contactItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
}

const $contactImageContainer: ViewStyle = {
  marginRight: 12,
}

const $contactImage: ImageStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "#F0F0F0",
}

const $contactInfo: ViewStyle = {
  flex: 1,
}

const $contactHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
}

const $conversationName: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#000",
  flex: 1,
}

const $messageTime: TextStyle = {
  fontSize: 12,
  color: "#999",
  marginLeft: 8,
}

const $contactSpecialty: TextStyle = {
  fontSize: 14,
  color: "#666",
  marginBottom: 2,
}

const $lastMessage: TextStyle = {
  fontSize: 14,
  color: "#999",
}

const $unreadBadge: ViewStyle = {
  backgroundColor: "#FF3B30",
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 6,
  marginLeft: 8,
}

const $unreadText: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
  color: "#FFFFFF",
}

// Empty state styles
const $emptyStateContainer: ViewStyle = {
  alignItems: "center",
  paddingVertical: 60,
  paddingHorizontal: 20,
}

const $emptyStateIcon: TextStyle = {
  fontSize: 64,
  marginBottom: 20,
}

const $emptyStateTitle: TextStyle = {
  fontSize: 24,
  fontWeight: "700",
  color: "#000",
  marginBottom: 12,
  textAlign: "center",
}

const $emptyStateDescription: TextStyle = {
  fontSize: 16,
  color: "#666",
  textAlign: "center",
  lineHeight: 22,
  marginBottom: 32,
}

const $findPeopleButton: ViewStyle = {
  backgroundColor: "#007AFF",
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 25,
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
}

const $findPeopleButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#FFFFFF",
  textAlign: "center",
}
