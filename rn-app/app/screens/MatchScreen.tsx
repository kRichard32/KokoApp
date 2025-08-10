// app/screens/MatchScreen.tsx
import { FC, useState, useRef } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
  FlatList,
  ListRenderItem,
  Dimensions,
  ScrollView,
} from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface MatchScreenProps extends AppStackScreenProps<"Match"> {}

interface UserProfile {
  id: string
  name: string
  age: number
  location: string
  avatar: string
  photos: string[]
  interests: string[]
  bio: string
  occupation: string
}

const { width: screenWidth } = Dimensions.get('window')
const PHOTO_WIDTH = screenWidth - 40

export const MatchScreen: FC<MatchScreenProps> = ({ navigation, route }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  // Get parameters from route (if coming from PeopleScreen)
  const { personId, personName } = route.params || {}

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const photoScrollRef = useRef<FlatList>(null)

  // 模拟用户数据
  const mockUsers: UserProfile[] = [
    {
      id: "1",
      name: "Margaret Johnson",
      age: 72,
      location: "Vancouver, BC",
      avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=300&h=300&fit=crop&crop=face",
      photos: [
        "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop",
      ],
      interests: [
        "🎣 Fishing",
        "🌸 Gardening", 
        "📚 Reading",
        "🍳 Cooking",
        "🚶‍♀️ Walking",
        "🎨 Painting",
        "🧶 Knitting",
        "🎵 Music"
      ],
      bio: "Retired teacher who loves spending time outdoors and learning new things. Looking for friendship and meaningful conversations.",
      occupation: "Retired Teacher"
    },
    {
      id: "2", 
      name: "Robert Chen",
      age: 68,
      location: "Toronto, ON",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      photos: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=500&fit=crop",
      ],
      interests: [
        "🏃‍♂️ Jogging",
        "♟️ Chess",
        "📖 History",
        "☕ Coffee",
        "🎬 Movies",
        "🌍 Travel"
      ],
      bio: "Former engineer who enjoys intellectual conversations and staying active. Love exploring new places and cultures.",
      occupation: "Retired Engineer"
    }
  ]

  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const currentUser = mockUsers[currentUserIndex]
  const hasMoreUsers = currentUserIndex < mockUsers.length - 1

  // 如果没有更多用户，显示结束页面
  if (currentUserIndex >= mockUsers.length) {
    return (
      <Screen
        preset="fixed"
        safeAreaEdges={["top"]}
        contentContainerStyle={themed($container)}
      >
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
          
          <Text style={$headerTitle}>Find Friends</Text>
          
          <View style={$headerSpacer} />
        </View>

        <View style={$noMoreUsersContainer}>
          <Text style={$noMoreUsersIcon}>🎉</Text>
          <Text style={$noMoreUsersTitle}>All caught up!</Text>
          <Text style={$noMoreUsersText}>
            You've seen all available profiles. Check back later for new friends to meet!
          </Text>
          <Pressable
            style={$restartButton}
            onPress={() => setCurrentUserIndex(0)}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Start over"
          >
            <Text style={$restartButtonText}>Start Over</Text>
          </Pressable>
        </View>
      </Screen>
    )
  }

  // 渲染照片项
  const renderPhoto: ListRenderItem<string> = ({ item, index }) => (
    <View style={$photoContainer}>
      <Image
        source={{ uri: item }}
        style={$photo}
        defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
      />
      <View style={$photoIndicator}>
        <Text style={$photoIndexText}>{index + 1} / {currentUser.photos.length}</Text>
      </View>
    </View>
  )

  // 渲染兴趣标签
  const renderInterestTag = (interest: string, index: number) => (
    <View key={index} style={$interestTag}>
      <Text style={$interestText}>{interest}</Text>
    </View>
  )

  // 处理照片滚动
  const onPhotoScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x
    const currentIndex = Math.round(contentOffset / PHOTO_WIDTH)
    setCurrentPhotoIndex(currentIndex)
  }

  // 喜欢用户
  const handleLike = () => {
    console.log("Liked user:", currentUser.name)
    // TODO: 实现喜欢功能
    // 显示下一个用户
    if (currentUserIndex < mockUsers.length - 1) {
      setCurrentUserIndex(prev => prev + 1)
      setCurrentPhotoIndex(0)
    }
  }

  // 跳过用户
  const handlePass = () => {
    console.log("Passed user:", currentUser.name)
    // TODO: 实现跳过功能
    // 显示下一个用户
    if (currentUserIndex < mockUsers.length - 1) {
      setCurrentUserIndex(prev => prev + 1)
      setCurrentPhotoIndex(0)
    }
  }

  // 发送消息
  const handleMessage = () => {
    navigation.navigate("ChatDetail", {
      conversationId: currentUser.id,
    })
  }

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
        
        <Text style={$headerTitle}>Find Friends</Text>
        
        <View style={$headerSpacer} />
      </View>

      <ScrollView style={$scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 照片轮播 */}


        {/* 用户信息卡片 */}
        <View style={$infoCard}>
          {/* 基本信息 */}
          <View style={$basicInfo}>
            <Image
