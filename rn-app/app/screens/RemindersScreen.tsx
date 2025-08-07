// app/screens/RemindersScreen.tsx
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

// 提醒数据类型 - 匹配后端结构
interface Reminder {
  id: string
  title: string
  description: string
  reminderDate: number // timestamp from backend
  type: string // Backend enum values
  priority: string // Backend enum values
  isRecurring: boolean
  recurrenceType: string // Backend enum values
  location: string
  status: string // Backend status (ACTIVE, COMPLETED, etc.)
  // Display properties (computed from backend data)
  time?: string
  nextReminder?: string
  icon?: string
  color?: string
  isActive?: boolean
}

interface RemindersScreenProps extends AppStackScreenProps<"Reminders"> {}

export const RemindersScreen: FC<RemindersScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [selectedTab, setSelectedTab] = useState<'all' | 'today' | 'active'>('today')
  const [isLoading, setIsLoading] = useState(false)

  // 提醒类型分类
  const reminderTypes = [
    { key: 'all', emoji: '📋', name: 'All', color: '#E3F2FD' },
    { key: 'today', emoji: '📅', name: 'Today', color: '#E8F5E8' },
    { key: 'active', emoji: '🔔', name: 'Active', color: '#FFF3E0' },
  ]

  // 加载提醒数据
  useEffect(() => {
    loadReminders()
  }, [])

  // 获取提醒图标和颜色
  const getReminderDisplayInfo = (type: string, priority: string) => {
    const typeIcons: { [key: string]: { icon: string; color: string } } = {
      'PERSONAL': { icon: '👤', color: '#E3F2FD' },
      'EVENT_RELATED': { icon: '🎉', color: '#E8F5E8' },
      'APPOINTMENT': { icon: '📅', color: '#FFF3E0' },
      'DEADLINE': { icon: '⏰', color: '#FFEBEE' },
      'BIRTHDAY': { icon: '🎂', color: '#F3E5F5' },
      'ANNIVERSARY': { icon: '💕', color: '#FCE4EC' },
      'MEDICATION': { icon: '💊', color: '#FFE8E8' },
      'MEETING': { icon: '🤝', color: '#E3F2FD' },
      'OTHER': { icon: '📝', color: '#F5F5F5' }
    }
    
    const defaultInfo = { icon: '📝', color: '#F5F5F5' }
    return typeIcons[type] || defaultInfo
  }

  // 格式化日期时间
  const formatReminderDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    if (reminderDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`
    } else if (reminderDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return `Tomorrow at ${timeStr}`
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      return `${dateStr} at ${timeStr}`
    }
  }

  const loadReminders = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching reminders from:', `${serverUrl}/api/reminders/all`)
      const response = await axios.get(`${serverUrl}/api/reminders/all`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Reminders response:', response.data)
      
      if (response.data && Array.isArray(response.data)) {
        // Transform API data to include display properties
        const transformedReminders = response.data.map((reminder: any) => {
          const displayInfo = getReminderDisplayInfo(reminder.type, reminder.priority)
          
          return {
            ...reminder,
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            reminderDate: reminder.reminderDate,
            type: reminder.type,
            priority: reminder.priority,
            isRecurring: reminder.isRecurring,
            recurrenceType: reminder.recurrenceType,
            location: reminder.location,
            // Display properties
            time: new Date(reminder.reminderDate).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            nextReminder: formatReminderDateTime(reminder.reminderDate),
            icon: displayInfo.icon,
            color: displayInfo.color,
            status: reminder.status,
            isActive: reminder.status !== 'COMPLETED' // Set inactive if status is COMPLETED
          }
        })
        setReminders(transformedReminders)
      } else {
        setReminders([])
      }
    } catch (error: any) {
      console.error('Error loading reminders:', error)
      Alert.alert(
        "Error",
        "Failed to load reminders. Please check your connection and try again.",
        [
          { text: "Retry", onPress: loadReminders },
          { text: "Cancel", style: "cancel" }
        ]
      )
    } finally {
      setIsLoading(false)
    }
  }

  // 过滤提醒
  const filteredReminders = () => {
    switch (selectedTab) {
      case 'today':
        return reminders.filter(r => r.nextReminder?.includes('Today'))
      case 'active':
        return reminders.filter(r => r.isActive)
      default:
        return reminders
    }
  }

  // 切换提醒状态
  const toggleReminder = (reminderId: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, isActive: !reminder.isActive }
        : reminder
    ))
  }

  // 标记为已完成
  const markAsCompleted = async (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId)
    if (!reminder) return

    try {
      console.log(`Marking reminder ${reminderId} as completed`)
      console.log('Calling API endpoint:', `${serverUrl}/api/reminders/${reminderId}/complete`)
      
      const response = await axios.put(`${serverUrl}/api/reminders/${reminderId}/complete`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Reminder completion response:', response.data)

      Alert.alert(
        "Reminder Completed! ✓",
        `Great job completing: ${reminder.title}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Refresh the reminders list to get updated data
              loadReminders()
            },
            style: "default"
          }
        ]
      )
    } catch (error: any) {
      console.error('Error completing reminder:', error)
      
      let errorMessage = "Failed to mark reminder as complete. Please try again."
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      Alert.alert(
        "Error",
        errorMessage,
        [{ text: "OK" }]
      )
    }
  }

  // 渲染标签按钮
  const renderTab = (tab: typeof reminderTypes[0]) => (
    <Pressable
      key={tab.key}
      style={[
        $tabButton,
        { backgroundColor: tab.color },
        selectedTab === tab.key && $tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab.key as any)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`View ${tab.name} reminders`}
    >
      <Text style={$tabEmoji}>{tab.emoji}</Text>
      <Text style={[
        $tabText,
        selectedTab === tab.key && $tabTextActive
      ]}>
        {tab.name}
      </Text>
    </Pressable>
  )

  // 渲染提醒卡片
  const renderReminder: ListRenderItem<Reminder> = ({ item }) => (
    <View style={[
      $reminderCard, 
      { backgroundColor: item.color },
      item.status === 'COMPLETED' && $reminderCardCompleted
    ]}>
      {/* 提醒头部 */}
      <View style={$reminderHeader}>
        <View style={$reminderTitleRow}>
          <Text style={$reminderIcon}>{item.icon}</Text>
          <View style={$reminderTitleContainer}>
            <View style={$titleWithStatus}>
              <Text style={[
                $reminderTitle,
                item.status === 'COMPLETED' && $reminderTitleCompleted
              ]}>{item.title}</Text>
              {item.status === 'COMPLETED' && (
                <View style={$completedBadge}>
                  <Text style={$completedBadgeText}>✓ COMPLETED</Text>
                </View>
              )}
            </View>
            <Text style={[
              $reminderTime,
              item.status === 'COMPLETED' && $reminderTimeCompleted
            ]}>⏰ {item.nextReminder}</Text>
          </View>
          {/* 开关按钮 */}
          <Pressable
            style={[
              $toggleButton,
              item.isActive ? $toggleButtonOn : $toggleButtonOff
            ]}
            onPress={() => toggleReminder(item.id)}
            accessible
            accessibilityRole="switch"
            accessibilityState={{ checked: item.isActive }}
            accessibilityLabel={`${item.isActive ? 'Disable' : 'Enable'} reminder`}
          >
            <View style={[
              $toggleIndicator,
              item.isActive ? $toggleIndicatorOn : $toggleIndicatorOff
            ]} />
          </Pressable>
        </View>
      </View>

      {/* 提醒内容 */}
      <Text style={$reminderDescription}>{item.description}</Text>

      {/* 位置信息（如果有） */}
      {item.location && (
        <View style={$locationContainer}>
          <Text style={$locationLabel}>📍 Location:</Text>
          <Text style={$locationText}>{item.location}</Text>
        </View>
      )}

      {/* 重复信息（如果有） */}
      {item.isRecurring && item.recurrenceType && (
        <View style={$recurrenceContainer}>
          <Text style={$recurrenceLabel}>🔄 Recurring:</Text>
          <View style={$recurrenceBadge}>
            <Text style={$recurrenceText}>
              {item.recurrenceType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>
      )}

      {/* 优先级指示器 */}
      <View style={$priorityContainer}>
        <Text style={$priorityLabel}>Priority:</Text>
        <View style={[
          $priorityBadge,
          item.priority === 'URGENT' && { backgroundColor: '#F3E5F5' },
          item.priority === 'HIGH' && { backgroundColor: '#FFEBEE' },
          item.priority === 'MEDIUM' && { backgroundColor: '#FFF3E0' },
          item.priority === 'LOW' && { backgroundColor: '#E8F5E8' }
        ]}>
          <Text style={[
            $priorityText,
            item.priority === 'URGENT' && { color: '#9C27B0' },
            item.priority === 'HIGH' && { color: '#F44336' },
            item.priority === 'MEDIUM' && { color: '#FF9800' },
            item.priority === 'LOW' && { color: '#4CAF50' }
          ]}>
            {item.priority}
          </Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={$reminderActions}>
        <Pressable
          style={[
            $actionButton, 
            $completeButton,
            item.status === 'COMPLETED' && $completeButtonDisabled
          ]}
          onPress={() => markAsCompleted(item.id)}
          disabled={item.status === 'COMPLETED'}
          accessible
          accessibilityRole="button"
          accessibilityLabel={item.status === 'COMPLETED' ? "Already completed" : "Mark as completed"}
        >
          <Text style={[
            $completeButtonText,
            item.status === 'COMPLETED' && $completeButtonTextDisabled
          ]}>
            {item.status === 'COMPLETED' ? "✓ Completed" : "✓ Mark Done"}
          </Text>
        </Pressable>

        <Pressable
          style={[
            $actionButton, 
            $snoozeButton,
            item.status === 'COMPLETED' && $snoozeButtonDisabled
          ]}
          onPress={() => Alert.alert("Snoozed", "Reminder snoozed for 15 minutes")}
          disabled={item.status === 'COMPLETED'}
          accessible
          accessibilityRole="button"
          accessibilityLabel={item.status === 'COMPLETED' ? "Cannot snooze completed reminder" : "Snooze reminder"}
        >
          <Text style={[
            $snoozeButtonText,
            item.status === 'COMPLETED' && $snoozeButtonTextDisabled
          ]}>⏰ Snooze 15min</Text>
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
        
        <Text style={$headerTitle}>My Reminders</Text>
        
        <Pressable
          style={$addButton}
          onPress={() => navigation.navigate("CreateReminder")}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Add new reminder"
        >
          <Text style={$addIcon}>+</Text>
        </Pressable>
      </View>

      {/* 快速统计 */}
      <View style={$statsContainer}>
        <View style={$statCard}>
          <Text style={$statNumber}>{reminders.filter(r => r.isActive && r.nextReminder?.includes('Today')).length}</Text>
          <Text style={$statLabel}>Today's Reminders</Text>
        </View>
        <View style={$statCard}>
          <Text style={$statNumber}>{reminders.filter(r => r.isActive).length}</Text>
          <Text style={$statLabel}>Active Reminders</Text>
        </View>
        <View style={$statCard}>
          <Text style={$statNumber}>{reminders.filter(r => r.type === 'MEDICATION').length}</Text>
          <Text style={$statLabel}>Medications</Text>
        </View>
      </View>

      {/* 标签选择 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={$tabsContainer}
        contentContainerStyle={$tabsContent}
      >
        {reminderTypes.map(renderTab)}
      </ScrollView>

      {/* 提醒列表 */}
      {isLoading ? (
        <View style={$loadingContainer}>
          <Text style={$loadingText}>Loading reminders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReminders()}
          renderItem={renderReminder}
          keyExtractor={(item) => item.id}
          style={$remindersList}
          contentContainerStyle={$remindersContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={$reminderSeparator} />}
          ListEmptyComponent={() => (
            <View style={$emptyContainer}>
              <Text style={$emptyIcon}>🎉</Text>
              <Text style={$emptyTitle}>All caught up!</Text>
              <Text style={$emptyText}>No reminders for this category.</Text>
            </View>
          )}
          refreshing={isLoading}
          onRefresh={loadReminders}
        />
      )}
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  backgroundColor: "#F8F9FA",
})

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 20,
  paddingVertical: 16,
  backgroundColor: "#FFFFFF",
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
}

