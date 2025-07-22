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

const serverUrl = "http://10.0.2.2:8080"

// 数据类型定义
interface Doctor {
  id: string
  name: string
  specialty: string
  avatar: string
  isOnline: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface RecentContact {
  id: string
  name: string
  specialty: string
  avatar: string
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

  const [recentDoctors, setRecentDoctors] = useState<Doctor[]>([])
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  
  // 滚动动画值
  const scrollY = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current // 顶部导航栏中的标题透明度
  const largeTitleOpacity = useRef(new Animated.Value(1)).current // 大标题的透明度
  const titleHeight = useRef(new Animated.Value(70)).current // 大标题容器高度
  const lastScrollY = useRef(0) // 记录上次滚动位置
  const isHeaderCollapsed = useRef(false) // 记录header状态

  // 模拟数据加载 - 这里将来替换为API调用
  useEffect(() => {
    loadMockData()
    setupScrollAnimations()
    fetchProfile()
  }, [])

  // 获取用户个人资料
  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/profile/getUserProfile`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Profile data:', response.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
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
  const loadMockData = async () => {
    // TODO: 替换为真实的API调用
    // const doctorsResponse = await api.getRecentDoctors()
    // const contactsResponse = await api.getRecentContacts()
    
    // 模拟数据
    const mockDoctors: Doctor[] = [
      {
        id: "1",
        name: "Dr. Sam",
        specialty: "Cardiologist",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
        isOnline: true,
      },
      {
        id: "2", 
        name: "Dr. John",
        specialty: "Neurologist",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face",
        isOnline: true,
      },
      {
        id: "3",
        name: "Dr. Lala",
        specialty: "Dermatologist", 
        avatar: "https://images.unsplash.com/photo-1594824226625-48f5ad6be2cf?w=100&h=100&fit=crop&crop=face",
        isOnline: false,
      },
      {
        id: "4",
        name: "Dr. Emma",
        specialty: "Psychiatrist",
        avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop&crop=face",
        isOnline: true,
      },
      {
        id: "5",
        name: "Dr. Mike",
        specialty: "Orthopedic",
        avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=100&h=100&fit=crop&crop=face",
        isOnline: false,
      },
      {
        id: "6",
        name: "Dr. Lisa",
        specialty: "Pediatrician",
        avatar: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop&crop=face",
        isOnline: true,
      },
    ]

    const mockContacts: RecentContact[] = [
      {
        id: "1",
        name: "Rosalie Adkins",
        specialty: "Aromatherapy While ...",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Hello, how are you feeling today?",
        lastMessageTime: "13:2",
        unreadCount: 2,
      },
      {
        id: "2",
        name: "Marc Lindsey",
        specialty: "Learn About Swimmers ...",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Your test results are ready",
        lastMessageTime: "13:2",
      },
      {
        id: "3",
        name: "Mary Floyd",
        specialty: "Colon Flush For An ...",
        avatar: "https://images.unsplash.com/photo-1594824226625-48f5ad6be2cf?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Please remember to take your medication",
        lastMessageTime: "13:2",
      },
      {
        id: "4",
        name: "Cecilia Chavez",
        specialty: "Gastroenteritis Is A ...",
        avatar: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop&crop=face",
        lastMessage: "How was your appointment yesterday?",
        lastMessageTime: "13:2",
      },
      {
        id: "5",
        name: "Lelia Parks",
        specialty: "How To Combat A Bout ...",
        avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Schedule your next checkup",
        lastMessageTime: "13:2",
      },
      {
        id: "6",
        name: "Brent Rivera",
        specialty: "Therapy And Treatment ...",
        avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Great progress in your recovery!",
        lastMessageTime: "13:2",
        unreadCount: 1,
      },
      {
        id: "7",
        name: "Sarah Johnson",
        specialty: "Physical Therapy Sessions",
        avatar: "https://images.unsplash.com/photo-1594824226625-48f5ad6be2cf?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Don't forget our session tomorrow",
        lastMessageTime: "12:45",
        unreadCount: 3,
      },
      {
        id: "8",
        name: "Dr. Chen Wei",
        specialty: "Traditional Chinese Medicine",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Your herbal prescription is ready",
        lastMessageTime: "11:30",
      },
      {
        id: "9",
        name: "Amanda Ross",
        specialty: "Nutrition Counseling",
        avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Here's your meal plan for next week",
        lastMessageTime: "10:15",
      },
      {
        id: "10",
        name: "Dr. Robert Kim",
        specialty: "Mental Health Support",
        avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=100&h=100&fit=crop&crop=face",
        lastMessage: "How have you been feeling lately?",
        lastMessageTime: "09:20",
        unreadCount: 1,
      },
      {
        id: "11",
        name: "Lisa Thompson",
        specialty: "Diabetes Management",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Your blood sugar levels look good",
        lastMessageTime: "08:45",
      },
      {
        id: "12",
        name: "Dr. Martinez",
        specialty: "Pain Management Clinic",
        avatar: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Let's adjust your pain management plan",
        lastMessageTime: "Yesterday",
      },
      {
        id: "13",
        name: "Emily Davis",
        specialty: "Sleep Disorder Treatment",
        avatar: "https://images.unsplash.com/photo-1594824226625-48f5ad6be2cf?w=100&h=100&fit=crop&crop=face",
        lastMessage: "How was your sleep quality this week?",
        lastMessageTime: "Yesterday",
        unreadCount: 2,
      },
      {
        id: "14",
        name: "Dr. Anderson",
        specialty: "Chronic Disease Management",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Your lab results are in",
        lastMessageTime: "2 days ago",
      },
      {
        id: "15",
        name: "Jessica Wu",
        specialty: "Elderly Care Coordination",
        avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop&crop=face",
        lastMessage: "I've scheduled your home visit",
        lastMessageTime: "3 days ago",
      },
    ]

    setRecentDoctors(mockDoctors)
    setRecentContacts(mockContacts)
  }

  // API接口函数 - 预留给后端集成
  const searchDoctors = async (query: string) => {
    // TODO: 实现搜索API调用
    // const results = await api.searchDoctors(query)
    // return results
  }

  const openChat = (contactId: string, contactName: string) => {
    // 导航到聊天详情页面
    navigation.navigate("ChatDetail", { contactId, contactName })
    console.log(`Opening chat with ${contactName}`)
  }

  const renderDoctorItem: ListRenderItem<Doctor> = ({ item }) => (
    <Pressable
      style={$doctorItem}
      onPress={() => openChat(item.id, item.name)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${item.name}, ${item.specialty}`}
    >
      <View style={$doctorImageContainer}>
        <Image
          source={{ uri: item.avatar }}
          style={$doctorImage}
          defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
        />
        {item.isOnline && <View style={$onlineIndicator} />}
      </View>
      <View style={$doctorInfo}>
        <Text style={$doctorName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  )

