// app/screens/PeopleScreen.tsx
import { FC, useState, useEffect } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
  FlatList,
  ListRenderItem,
} from "react-native"
import axios from "axios"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

// 数据类型定义
interface Person {
  id: string
  name: string
  age?: number
  location?: string
  interests?: string[]
  avatar?: string | any
  bio?: string
  isOnline?: boolean
  compatibility?: number // 匹配度 0-100
}

interface PeopleScreenProps extends AppStackScreenProps<"People"> {}

export const PeopleScreen: FC<PeopleScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [people, setPeople] = useState<Person[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium'>('all')

  // 模拟数据加载
  useEffect(() => {
    loadPeopleData()
  }, [])

  const loadPeopleData = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/profile/getMatchUsers`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Match users data:', response.data)
      
      if (response.data && Array.isArray(response.data)) {
        // 将API响应转换为我们的Person格式，并获取头像
        const peopleWithAvatars = await Promise.all(
          response.data.map(async (user: any) => {
            let avatarUri = null
            
            try {
              // 获取用户头像
              const avatarResponse = await axios.get(`${serverUrl}/api/profile/getProfilePicture`, {
                withCredentials: true,
                params: { id: user.id },
                responseType: 'arraybuffer',
              })
              
              if (avatarResponse.data && avatarResponse.data.byteLength > 0) {
                // 将二进制数据转换为base64
                const base64 = btoa(
                  new Uint8Array(avatarResponse.data)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
                )
                avatarUri = `data:image/jpeg;base64,${base64}`
              }
            } catch (avatarError) {
              console.log(`Failed to fetch avatar for user ${user.id}:`, avatarError)
              // 使用默认头像
            }

            return {
              id: user.id,
              name: user.name || 'Unknown User',
              age: user.age || 60 + Math.floor(Math.random() * 10),
              location: user.location || 'Unknown Location',
              interests: user.traits.map((t: any) => t.traitName) || ['Chat', 'Meeting'],
              avatar: avatarUri || require("../../assets/images/avatar-placeholder.jpg"),
              bio: user.bio || 'Looking forward to meeting new people!',
              isOnline: Math.random() > 0.3, // 随机在线状态
              compatibility: Math.floor(Math.random() * 40) + 60, // 60-100%的匹配度
            }
          })
        )
        
        setPeople(peopleWithAvatars)
      }
    } catch (error) {
      console.error('Failed to fetch match users:', error)
      
      // 如果API调用失败，使用模拟数据作为回退
      const mockPeople: Person[] = [
        {
          id: "1",
          name: "Sarah Chen",
          age: 28,
          location: "Downtown",
          interests: ["Yoga", "Reading", "Coffee"],
          avatar: require("../../assets/images/avatar-placeholder.jpg"),
          bio: "Love exploring new places and meeting interesting people!",
          isOnline: true,
          compatibility: 95,
        },
        {
          id: "2",
          name: "Michael Rodriguez",
          age: 32,
          location: "Midtown",
          interests: ["Music", "Art", "Travel"],
          avatar: require("../../assets/images/avatar-placeholder.jpg"),
          bio: "Musician and art enthusiast looking for meaningful connections.",
          isOnline: true,
          compatibility: 88,
        },
        {
          id: "3",
          name: "Emily Johnson",
          age: 26,
          location: "Uptown",
          interests: ["Fitness", "Cooking", "Movies"],
          avatar: require("../../assets/images/avatar-placeholder.jpg"),
          bio: "Fitness enthusiast who loves trying new recipes and binge-watching series.",
          isOnline: false,
          compatibility: 82,
        },
      ]
      
      setPeople(mockPeople)
    }
  }

  const getCompatibilityColor = (compatibility: number) => {
    if (compatibility >= 80) return "#34C759" // Green
    if (compatibility >= 60) return "#FF9500" // Orange
    return "#FF3B30" // Red
  }

  const getCompatibilityText = (compatibility: number) => {
    if (compatibility >= 80) return "High Similarity"
    if (compatibility >= 60) return "Good Similarity"
    return "Low Similarity"
  }

  const filteredPeople = people.filter(person => {
    if (selectedFilter === 'high') return (person.compatibility ?? 0) >= 80
    if (selectedFilter === 'medium') return (person.compatibility ?? 0) >= 60 && (person.compatibility ?? 0) < 80
    return true
  })

  const openMatchScreen = (person: Person) => {
    navigation.navigate("Match", { 
      personId: person.id,
      personName: person.name 
    })
  }

  const startChatWithPerson = async (person: Person) => {
    try {
      console.log('Creating conversation with person:', person.id)
      
      const response = await axios.post(`${serverUrl}/api/messages/create`, {
        jsonUsers: JSON.stringify([person.id]),
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Conversation created:', response.data)
      
      if (response.data && response.data.id) {
        // 导航到聊天页面
        navigation.navigate("ChatDetail", {
          conversationId: response.data.id,
        })
      } else {
        console.error('Invalid response from create conversation API')
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      // 可以在这里添加错误提示给用户
    }
  }

  const renderPersonCard: ListRenderItem<Person> = ({ item }) => (
    <Pressable
      style={$personCard}
      // onPress={() => openMatchScreen(item)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}'s profile`}
    >
      <View style={$cardHeader}>
        <View style={$avatarContainer}>
          <Image
            source={typeof item.avatar === 'string' ? { uri: item.avatar } : item.avatar ?? require("../../assets/images/avatar-placeholder.jpg")}
            style={$avatar}
            defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
          />
          {(item.isOnline ?? false) && <View style={$onlineIndicator} />}
        </View>
        <View style={$personInfo}>
          <Text style={$personName}>{item.name}, {item.age ?? 'N/A'}</Text>
          <Text style={$location}>📍 {item.location ?? 'Unknown'}</Text>
          <View style={[
            $compatibilityBadge,
            { backgroundColor: getCompatibilityColor(item.compatibility ?? 0) }
          ]}>
            <Text style={$compatibilityText}>
              {item.compatibility ?? 0}% • {getCompatibilityText(item.compatibility ?? 0)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={$bio} numberOfLines={2}>
        {item.bio ?? 'No bio available'}
      </Text>

      <View style={$interestsContainer}>
        {(item.interests ?? []).map((interest, index) => (
          <View key={index} style={$interestTag}>
            <Text style={$interestText}>{interest}</Text>
          </View>
        ))}
      </View>

      <View style={$cardActions}>
        <Pressable style={$actionButton}>
          <Text style={$actionButtonText}>👋 Wave</Text>
        </Pressable>
        <Pressable 
          style={[$actionButton, $primaryAction]}
          onPress={() => startChatWithPerson(item)}
        >
          <Text style={[$actionButtonText, $primaryActionText]}>💫 Chat</Text>
        </Pressable>
      </View>
    </Pressable>
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
          accessibilityLabel="Go back"
        >
          <Text style={$backIcon}>←</Text>
        </Pressable>
        
        <Text style={$headerTitle}>Discover People</Text>
        
        <Pressable
          style={$filterButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Filter options"
        >
          <Text style={$filterIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={$filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'high', label: 'High Similarity' },
          { key: 'medium', label: 'Good Similarity' },
        ].map(filter => (
          <Pressable
            key={filter.key}
            style={[
              $filterTab,
              selectedFilter === filter.key && $activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${filter.label}`}
          >
            <Text style={[
              $filterTabText,
              selectedFilter === filter.key && $activeFilterTabText
            ]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* People List */}
      <FlatList
        data={filteredPeople}
        renderItem={renderPersonCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={$listContainer}
        ItemSeparatorComponent={() => <View style={$separator} />}
      />
      <Pressable
                  onPress={() => navigation.goBack()}
                  style={$backButtonBottomRight}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Text style={$backIcon}>←</Text>
                </Pressable>
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
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
  backgroundColor: "#FFFFFF",
}
const $backButtonBottomRight: ViewStyle = {
  position: "absolute",
  bottom: 24,
  right: 24,
  padding: 16,
  borderRadius: 24,
  backgroundColor: "#fff",
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  zIndex: 100,
  borderWidth: 2,           // <-- Add a thicker, more solid border
  borderColor: "#000",      // <-- Solid black border
}
const $backButton: ViewStyle = {
  padding: 8,
  borderRadius: 20,
}

const $backIcon: TextStyle = {
  fontSize: 32, // 增大返回箭头
  color: "#666",
}

const $headerTitle: TextStyle = {
  fontSize: 28, // 增大标题字体
  fontWeight: "600",
  color: "#000",
}

const $filterButton: ViewStyle = {
  padding: 8,
  borderRadius: 20,
}

const $filterIcon: TextStyle = {
  fontSize: 28, // 增大设置图标
}

const $filterContainer: ViewStyle = {
  flexDirection: "row",
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 8,
}

const $filterTab: ViewStyle = {
  paddingHorizontal: 20, // 增大按钮内边距
  paddingVertical: 12,   // 增大按钮内边距
  borderRadius: 20,
  backgroundColor: "#F0F0F0",
}

const $activeFilterTab: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $filterTabText: TextStyle = {
  fontSize: 18, // 增大过滤器文字
  fontWeight: "500",
  color: "#666",
}

const $activeFilterTabText: TextStyle = {
  color: "#FFFFFF",
}

const $listContainer: ViewStyle = {
  padding: 20, // 增大列表内边距
}

const $separator: ViewStyle = {
  height: 20, // 增大卡片间距
}

const $personCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 20, // 增大圆角
  padding: 20,      // 增大卡片内边距
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
  borderWidth: 1,
  borderColor: "#F0F0F0",
}

const $cardHeader: ViewStyle = {
  flexDirection: "row",
  marginBottom: 16, // 增大间距
}

const $avatarContainer: ViewStyle = {
  position: "relative",
  marginRight: 16, // 增大头像与信息间距
}

const $avatar: ImageStyle = {
  width: 80,  // 增大头像尺寸
  height: 80, // 增大头像尺寸
  borderRadius: 40,
  backgroundColor: "#F0F0F0",
}

const $onlineIndicator: ViewStyle = {
  position: "absolute",
  bottom: 2,
  right: 2,
  width: 20, // 增大在线指示器
  height: 20,
  borderRadius: 10,
  backgroundColor: "#34C759",
  borderWidth: 2,
  borderColor: "#FFFFFF",
}

const $personInfo: ViewStyle = {
  flex: 1,
}

const $personName: TextStyle = {
  fontSize: 24, // 增大姓名字体
  fontWeight: "600",
  color: "#000",
  marginBottom: 6,
}

const $location: TextStyle = {
  fontSize: 18, // 增大位置信息字体
  color: "#666",
  marginBottom: 10,
}

const $compatibilityBadge: ViewStyle = {
  alignSelf: "flex-start",
  paddingHorizontal: 12, // 增大内边距
  paddingVertical: 6,    // 增大内边距
  borderRadius: 12,
}

const $compatibilityText: TextStyle = {
  fontSize: 16, // 增大匹配度文字
  fontWeight: "600",
  color: "#FFFFFF",
}

const $bio: TextStyle = {
  fontSize: 18, // 增大个人简介字体
  color: "#333",
  lineHeight: 26, // 增大行高
  marginBottom: 16,
}

const $interestsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8, // 增大标签间距
  marginBottom: 20,
}

const $interestTag: ViewStyle = {
  backgroundColor: "#F0F0F0",
  paddingHorizontal: 12, // 增大标签内边距
  paddingVertical: 6,    // 增大标签内边距
  borderRadius: 12,
}

const $interestText: TextStyle = {
  fontSize: 16, // 增大兴趣标签字体
  color: "#666",
  fontWeight: "500",
}

const $cardActions: ViewStyle = {
  flexDirection: "row",
  gap: 12, // 增大按钮间距
}

const $actionButton: ViewStyle = {
  flex: 1,
  paddingVertical: 16, // 增大按钮内边距
  paddingHorizontal: 20, // 增大按钮内边距
  borderRadius: 20,
  backgroundColor: "#F0F0F0",
  alignItems: "center",
  minHeight: 56, // 设置最小高度，确保足够的触控区域
}

const $primaryAction: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $actionButtonText: TextStyle = {
  fontSize: 18, // 增大按钮文字
  fontWeight: "600",
  color: "#666",
}

const $primaryActionText: TextStyle = {
  color: "#FFFFFF",
}