const $backButton: ViewStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "#F5F5F5",
  justifyContent: "center",
  alignItems: "center",
}

const $backIcon: TextStyle = {
  fontSize: 24,
  color: "#666",
  fontWeight: "bold",
}

const $headerTitle: TextStyle = {
  fontSize: 24,
  fontWeight: "700",
  color: "#000",
}

const $addButton: ViewStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "#4CAF50",
  justifyContent: "center",
  alignItems: "center",
}

const $addIcon: TextStyle = {
  fontSize: 28,
  color: "#FFFFFF",
  fontWeight: "bold",
}

const $statsContainer: ViewStyle = {
  flexDirection: "row",
  paddingHorizontal: 20,
  paddingVertical: 16,
  gap: 12,
}

const $statCard: ViewStyle = {
  flex: 1,
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 16,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $statNumber: TextStyle = {
  fontSize: 28,
  fontWeight: "800",
  color: "#4CAF50",
  marginBottom: 4,
}

const $statLabel: TextStyle = {
  fontSize: 14,
  color: "#666",
  textAlign: "center",
  fontWeight: "600",
}

const $tabsContainer: ViewStyle = {
  maxHeight: 80,
  marginBottom: 16,
}

const $tabsContent: ViewStyle = {
  paddingHorizontal: 20,
  gap: 12,
}

const $tabButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingVertical: 14,
  borderRadius: 25,
  borderWidth: 3,
  borderColor: "transparent",
  minWidth: 120,
}