//               source={{ uri: currentUser.avatar }}
//               style={$avatarLarge}
//               defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
            />
            <View style={$nameInfo}>
              <Text style={$userName}>{currentUser.name}</Text>
              <Text style={$userAge}>{currentUser.age} years old</Text>
              <Text style={$userLocation}>📍 {currentUser.location}</Text>
              <Text style={$userOccupation}>👩‍🏫 {currentUser.occupation}</Text>
            </View>
          </View>

          {/* 个人简介 */}
          <View style={$bioSection}>
            <Text style={$sectionTitle}>About Me</Text>
            <Text style={$bioText}>{currentUser.bio}</Text>
          </View>

          {/* 兴趣爱好 */}
          <View style={$interestsSection}>
            <Text style={$sectionTitle}>My Interests</Text>
            <View style={$interestsContainer}>
              {currentUser.interests.map(renderInterestTag)}
            </View>
          </View>
        </View>
        <View style={$photoSection}>
                  <FlatList
                    ref={photoScrollRef}
                    data={currentUser.photos}
                    renderItem={renderPhoto}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onPhotoScroll}
                    scrollEventThrottle={16}
                  />

                  {/* 照片指示器 */}
                  <View style={$photoDotsContainer}>
                    {currentUser.photos.map((_, index: number) => (
                      <View
                        key={index}
                        style={[
                          $photoDot,
                          index === currentPhotoIndex ? $photoDotActive : $photoDotInactive
                        ]}
                      />
                    ))}
                  </View>
                </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={$actionButtons}>
        <Pressable
          style={$passButton}
          onPress={handlePass}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Pass this person"
        >
          <Text style={$passButtonIcon}>⏭️</Text>
          <Text style={$passButtonText}>Skip</Text>
        </Pressable>

        <Pressable
          style={$messageButton}
          onPress={handleMessage}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={$messageButtonIcon}>💬</Text>
          <Text style={$messageButtonText}>Message</Text>
        </Pressable>
                      
      </View>
      
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
}

const $backButton: ViewStyle = {
  padding: 8,
  marginRight: 8,
}

const $backIcon: TextStyle = {
  fontSize: 24,
  color: "#666",
}

const $headerTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "600",
  color: "#000",
  flex: 1,
  textAlign: "center",
}

const $headerSpacer: ViewStyle = {
  width: 40,
}

const $scrollContainer: ViewStyle = {
  flex: 1,
}

const $photoSection: ViewStyle = {
  height: 400,
  position: "relative",
}

const $photoContainer: ViewStyle = {
  width: PHOTO_WIDTH,
  height: 400,
  marginHorizontal: 20,
  borderRadius: 16,
  overflow: "hidden",
  position: "relative",
}

const $photo: ImageStyle = {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
}

