// app/screens/MessageScreen.tsx
import { FC, useState, useEffect } from "react"
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
} from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

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

  const [searchText, setSearchText] = useState("")
  const [recentDoctors, setRecentDoctors] = useState<Doctor[]>([])
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])

  // 模拟数据加载 - 这里将来替换为API调用
  useEffect(() => {
    loadMockData()
  }, [])

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
        <Text preset="heading" style={$headerTitle}>
          Message
        </Text>
        <Pressable
          style={$menuButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Menu"
        >
          <Text style={$menuIcon}>☰</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={$searchContainer}>
        <TextField
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Enter search text"
          placeholderTextColor="#999"
          LeftAccessory={() => <Text style={$searchIcon}>🔍</Text>}
          containerStyle={$searchField}
          inputWrapperStyle={$searchInputWrapper}
          style={$searchInput}
        />
      </View>

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
      <View style={[$section, { flex: 1 }]}>
        <Text preset="subheading" style={$sectionTitle}>
          List
        </Text>
        <FlatList
          data={recentContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={$contactsContainer}
        />
      </View>
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
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
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

const $menuButton: ViewStyle = {
  padding: 8,
  borderRadius: 20,
}

const $menuIcon: TextStyle = {
  fontSize: 20,
  color: "#666",
}

const $searchContainer: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 12,
}

const $searchField: ViewStyle = {
  backgroundColor: "#F5F5F5",
  borderRadius: 12,
  borderWidth: 0,
}

const $searchInputWrapper: ViewStyle = {
  paddingVertical: 12,
  paddingHorizontal: 16,
}

const $searchInput: TextStyle = {
  fontSize: 16,
  color: "#333",
  marginLeft: 8,
}

const $searchIcon: TextStyle = {
  fontSize: 16,
  color: "#999",
}

const $section: ViewStyle = {
  paddingHorizontal: 16,
  marginBottom: 20,
}

const $sectionHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
}

const $sectionTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
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
  marginRight: 20,
  width: 80,
}

const $doctorImageContainer: ViewStyle = {
  position: "relative",
  marginBottom: 8,
}

const $doctorImage: ImageStyle = {
  width: 64,
  height: 64,
  borderRadius: 32,
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
  fontSize: 14,
  fontWeight: "500",
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