const $tabButtonActive: ViewStyle = {
  borderColor: "#4CAF50",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 4,
}

const $tabEmoji: TextStyle = {
  fontSize: 20,
  marginRight: 10,
}

const $tabText: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#666",
}

const $tabTextActive: TextStyle = {
  color: "#4CAF50",
}

const $remindersList: ViewStyle = {
  flex: 1,
}

const $remindersContent: ViewStyle = {
  paddingHorizontal: 20,
  paddingBottom: 20,
}

const $reminderSeparator: ViewStyle = {
  height: 16,
}

const $reminderCard: ViewStyle = {
  borderRadius: 20,
  padding: 20,
  borderWidth: 2,
  borderColor: "rgba(0,0,0,0.05)",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 4,
}

const $reminderCardCompleted: ViewStyle = {
  opacity: 0.7,
  borderColor: "#4CAF50",
  borderWidth: 2,
}

const $titleWithStatus: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 4,
}

const $completedBadge: ViewStyle = {
  backgroundColor: "#4CAF50",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  marginLeft: 8,
}

const $completedBadgeText: TextStyle = {
  fontSize: 12,
  fontWeight: "700",
  color: "#FFFFFF",
}

const $reminderHeader: ViewStyle = {
  marginBottom: 12,
}

const $reminderTitleRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
}