const $photoIndicator: ViewStyle = {
  position: "absolute",
  top: 16,
  right: 16,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  borderRadius: 12,
  paddingHorizontal: 8,
  paddingVertical: 4,
}

const $photoIndexText: TextStyle = {
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: "500",
}

const $photoDotsContainer: ViewStyle = {
  position: "absolute",
  bottom: 20,
  left: 0,
  right: 0,
  flexDirection: "row",
  justifyContent: "center",
  gap: 8,
}

const $photoDot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
}

const $photoDotActive: ViewStyle = {
  backgroundColor: "#FFFFFF",
}

const $photoDotInactive: ViewStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.5)",
}

const $infoCard: ViewStyle = {
  backgroundColor: "#FFFFFF",
  margin: 20,
  borderRadius: 20,
  padding: 24,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
}

const $basicInfo: ViewStyle = {
  flexDirection: "row",
  marginBottom: 24,
}

const $avatarLarge: ImageStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  marginRight: 16,
  backgroundColor: "#F0F0F0",
}

const $nameInfo: ViewStyle = {
  flex: 1,
  justifyContent: "center",
}

const $userName: TextStyle = {
  fontSize: 24,
  fontWeight: "700",
  color: "#000",
  marginBottom: 4,
}

const $userAge: TextStyle = {
  fontSize: 16,
  color: "#666",
  marginBottom: 2,
}

const $userLocation: TextStyle = {
  fontSize: 16,
  color: "#666",
  marginBottom: 2,
}

const $userOccupation: TextStyle = {
  fontSize: 16,
  color: "#666",
}

const $bioSection: ViewStyle = {
  marginBottom: 24,
}

const $sectionTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "600",
  color: "#000",
  marginBottom: 12,
}

const $bioText: TextStyle = {
  fontSize: 16,
  lineHeight: 24,
  color: "#444",
}

const $interestsSection: ViewStyle = {
  marginBottom: 16,
}

const $interestsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
}

const $interestTag: ViewStyle = {
  backgroundColor: "#F0F8FF",
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: "#E1F5FE",
}

const $interestText: TextStyle = {
  fontSize: 16,
  color: "#1976D2",
  fontWeight: "500",
}

const $actionButtons: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-around",
  paddingHorizontal: 20,
  paddingVertical: 20,
  backgroundColor: "#FFFFFF",
  borderTopWidth: 1,
  borderTopColor: "#F0F0F0",
}

const $passButton: ViewStyle = {
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 16,
  backgroundColor: "#F5F5F5",
  minWidth: 80,
}

const $passButtonIcon: TextStyle = {
  fontSize: 24,
  marginBottom: 4,
}

const $passButtonText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#666",
}

const $messageButton: ViewStyle = {
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 16,
  backgroundColor: "#E3F2FD",
  minWidth: 80,
}

const $messageButtonIcon: TextStyle = {
  fontSize: 24,
  marginBottom: 4,
}

const $messageButtonText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#1976D2",
}

const $likeButton: ViewStyle = {
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 16,
  backgroundColor: "#FFE8E8",
  minWidth: 80,
}

const $likeButtonIcon: TextStyle = {
  fontSize: 24,
  marginBottom: 4,
}

const $likeButtonText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#D32F2F",
}

// 没有更多用户的样式
const $noMoreUsersContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
}

const $noMoreUsersIcon: TextStyle = {
  fontSize: 60,
  marginBottom: 16,
}

const $noMoreUsersTitle: TextStyle = {
  fontSize: 28,
  fontWeight: "bold",
  color: "#333",
  marginBottom: 12,
  textAlign: "center",
}

const $noMoreUsersText: TextStyle = {
  fontSize: 18,
  color: "#666",
  textAlign: "center",
  lineHeight: 26,
  marginBottom: 32,
}

const $restartButton: ViewStyle = {
  backgroundColor: "#4CAF50",
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 8,
  alignItems: "center",
}

const $restartButtonText: TextStyle = {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "600",
}
