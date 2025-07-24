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

const serverUrl = "http://10.0.2.2:8080"

// 数据类型定义
interface Person {
  id: string
  name: string
  age?: number
  location?: string
  interests?: string[]
  avatar?: any
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
        // 将API响应转换为我们的Person格式
        const formattedPeople: Person[] = response.data.map((user: any, index: number) => ({
          id: user.id,
          name: user.name || 'Unknown User',
          age: user.age || 25,
          location: user.location || 'Unknown Location',
          interests: user.traits.map((t: any) => t.traitName) || ['Chat', 'Meeting'],
          avatar: require("../../assets/images/avatar-placeholder.jpg"),
          bio: user.bio || 'Looking forward to meeting new people!',
          isOnline: Math.random() > 0.3, // 随机在线状态
          compatibility: Math.floor(Math.random() * 40) + 60, // 60-100%的匹配度
        }))
        
        setPeople(formattedPeople)
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
          conversationName: person.name,
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
      onPress={() => openMatchScreen(item)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}'s profile`}
    >
      <View style={$cardHeader}>
        <View style={$avatarContainer}>
          <Image
            source={item.avatar ?? require("../../assets/images/avatar-placeholder.jpg")}
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

const $backButton: ViewStyle = {
  padding: 8,
  borderRadius: 20,
}

const $backIcon: TextStyle = {
  fontSize: 24,
  color: "#666",
}

const $headerTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "600",
  color: "#000",
}

const $filterButton: ViewStyle = {
  padding: 8,
  borderRadius: 20,
}

const $filterIcon: TextStyle = {
  fontSize: 20,
}

const $filterContainer: ViewStyle = {
  flexDirection: "row",
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 8,
}

const $filterTab: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: "#F0F0F0",
}

const $activeFilterTab: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $filterTabText: TextStyle = {
  fontSize: 14,
  fontWeight: "500",
  color: "#666",
}

const $activeFilterTabText: TextStyle = {
  color: "#FFFFFF",
}

const $listContainer: ViewStyle = {
  padding: 16,
}

const $separator: ViewStyle = {
  height: 16,
}

const $personCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 16,
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
  marginBottom: 12,
}

const $avatarContainer: ViewStyle = {
  position: "relative",
  marginRight: 12,
}

const $avatar: ImageStyle = {
  width: 60,
  height: 60,
  borderRadius: 30,
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
  flex: 1,
}

const $personName: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: "#000",
  marginBottom: 4,
}

const $location: TextStyle = {
  fontSize: 14,
  color: "#666",
  marginBottom: 8,
}

const $compatibilityBadge: ViewStyle = {
  alignSelf: "flex-start",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
}

const $compatibilityText: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
  color: "#FFFFFF",
}

const $bio: TextStyle = {
  fontSize: 14,
  color: "#333",
  lineHeight: 20,
  marginBottom: 12,
}

const $interestsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 16,
}

const $interestTag: ViewStyle = {
  backgroundColor: "#F0F0F0",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
}

const $interestText: TextStyle = {
  fontSize: 12,
  color: "#666",
  fontWeight: "500",
}

const $cardActions: ViewStyle = {
  flexDirection: "row",
  gap: 8,
}

const $actionButton: ViewStyle = {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 20,
  backgroundColor: "#F0F0F0",
  alignItems: "center",
}

const $primaryAction: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $actionButtonText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#666",
}

const $primaryActionText: TextStyle = {
  color: "#FFFFFF",
}
