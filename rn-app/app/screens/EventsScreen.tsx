// app/screens/EventsScreen.tsx
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
  ScrollView,
} from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// 活动数据类型
interface VirtualEvent {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  duration: string
  participantCount: number
  maxParticipants: number
  hostName: string
  hostAvatar: string
  image: string
  isJoined: boolean
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  tags: string[]
}

interface EventsScreenProps extends AppStackScreenProps<"Events"> {}

export const EventsScreen: FC<EventsScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [events, setEvents] = useState<VirtualEvent[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  // 活动分类
  const categories = [
    { key: "All", emoji: "🌟", name: "All Events" },
    { key: "Fishing", emoji: "🎣", name: "Fishing Club" },
    { key: "Gardening", emoji: "🌸", name: "Gardening" },
    { key: "Reading", emoji: "📚", name: "Book Club" },
    { key: "Cooking", emoji: "🍳", name: "Cooking" },
    { key: "Arts", emoji: "🎨", name: "Arts & Crafts" },
    { key: "Music", emoji: "🎵", name: "Music" },
  ]

  // 模拟数据加载
  useEffect(() => {
    loadMockEvents()
  }, [])

  const loadMockEvents = () => {
    const mockEvents: VirtualEvent[] = [
      {
        id: "1",
        title: "Virtual Fishing Stories & Tips",
        description: "Share your best fishing stories and learn new techniques from fellow anglers. Join us for a relaxing virtual fishing session!",
        category: "Fishing",
        date: "2024-01-20",
        time: "2:00 PM",
        duration: "1.5 hours",
        participantCount: 12,
        maxParticipants: 20,
        hostName: "Robert Chen",
        hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=200&fit=crop",
        isJoined: false,
        difficulty: "Beginner",
        tags: ["Relaxing", "Social", "Learning"]
      },
      {
        id: "2",
        title: "Morning Garden Chat",
        description: "Start your day with fellow gardening enthusiasts. Share what's blooming in your garden and get advice on seasonal care.",
        category: "Gardening",
        date: "2024-01-21",
        time: "9:00 AM",
        duration: "1 hour",
        participantCount: 8,
        maxParticipants: 15,
        hostName: "Margaret Johnson",
        hostAvatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=200&fit=crop",
        isJoined: true,
        difficulty: "Beginner",
        tags: ["Morning", "Plants", "Tips"]
      },
      {
        id: "3",
        title: "Classic Literature Discussion",
        description: "This week we're discussing 'To Kill a Mockingbird'. Join us for thoughtful conversation and different perspectives.",
        category: "Reading",
        date: "2024-01-22",
        time: "7:00 PM",
        duration: "2 hours",
        participantCount: 15,
        maxParticipants: 25,
        hostName: "Eleanor Smith",
        hostAvatar: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop&crop=face",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop",
        isJoined: false,
        difficulty: "Intermediate",
        tags: ["Discussion", "Classic", "Thoughtful"]
      },
      {
        id: "4",
        title: "Easy Comfort Food Cooking",
        description: "Learn to make delicious, simple comfort foods perfect for any day. We'll cook together step by step!",
        category: "Cooking",
        date: "2024-01-23",
        time: "11:00 AM",
        duration: "2.5 hours",
        participantCount: 6,
        maxParticipants: 12,
        hostName: "Maria Rodriguez",
        hostAvatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop&crop=face",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
        isJoined: true,
        difficulty: "Beginner",
        tags: ["Cooking", "Easy", "Delicious"]
      },
      {
        id: "5",
        title: "Watercolor Painting Circle",
        description: "Paint along with us in this relaxing watercolor session. All skill levels welcome - just bring your creativity!",
        category: "Arts",
        date: "2024-01-24",
        time: "3:00 PM",
        duration: "2 hours",
        participantCount: 10,
        maxParticipants: 18,
        hostName: "David Kim",
        hostAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face",
        image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop",
        isJoined: false,
        difficulty: "Beginner",
        tags: ["Creative", "Relaxing", "Art"]
      }
    ]

    setEvents(mockEvents)
  }

  // 过滤活动
  const filteredEvents = selectedCategory === "All" 
    ? events 
    : events.filter(event => event.category === selectedCategory)

  // 加入/退出活动
  const toggleJoinEvent = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            isJoined: !event.isJoined,
            participantCount: event.isJoined 
              ? event.participantCount - 1 
              : event.participantCount + 1
          }
        : event
    ))
  }

  // 渲染分类按钮
  const renderCategory = (category: typeof categories[0]) => (
    <Pressable
      key={category.key}
      style={[
        $categoryButton,
        selectedCategory === category.key && $categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(category.key)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${category.name}`}
    >
      <Text style={$categoryEmoji}>{category.emoji}</Text>
      <Text style={[
        $categoryText,
        selectedCategory === category.key && $categoryTextActive
      ]}>
        {category.name}
      </Text>
    </Pressable>
  )

  // 渲染活动卡片
  const renderEvent: ListRenderItem<VirtualEvent> = ({ item }) => (
    <View style={$eventCard}>
      <Image 
        source={{ uri: item.image }}
        style={$eventImage}
        defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
      />
      
      <View style={$eventContent}>
        {/* 活动标题和难度 */}
        <View style={$eventHeader}>
          <Text style={$eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={$difficultyBadge}>
            <Text style={$difficultyText}>{item.difficulty}</Text>
          </View>
        </View>

        {/* 活动描述 */}
        <Text style={$eventDescription} numberOfLines={3}>{item.description}</Text>

        {/* 标签 */}
        <View style={$tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={$tag}>
              <Text style={$tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* 时间和参与者信息 */}
        <View style={$eventInfo}>
          <View style={$timeInfo}>
            <Text style={$eventDate}>📅 {item.date}</Text>
            <Text style={$eventTime}>🕐 {item.time} ({item.duration})</Text>
          </View>
          <Text style={$participantInfo}>
            👥 {item.participantCount}/{item.maxParticipants} joined
          </Text>
        </View>

        {/* 主持人信息 */}
        <View style={$hostInfo}>
          <Image 
            source={{ uri: item.hostAvatar }}
            style={$hostAvatar}
            defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
          />
          <Text style={$hostText}>Hosted by {item.hostName}</Text>
        </View>

        {/* 加入按钮 */}
        <Pressable
          style={[
            $joinButton,
            item.isJoined && $joinedButton,
            item.participantCount >= item.maxParticipants && !item.isJoined && $fullButton
          ]}
          onPress={() => toggleJoinEvent(item.id)}
          disabled={item.participantCount >= item.maxParticipants && !item.isJoined}
          accessible
          accessibilityRole="button"
          accessibilityLabel={item.isJoined ? "Leave event" : "Join event"}
        >
          <Text style={[
            $joinButtonText,
            item.isJoined && $joinedButtonText,
            item.participantCount >= item.maxParticipants && !item.isJoined && $fullButtonText
          ]}>
            {item.participantCount >= item.maxParticipants && !item.isJoined 
              ? "Event Full" 
              : item.isJoined 
                ? "✓ Joined" 
                : "Join Event"
            }
          </Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($container)}
    >
      {/* 头部 */}
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
        
        <Text style={$headerTitle}>Virtual Events</Text>
        
        <View style={$headerSpacer} />
      </View>

      {/* 分类选择 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={$categoriesContainer}
        contentContainerStyle={$categoriesContent}
      >
        {categories.map(renderCategory)}
      </ScrollView>

      {/* 活动列表 */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        style={$eventsList}
        contentContainerStyle={$eventsContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={$eventSeparator} />}
      />
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  backgroundColor: "#FFFFFF",
})

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#FFFFFF",
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
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
  fontWeight: "700",
  color: "#000",
}

const $headerSpacer: ViewStyle = {
  width: 40,
}

const $categoriesContainer: ViewStyle = {
  maxHeight: 80,
  marginVertical: 16,
}

const $categoriesContent: ViewStyle = {
  paddingHorizontal: 16,
  gap: 12,
}

const $categoryButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20, // 增大内边距
  paddingVertical: 16,   // 增大内边距
  borderRadius: 25,
  backgroundColor: "#F8F9FA",
  borderWidth: 2,
  borderColor: "transparent",
  minWidth: 120, // 增大最小宽度
}

const $categoryButtonActive: ViewStyle = {
  backgroundColor: "#E3F2FD",
  borderColor: "#2196F3",
}

const $categoryEmoji: TextStyle = {
  fontSize: 20, // 增大emoji字体
  marginRight: 10,
}

const $categoryText: TextStyle = {
  fontSize: 18, // 增大分类文字
  fontWeight: "600",
  color: "#666",
}

const $categoryTextActive: TextStyle = {
  color: "#2196F3",
}

const $eventsList: ViewStyle = {
  flex: 1,
}

const $eventsContent: ViewStyle = {
  paddingHorizontal: 16,
  paddingBottom: 20,
}

const $eventSeparator: ViewStyle = {
  height: 16,
}

const $eventCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  overflow: "hidden",
}

const $eventImage: ImageStyle = {
  width: "100%",
  height: 160,
  resizeMode: "cover",
}

const $eventContent: ViewStyle = {
  padding: 20, // 增大内边距
}

const $eventHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 16, // 增大间距
}

const $eventTitle: TextStyle = {
  fontSize: 22, // 增大字体 18->22
  fontWeight: "700",
  color: "#000",
  flex: 1,
  marginRight: 16, // 增大间距
  lineHeight: 28, // 增大行高
}

const $difficultyBadge: ViewStyle = {
  backgroundColor: "#E8F5E8",
  paddingHorizontal: 12, // 增大内边距
  paddingVertical: 6,    // 增大内边距
  borderRadius: 12,
}

const $difficultyText: TextStyle = {
  fontSize: 16, // 增大字体 12->16
  fontWeight: "600",
  color: "#2E7D32",
}

const $eventDescription: TextStyle = {
  fontSize: 18, // 增大字体 14->18
  color: "#666",
  lineHeight: 26, // 增大行高
  marginBottom: 16, // 增大间距
}

const $tagsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12, // 增大间距
  marginBottom: 20, // 增大间距
}

const $tag: ViewStyle = {
  backgroundColor: "#F0F8FF",
  paddingHorizontal: 14, // 增大内边距
  paddingVertical: 6,    // 增大内边距
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#B3D9FF",
}

const $tagText: TextStyle = {
  fontSize: 16, // 增大字体 12->16
  color: "#1976D2",
  fontWeight: "500",
}

const $eventInfo: ViewStyle = {
  marginBottom: 16, // 增大间距
}

const $timeInfo: ViewStyle = {
  marginBottom: 12, // 增大间距
}

const $eventDate: TextStyle = {
  fontSize: 18, // 增大字体 14->18
  color: "#444",
  marginBottom: 6, // 增大间距
  fontWeight: "500",
}

const $eventTime: TextStyle = {
  fontSize: 18, // 增大字体 14->18
  color: "#444",
  fontWeight: "500",
}

const $participantInfo: TextStyle = {
  fontSize: 18, // 增大字体 14->18
  color: "#666",
  fontWeight: "500",
}

const $hostInfo: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16,
}

const $hostAvatar: ImageStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  marginRight: 8,
}

const $hostText: TextStyle = {
  fontSize: 18, // 增大字体 14->18
  color: "#666",
  fontWeight: "500",
}

const $joinButton: ViewStyle = {
  backgroundColor: "#4CAF50",
  paddingVertical: 18, // 增大内边距
  borderRadius: 12,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
}

const $joinedButton: ViewStyle = {
  backgroundColor: "#E8F5E8",
  borderWidth: 2,
  borderColor: "#4CAF50",
}

const $fullButton: ViewStyle = {
  backgroundColor: "#F5F5F5",
}

const $joinButtonText: TextStyle = {
  fontSize: 20, // 增大字体 16->20
  fontWeight: "700",
  color: "#FFFFFF",
}

const $joinedButtonText: TextStyle = {
  color: "#4CAF50",
}

const $fullButtonText: TextStyle = {
  color: "#999",
}