const $reminderIcon: TextStyle = {
  fontSize: 32,
  marginRight: 12,
}

const $reminderTitleContainer: ViewStyle = {
  flex: 1,
}

const $reminderTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
  color: "#000",
  marginBottom: 4,
  lineHeight: 26,
}

const $reminderTitleCompleted: TextStyle = {
  textDecorationLine: "line-through",
  color: "#666",
}

const $reminderTime: TextStyle = {
  fontSize: 16,
  color: "#666",
  fontWeight: "600",
}

const $reminderTimeCompleted: TextStyle = {
  color: "#999",
  fontStyle: "italic",
}

const $toggleButton: ViewStyle = {
  width: 60,
  height: 32,
  borderRadius: 16,
  padding: 2,
  justifyContent: "center",
}

const $toggleButtonOn: ViewStyle = {
  backgroundColor: "#4CAF50",
  alignItems: "flex-end",
}

const $toggleButtonOff: ViewStyle = {
  backgroundColor: "#CCC",
  alignItems: "flex-start",
}

const $toggleIndicator: ViewStyle = {
  width: 28,
  height: 28,
  borderRadius: 14,
}

const $toggleIndicatorOn: ViewStyle = {
  backgroundColor: "#FFFFFF",
}

const $toggleIndicatorOff: ViewStyle = {
  backgroundColor: "#FFFFFF",
}

const $reminderDescription: TextStyle = {
  fontSize: 16,
  color: "#444",
  lineHeight: 22,
  marginBottom: 12,
}

const $locationContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
  padding: 12,
  backgroundColor: "rgba(255,255,255,0.7)",
  borderRadius: 12,
}

const $locationLabel: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#333",
  marginRight: 8,
}

const $locationText: TextStyle = {
  fontSize: 16,
  color: "#666",
  fontWeight: "600",
  flex: 1,
}

const $recurrenceContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
  padding: 12,
  backgroundColor: "rgba(255,255,255,0.7)",
  borderRadius: 12,
}

const $recurrenceLabel: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#333",
  marginRight: 8,
}

const $recurrenceBadge: ViewStyle = {
  backgroundColor: "#E3F2FD",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#2196F3",
}

const $recurrenceText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#2196F3",
}

const $priorityContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16,
}

const $priorityLabel: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#333",
  marginRight: 12,
}

const $priorityBadge: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
}

const $priorityText: TextStyle = {
  fontSize: 14,
  fontWeight: "700",
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

const $reminderActions: ViewStyle = {
  flexDirection: "row",
  gap: 12,
}

const $actionButton: ViewStyle = {
  flex: 1,
  paddingVertical: 16,
  borderRadius: 16,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $completeButton: ViewStyle = {
  backgroundColor: "#4CAF50",
}

const $completeButtonDisabled: ViewStyle = {
  backgroundColor: "#CCC",
}

const $completeButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#FFFFFF",
}

const $completeButtonTextDisabled: TextStyle = {
  color: "#999",
}

const $snoozeButton: ViewStyle = {
  backgroundColor: "#FF9800",
}

const $snoozeButtonDisabled: ViewStyle = {
  backgroundColor: "#CCC",
}

const $snoozeButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#FFFFFF",
}

const $snoozeButtonTextDisabled: TextStyle = {
  color: "#999",
}

const $emptyContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: 60,
}

const $emptyIcon: TextStyle = {
  fontSize: 64,
  marginBottom: 16,
}

const $emptyTitle: TextStyle = {
  fontSize: 24,
  fontWeight: "700",
  color: "#333",
  marginBottom: 8,
}

const $emptyText: TextStyle = {
  fontSize: 16,
  color: "#666",
  textAlign: "center",
}
