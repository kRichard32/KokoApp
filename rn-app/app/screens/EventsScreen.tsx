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
  Alert,
} from "react-native"
import axios from "axios"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL

// 活动数据类型
interface Event {
  id: string
  title: string
  description: string
  eventDate: number // timestamp
  location: string
  maxParticipants: number
  eventType: string // "VIRTUAL" or "PHYSICAL"
  status: string
  participantCount?: number // optional for display
  hostName?: string // optional for display
  hostAvatar?: string // optional for display
  image?: string // optional for display
  isJoined?: boolean // optional for display
  category?: string // derived from tags or separate field
  tags?: string[] // optional for display
}

interface EventsScreenProps extends AppStackScreenProps<"Events"> {}

export const EventsScreen: FC<EventsScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [events, setEvents] = useState<Event[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [isLoading, setIsLoading] = useState(false)

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

  // 加载事件数据
  useEffect(() => {
    loadEvents()
    
    // Cleanup function to revoke blob URLs when component unmounts
    return () => {
      events.forEach(event => {
        if (event.image && event.image.startsWith('blob:')) {
          URL.revokeObjectURL(event.image)
        }
        if (event.hostAvatar && event.hostAvatar.startsWith('blob:')) {
          URL.revokeObjectURL(event.hostAvatar)
        }
      })
    }
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching events from:', `${serverUrl}/api/events/all`)
      const response = await axios.get(`${serverUrl}/api/events/all`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Events response:', response.data)
      
      if (response.data && Array.isArray(response.data)) {
        // Transform API data and fetch additional images
        const transformedEventsPromises = response.data.map(async (event: any) => {
          let eventImage = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop" // default image
          let hostAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" // default avatar

          // Fetch event picture
          try {
            console.log(`Fetching event picture for event ${event.id}`)
            const eventImageResponse = await axios.get(`${serverUrl}/api/events/${event.id}/getEventPicture`, {
              withCredentials: true,
              responseType: 'arraybuffer',
            })
            
            if (eventImageResponse.data) {
              // Convert byte array to base64
              const base64String = btoa(
                new Uint8Array(eventImageResponse.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
              )
              
              // Create data URI
              eventImage = `data:image/jpeg;base64,${base64String}`
            }
          } catch (imageError) {
            console.warn(`Failed to fetch event image for event ${event.id}:`, imageError)
            // Keep default image
          }

          // Fetch host profile picture
          try {
            if (event.organizer?.id) {
              console.log(`Fetching profile picture for host ${event.organizer.id}`)
              const hostImageResponse = await axios.get(`${serverUrl}/api/profile/getProfilePicture`, {
                withCredentials: true,
                params: { id: event.organizer.id },
                responseType: 'arraybuffer',
              })
              
              if (hostImageResponse.data) {
                const base64String = btoa(
                new Uint8Array(hostImageResponse.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
              )
                hostAvatar = `data:image/jpeg;base64,${base64String}`
              }
            }
          } catch (avatarError) {
            console.warn(`Failed to fetch host avatar for host ${event.organizer?.id}:`, avatarError)
            // Keep default avatar
          }
          console.log(event.eventType)
          return {
            ...event,
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: event.eventDate,
            location: event.location,
            participantCount: event.currentParticipants,
            maxParticipants: event.maxParticipants,
            category: event.eventType,
            status: event.status,
            hostName: event.organizer?.name || "Event Host",
            hostId: event.organizer?.id,
            hostAvatar: hostAvatar,
            image: eventImage,
            duration: event.duration || "1 hour",
            isJoined: false, // Default to false
            tags: event.tags || [],
          }
        })

        // Wait for all image fetches to complete
        const transformedEvents = await Promise.all(transformedEventsPromises)
        setEvents(transformedEvents)
      } else {
        setEvents([])
      }
    } catch (error: any) {
      console.error('Error loading events:', error)
      Alert.alert(
        "Error",
        "Failed to load events. Please check your connection and try again.",
        [
          { text: "Retry", onPress: loadEvents },
          { text: "Cancel", style: "cancel" }
        ]
      )
    } finally {
      setIsLoading(false)
    }
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
              ? (event.participantCount || 0) - 1 
              : (event.participantCount || 0) + 1
          }
        : event
    ))
  }

  // Helper function to format timestamp to date and time
  const formatEventDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    return { dateStr, timeStr }
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
  const renderEvent: ListRenderItem<Event> = ({ item }) => {
    const { dateStr, timeStr } = formatEventDateTime(item.eventDate)
    const participantCount = item.participantCount || 0
    const isJoined = item.isJoined || false
    const tags = item.tags || []
    const categoryMap = Object.fromEntries(
      categories.map(cat => [cat.key, cat])
    )
    return (
      <View style={$eventCard}>
        <Image 
          source={{ uri: item.image }}
          style={$eventImage}
          defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
        />
        
        <View style={$eventContent}>
          {/* 活动标题 */}
          <View style={$eventHeader}>
            <Text style={$eventTitle} numberOfLines={2}>{item.title}</Text>
            <View style={$categoryBadge}>
              <Text style={$categoryBadgeText}>
                {categoryMap[item.category as keyof typeof categoryMap]?.emoji} {categoryMap[item.category as keyof typeof categoryMap]?.name}
              </Text>
            </View>
          </View>

          {/* 活动描述 */}
          <Text style={$eventDescription} numberOfLines={3}>{item.description}</Text>

          {/* 标签 */}
          {tags.length > 0 && (
            <View style={$tagsContainer}>
              {tags.map((tag: string, index: number) => (
                <View key={index} style={$tag}>
                  <Text style={$tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 时间、地点和参与者信息 */}
          <View style={$eventInfo}>
            <View style={$timeInfo}>
              <Text style={$eventDate}>📅 {dateStr}</Text>
              <Text style={$eventTime}>🕐 {timeStr}</Text>
              <Text style={$eventLocation}>
                {item.eventType === "VIRTUAL" ? "🌐" : "📍"} {item.location}
              </Text>
            </View>
            <Text style={$participantInfo}>
              👥 {participantCount}/{item.maxParticipants} joined
            </Text>
          </View>

          {/* 主持人信息 */}
          {item.hostName && (
            <View style={$hostInfo}>
              <Image 
                source={{ uri: item.hostAvatar }}
                style={$hostAvatar}
                defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
              />
              <Text style={$hostText}>Hosted by {item.hostName}</Text>
            </View>
          )}

          {/* 加入按钮 */}
          <Pressable
            style={[
              $joinButton,
              isJoined && $joinedButton,
              participantCount >= item.maxParticipants && !isJoined && $fullButton
            ]}
            onPress={() => toggleJoinEvent(item.id)}
            disabled={participantCount >= item.maxParticipants && !isJoined}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isJoined ? "Leave event" : "Join event"}
          >
            <Text style={[
              $joinButtonText,
              isJoined && $joinedButtonText,
              participantCount >= item.maxParticipants && !isJoined && $fullButtonText
            ]}>
              {participantCount >= item.maxParticipants && !isJoined 
                ? "Event Full" 
                : isJoined 
                  ? "✓ Joined" 
                  : "Join Event"
              }
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

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
        
        <Text style={$headerTitle}>Events</Text>
        
        <Pressable
          onPress={() => navigation.navigate("CreateEvent")}
          style={$createButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Create new event"
        >
          <Text style={$createButtonText}>+</Text>
        </Pressable>
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
      {isLoading ? (
        <View style={$loadingContainer}>
          <Text style={$loadingText}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          style={$eventsList}
          contentContainerStyle={$eventsContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={$eventSeparator} />}
          ListEmptyComponent={
            <View style={$emptyContainer}>
              <Text style={$emptyText}>No events found</Text>
              <Text style={$emptySubtext}>
                {selectedCategory === "All" 
                  ? "Create your first event to get started!" 
                  : `No events found in ${selectedCategory} category`}
              </Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={loadEvents}
        />
      )}
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

const $createButton: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#4CAF50",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
}

const $createButtonText: TextStyle = {
  fontSize: 24,
  fontWeight: "bold",
  color: "#FFFFFF",
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

const $categoryBadge: ViewStyle = {
  backgroundColor: "#E3F2FD",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#2196F3",
  marginLeft: 8,
}

const $categoryBadgeText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#2196F3",
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

const $eventLocation: TextStyle = {
  fontSize: 18,
  color: "#444",
  fontWeight: "500",
  marginTop: 6,
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

const $loadingContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: 40,
}

const $loadingText: TextStyle = {
  fontSize: 18,
  color: "#666",
  fontWeight: "500",
}

const $emptyContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: 40,
  paddingHorizontal: 20,
}

const $emptyText: TextStyle = {
  fontSize: 20,
  fontWeight: "600",
  color: "#666",
  marginBottom: 8,
  textAlign: "center",
}

const $emptySubtext: TextStyle = {
  fontSize: 16,
  color: "#999",
  textAlign: "center",
  lineHeight: 24,
}
