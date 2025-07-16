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

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// 提醒数据类型
interface Reminder {
  id: string
  title: string
  description: string
  type: 'medication' | 'water' | 'exercise' | 'meal' | 'appointment' | 'other'
  time: string
  frequency: 'daily' | 'weekly' | 'as-needed'
  isActive: boolean
  nextReminder: string
  icon: string
  color: string
  dosage?: string // 药物剂量
  notes?: string
}

interface RemindersScreenProps extends AppStackScreenProps<"Reminders"> {}

export const RemindersScreen: FC<RemindersScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [selectedTab, setSelectedTab] = useState<'all' | 'today' | 'active'>('today')

  // 提醒类型分类
  const reminderTypes = [
    { key: 'all', emoji: '📋', name: 'All', color: '#E3F2FD' },
    { key: 'today', emoji: '📅', name: 'Today', color: '#E8F5E8' },
    { key: 'active', emoji: '🔔', name: 'Active', color: '#FFF3E0' },
  ]

  // 模拟数据加载
  useEffect(() => {
    loadMockReminders()
  }, [])

  const loadMockReminders = () => {
    const mockReminders: Reminder[] = [
      {
        id: "1",
        title: "Take Blood Pressure Medicine",
        description: "Take your daily blood pressure medication with water",
        type: "medication",
        time: "8:00 AM",
        frequency: "daily",
        isActive: true,
        nextReminder: "Today at 8:00 AM",
        icon: "💊",
        color: "#FFE8E8",
        dosage: "1 tablet",
        notes: "Take with food to avoid stomach upset"
      },
      {
        id: "2",
        title: "Drink Water",
        description: "Stay hydrated! Time for your regular water intake",
        type: "water",
        time: "10:00 AM",
        frequency: "daily",
        isActive: true,
        nextReminder: "Today at 10:00 AM",
        icon: "💧",
        color: "#E3F2FD",
        notes: "Aim for 8 glasses throughout the day"
      },
      {
        id: "3",
        title: "Take Vitamin D",
        description: "Daily vitamin D supplement for bone health",
        type: "medication",
        time: "12:00 PM",
        frequency: "daily",
        isActive: true,
        nextReminder: "Today at 12:00 PM",
        icon: "🌞",
        color: "#FFF9C4",
        dosage: "1000 IU",
        notes: "Best taken with lunch"
      },
      {
        id: "4",
        title: "Afternoon Walk",
        description: "Light exercise - 15 minute walk around the neighborhood",
        type: "exercise",
        time: "2:00 PM",
        frequency: "daily",
        isActive: true,
        nextReminder: "Today at 2:00 PM",
        icon: "🚶‍♀️",
        color: "#E8F5E8",
        notes: "Weather permitting. Great for circulation!"
      },
      {
        id: "5",
        title: "Evening Medicine",
        description: "Take your evening medications before dinner",
        type: "medication",
        time: "6:00 PM",
        frequency: "daily",
        isActive: true,
        nextReminder: "Today at 6:00 PM",
        icon: "💊",
        color: "#FFE8E8",
        dosage: "2 tablets",
        notes: "Cholesterol medication - take 30 min before eating"
      },
      {
        id: "6",
        title: "Doctor Appointment",
        description: "Monthly check-up with Dr. Smith",
        type: "appointment",
        time: "10:00 AM",
        frequency: "weekly",
        isActive: true,
        nextReminder: "Tomorrow at 10:00 AM",
        icon: "👩‍⚕️",
        color: "#F3E5F5",
        notes: "Bring medication list and insurance card"
      },
      {
        id: "7",
        title: "Bedtime Water",
        description: "Final glass of water before bed",
        type: "water",
        time: "9:00 PM",
        frequency: "daily",
        isActive: false,
        nextReminder: "Today at 9:00 PM",
        icon: "💧",
        color: "#E3F2FD",
        notes: "Not too much to avoid night-time wake-ups"
      }
    ]

    setReminders(mockReminders)
  }

  // 过滤提醒
  const filteredReminders = () => {
    switch (selectedTab) {
      case 'today':
        return reminders.filter(r => r.nextReminder.includes('Today'))
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
  const markAsCompleted = (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId)
    Alert.alert(
      "Reminder Completed! ✓",
      `Great job completing: ${reminder?.title}`,
      [
        {
          text: "OK",
          style: "default"
        }
      ]
    )
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
    <View style={[$reminderCard, { backgroundColor: item.color }]}>
      {/* 提醒头部 */}
      <View style={$reminderHeader}>
        <View style={$reminderTitleRow}>
          <Text style={$reminderIcon}>{item.icon}</Text>
          <View style={$reminderTitleContainer}>
            <Text style={$reminderTitle}>{item.title}</Text>
            <Text style={$reminderTime}>⏰ {item.nextReminder}</Text>
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

      {/* 剂量信息（如果是药物） */}
      {item.dosage && (
        <View style={$dosageContainer}>
          <Text style={$dosageLabel}>Dosage:</Text>
          <Text style={$dosageText}>{item.dosage}</Text>
        </View>
      )}

      {/* 备注 */}
      {item.notes && (
        <View style={$notesContainer}>
          <Text style={$notesText}>💡 {item.notes}</Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={$reminderActions}>
        <Pressable
          style={[$actionButton, $completeButton]}
          onPress={() => markAsCompleted(item.id)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Mark as completed"
        >
          <Text style={$completeButtonText}>✓ Mark Done</Text>
        </Pressable>

        <Pressable
          style={[$actionButton, $snoozeButton]}
          onPress={() => Alert.alert("Snoozed", "Reminder snoozed for 15 minutes")}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Snooze reminder"
        >
          <Text style={$snoozeButtonText}>⏰ Snooze 15min</Text>
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
          onPress={() => Alert.alert("Add Reminder", "Add new reminder feature coming soon!")}
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
          <Text style={$statNumber}>{reminders.filter(r => r.isActive && r.nextReminder.includes('Today')).length}</Text>
          <Text style={$statLabel}>Today's Reminders</Text>
        </View>
        <View style={$statCard}>
          <Text style={$statNumber}>{reminders.filter(r => r.isActive).length}</Text>
          <Text style={$statLabel}>Active Reminders</Text>
        </View>
        <View style={$statCard}>
          <Text style={$statNumber}>{reminders.filter(r => r.type === 'medication').length}</Text>
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
      />
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

const $reminderTime: TextStyle = {
  fontSize: 16,
  color: "#666",
  fontWeight: "600",
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

const $dosageContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
  padding: 12,
  backgroundColor: "rgba(255,255,255,0.7)",
  borderRadius: 12,
}

const $dosageLabel: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#333",
  marginRight: 8,
}

const $dosageText: TextStyle = {
  fontSize: 16,
  color: "#666",
  fontWeight: "600",
}

const $notesContainer: ViewStyle = {
  marginBottom: 16,
  padding: 12,
  backgroundColor: "rgba(255,255,255,0.7)",
  borderRadius: 12,
}

const $notesText: TextStyle = {
  fontSize: 14,
  color: "#666",
  fontStyle: "italic",
  lineHeight: 20,
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

const $completeButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#FFFFFF",
}

const $snoozeButton: ViewStyle = {
  backgroundColor: "#FF9800",
}

const $snoozeButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#FFFFFF",
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