  const renderContactItem: ListRenderItem<RecentContact> = ({ item }) => (
    <Pressable
      style={$contactItem}
      onPress={() => openChat(item.id, item.name)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${item.name}`}
    >
      <View style={$contactImageContainer}>
        <Image
          source={{ uri: item.avatar }}
          style={$contactImage}
          defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
        />
      </View>
      <View style={$contactInfo}>
        <View style={$contactHeader}>
          <Text style={$contactName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={$messageTime}>
            {item.lastMessageTime}
          </Text>
        </View>
        <Text style={$contactSpecialty} numberOfLines={1}>
          {item.specialty}
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
        {/* Recent Doctors Section */}
        <View style={$section}>
          <View style={$sectionHeader}>
            <Text preset="subheading" style={$sectionTitle}>
              Recent
            </Text>
            <Pressable accessible accessibilityRole="button" accessibilityLabel="See more recent doctors">
              <Text style={$seeMore}>See more</Text>
            </Pressable>
          </View>
          <FlatList
            data={recentDoctors}
            renderItem={renderDoctorItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={$doctorsContainer}
          />
        </View>

        {/* Contacts List */}
        <View style={$section}>
          <Text preset="subheading" style={$sectionTitle}>
            List
          </Text>
          {recentContacts.map((item) => (
            <Pressable
              key={item.id}
              style={$contactItem}
              onPress={() => openChat(item.id, item.name)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Open conversation with ${item.name}`}
            >
              <View style={$contactImageContainer}>
                <Image
                  source={{ uri: item.avatar }}
                  style={$contactImage}
                  defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
                />
              </View>
              <View style={$contactInfo}>
                <View style={$contactHeader}>
                  <Text style={$contactName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={$messageTime}>
                    {item.lastMessageTime}
                  </Text>
                </View>
                <Text style={$contactSpecialty} numberOfLines={1}>
                  {item.specialty}
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
          ))}
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

const $doctorsContainer: ViewStyle = {
  paddingRight: 16,
}

const $doctorItem: ViewStyle = {
  alignItems: "center",
  marginRight: 24, // 增加间距
  width: 100, // 增加宽度适应更大的头像
}

const $doctorImageContainer: ViewStyle = {
  position: "relative",
  marginBottom: 8,
}

const $doctorImage: ImageStyle = {
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

const $doctorInfo: ViewStyle = {
  alignItems: "center",
}

const $doctorName: TextStyle = {
  fontSize: 16, // 增大医生姓名字体
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

const $contactName: TextStyle = {
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
