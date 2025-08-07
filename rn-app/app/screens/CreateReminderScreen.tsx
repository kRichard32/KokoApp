// app/screens/CreateReminderScreen.tsx
import { FC, useState } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  ScrollView,
  Alert,
  Platform,
} from "react-native"
import axios from "axios"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL

// Enums based on backend specification
export enum ReminderType {
  PERSONAL = "PERSONAL",
  EVENT_RELATED = "EVENT_RELATED",
  APPOINTMENT = "APPOINTMENT",
  DEADLINE = "DEADLINE",
  BIRTHDAY = "BIRTHDAY",
  ANNIVERSARY = "ANNIVERSARY",
  MEDICATION = "MEDICATION",
  MEETING = "MEETING",
  OTHER = "OTHER"
}

export enum ReminderPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export enum RecurrenceType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM"
}

// Form data interface
interface ReminderFormData {
  title: string
  description: string
  reminderDate: Date
  type: ReminderType
  priority: ReminderPriority
  isRecurring: boolean
  recurrenceType: RecurrenceType
  location: string
}

interface CreateReminderScreenProps extends AppStackScreenProps<"CreateReminder"> {}

export const CreateReminderScreen: FC<CreateReminderScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  // Initialize date and time inputs with tomorrow's date/time
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Form state
  const [formData, setFormData] = useState<ReminderFormData>({
    title: "",
    description: "",
    reminderDate: tomorrow,
    type: ReminderType.PERSONAL,
    priority: ReminderPriority.MEDIUM,
    isRecurring: false,
    recurrenceType: RecurrenceType.DAILY,
    location: ""
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [dateInput, setDateInput] = useState(
    `${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}/${tomorrow.getDate().toString().padStart(2, '0')}/${tomorrow.getFullYear()}`
  )
  const [timeInput, setTimeInput] = useState(
    tomorrow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  )

  // Reminder type options with icons and colors
  const reminderTypeOptions = [
    { key: ReminderType.PERSONAL, label: "Personal", icon: "👤", color: "#E3F2FD" },
    { key: ReminderType.EVENT_RELATED, label: "Event Related", icon: "🎉", color: "#E8F5E8" },
    { key: ReminderType.APPOINTMENT, label: "Appointment", icon: "📅", color: "#FFF3E0" },
    { key: ReminderType.DEADLINE, label: "Deadline", icon: "⏰", color: "#FFEBEE" },
    { key: ReminderType.BIRTHDAY, label: "Birthday", icon: "🎂", color: "#F3E5F5" },
    { key: ReminderType.ANNIVERSARY, label: "Anniversary", icon: "💕", color: "#FCE4EC" },
    { key: ReminderType.MEDICATION, label: "Medication", icon: "💊", color: "#E8F5E8" },
    { key: ReminderType.MEETING, label: "Meeting", icon: "🤝", color: "#E3F2FD" },
    { key: ReminderType.OTHER, label: "Other", icon: "📝", color: "#F5F5F5" }
  ]

  // Priority options with colors
  const priorityOptions = [
    { key: ReminderPriority.LOW, label: "Low", color: "#E8F5E8", textColor: "#4CAF50" },
    { key: ReminderPriority.MEDIUM, label: "Medium", color: "#FFF3E0", textColor: "#FF9800" },
    { key: ReminderPriority.HIGH, label: "High", color: "#FFEBEE", textColor: "#F44336" },
    { key: ReminderPriority.URGENT, label: "Urgent", color: "#F3E5F5", textColor: "#9C27B0" }
  ]

  // Recurrence options
  const recurrenceOptions = [
    { key: RecurrenceType.DAILY, label: "Daily", icon: "📅" },
    { key: RecurrenceType.WEEKLY, label: "Weekly", icon: "📆" },
    { key: RecurrenceType.MONTHLY, label: "Monthly", icon: "🗓️" },
    { key: RecurrenceType.YEARLY, label: "Yearly", icon: "📊" },
    { key: RecurrenceType.CUSTOM, label: "Custom", icon: "⚙️" }
  ]

  // Update form field
  const updateField = (field: keyof ReminderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle date/time input changes
  const handleDateInput = (dateStr: string) => {
    setDateInput(dateStr)
    // Parse date string in MM/DD/YYYY format
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num))
    if (month && day && year && month <= 12 && day <= 31 && year >= new Date().getFullYear()) {
      const newDate = new Date(year, month - 1, day, formData.reminderDate.getHours(), formData.reminderDate.getMinutes())
      updateField('reminderDate', newDate)
    }
  }

  const handleTimeInput = (timeStr: string) => {
    setTimeInput(timeStr)
    // Parse time string in HH:MM format (24-hour) or HH:MM AM/PM format
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
    const match = timeStr.match(timeRegex)
    
    if (match) {
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const meridian = match[3]
      
      if (meridian) {
        if (meridian.toUpperCase() === 'PM' && hours !== 12) hours += 12
        if (meridian.toUpperCase() === 'AM' && hours === 12) hours = 0
      }
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const newDate = new Date(formData.reminderDate)
        newDate.setHours(hours, minutes, 0, 0)
        updateField('reminderDate', newDate)
      }
    }
  }

  // Format date and time for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert("Validation Error", "Please enter a title for your reminder.")
      return false
    }
    if (!formData.description.trim()) {
      Alert.alert("Validation Error", "Please enter a description for your reminder.")
      return false
    }
    if (formData.reminderDate <= new Date()) {
      Alert.alert("Validation Error", "Please select a future date and time for your reminder.")
      return false
    }
    return true
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Convert to timestamp for backend
      const reminderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        reminderDate: formData.reminderDate.getTime(), // Convert to timestamp
        type: formData.type,
        priority: formData.priority,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.recurrenceType,
        location: formData.location.trim()
      }

      console.log('Creating reminder with data:', reminderData)
      console.log('Calling API endpoint:', `${serverUrl}/api/reminders/create`)
      
      const response = await axios.post(`${serverUrl}/api/reminders/create`, reminderData, {
        withCredentials: true,
        headers: { 
          'Content-Type': 'application/json' 
        }
      })

      console.log('Reminder creation response:', response.data)

      Alert.alert(
        "Success! ✅",
        "Your reminder has been created successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error: any) {
      console.error('Error creating reminder:', error)
      
      let errorMessage = "Failed to create reminder. Please try again."
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
    } finally {
      setIsLoading(false)
    }
  }

  // Render type selector
  const renderTypeSelector = () => (
    <View style={$sectionContainer}>
      <Text style={$sectionTitle}>Reminder Type</Text>
      <View style={$optionsGrid}>
        {reminderTypeOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[
              $optionButton,
              { backgroundColor: option.color },
              formData.type === option.key && $optionButtonSelected
            ]}
            onPress={() => updateField('type', option.key)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Select ${option.label} reminder type`}
          >
            <Text style={$optionIcon}>{option.icon}</Text>
            <Text style={[
              $optionText,
              formData.type === option.key && $optionTextSelected
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )

  // Render priority selector
  const renderPrioritySelector = () => (
    <View style={$sectionContainer}>
      <Text style={$sectionTitle}>Priority Level</Text>
      <View style={$priorityContainer}>
        {priorityOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[
              $priorityButton,
              { backgroundColor: option.color },
              formData.priority === option.key && $priorityButtonSelected
            ]}
            onPress={() => updateField('priority', option.key)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Set priority to ${option.label}`}
          >
            <Text style={[
              $priorityText,
              { color: option.textColor },
              formData.priority === option.key && $priorityTextSelected
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )

  // Render recurrence selector
  const renderRecurrenceSelector = () => (
    <View style={$sectionContainer}>
      <View style={$recurringHeader}>
        <Text style={$sectionTitle}>Recurring Reminder</Text>
        <Pressable
          style={[
            $toggleSwitch,
            formData.isRecurring ? $toggleSwitchOn : $toggleSwitchOff
          ]}
          onPress={() => updateField('isRecurring', !formData.isRecurring)}
          accessible
          accessibilityRole="switch"
          accessibilityState={{ checked: formData.isRecurring }}
        >
          <View style={[
            $toggleIndicator,
            formData.isRecurring ? $toggleIndicatorOn : $toggleIndicatorOff
          ]} />
        </Pressable>
      </View>

      {formData.isRecurring && (
        <View style={$recurrenceContainer}>
          {recurrenceOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[
                $recurrenceButton,
                formData.recurrenceType === option.key && $recurrenceButtonSelected
              ]}
              onPress={() => updateField('recurrenceType', option.key)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Set recurrence to ${option.label}`}
            >
              <Text style={$recurrenceIcon}>{option.icon}</Text>
              <Text style={[
                $recurrenceText,
                formData.recurrenceType === option.key && $recurrenceTextSelected
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
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
        
        <Text style={$headerTitle}>Create Reminder</Text>
        
        <View style={$headerSpacer} />
      </View>

      <ScrollView 
        style={$scrollContainer}
        contentContainerStyle={$scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={$sectionContainer}>
          <Text style={$sectionTitle}>Basic Information</Text>
          
          <TextField
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
            label="Title"
            placeholder="Enter reminder title..."
            containerStyle={$textFieldContainer}
          />

          <TextField
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            label="Description"
            placeholder="Enter description..."
            multiline
            numberOfLines={3}
            containerStyle={$textFieldContainer}
          />

          <TextField
            value={formData.location}
            onChangeText={(text) => updateField('location', text)}
            label="Location (Optional)"
            placeholder="Enter location..."
            containerStyle={$textFieldContainer}
          />
        </View>

        {/* Date and Time */}
        <View style={$sectionContainer}>
          <Text style={$sectionTitle}>Date & Time</Text>
          
          <TextField
            value={dateInput}
            onChangeText={handleDateInput}
            label="📅 Date"
            placeholder="MM/DD/YYYY (e.g., 08/15/2025)"
            containerStyle={$textFieldContainer}
          />

          <TextField
            value={timeInput}
            onChangeText={handleTimeInput}
            label="🕐 Time"
            placeholder="HH:MM AM/PM (e.g., 2:30 PM)"
            containerStyle={$textFieldContainer}
          />

          <View style={$currentDateTimeContainer}>
            <Text style={$currentDateTimeLabel}>Selected:</Text>
            <Text style={$currentDateTimeValue}>
              {formatDate(formData.reminderDate)} at {formatTime(formData.reminderDate)}
            </Text>
          </View>
        </View>

        {/* Type Selector */}
        {renderTypeSelector()}

        {/* Priority Selector */}
        {renderPrioritySelector()}

        {/* Recurrence Selector */}
        {renderRecurrenceSelector()}

        {/* Submit Button */}
        <Pressable
          style={[$submitButton, isLoading && $submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Create reminder"
        >
          <Text style={$submitButtonText}>
            {isLoading ? "Creating..." : "Create Reminder"}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

/* ————————— Styles ————————— */

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

const $headerSpacer: ViewStyle = {
  width: 48,
}

const $scrollContainer: ViewStyle = {
  flex: 1,
}

const $scrollContent: ViewStyle = {
  paddingHorizontal: 20,
  paddingBottom: 40,
}

const $sectionContainer: ViewStyle = {
  marginTop: 24,
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $sectionTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
  color: "#000",
  marginBottom: 16,
}

const $textFieldContainer: ViewStyle = {
  marginBottom: 16,
}

const $dateTimeContainer: ViewStyle = {
  flexDirection: "row",
  gap: 12,
}

const $dateTimeButton: ViewStyle = {
  flex: 1,
  backgroundColor: "#F8F9FA",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#E0E0E0",
}

const $dateTimeLabel: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#666",
  marginBottom: 4,
}

const $dateTimeValue: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#000",
}

const $currentDateTimeContainer: ViewStyle = {
  backgroundColor: "#F0F8FF",
  borderRadius: 12,
  padding: 16,
  marginTop: 12,
  borderWidth: 1,
  borderColor: "#E0E0E0",
}

const $currentDateTimeLabel: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#666",
  marginBottom: 4,
}

const $currentDateTimeValue: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  color: "#4CAF50",
}

const $optionsGrid: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
}

const $optionButton: ViewStyle = {
  width: "48%",
  padding: 16,
  borderRadius: 12,
  alignItems: "center",
  borderWidth: 2,
  borderColor: "transparent",
}

const $optionButtonSelected: ViewStyle = {
  borderColor: "#4CAF50",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $optionIcon: TextStyle = {
  fontSize: 24,
  marginBottom: 8,
}

const $optionText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#666",
  textAlign: "center",
}

const $optionTextSelected: TextStyle = {
  color: "#4CAF50",
  fontWeight: "700",
}

const $priorityContainer: ViewStyle = {
  flexDirection: "row",
  gap: 8,
}

const $priorityButton: ViewStyle = {
  flex: 1,
  padding: 16,
  borderRadius: 12,
  alignItems: "center",
  borderWidth: 2,
  borderColor: "transparent",
}

const $priorityButtonSelected: ViewStyle = {
  borderColor: "#4CAF50",
}

const $priorityText: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
}

const $priorityTextSelected: TextStyle = {
  color: "#4CAF50",
}

const $recurringHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
}

const $toggleSwitch: ViewStyle = {
  width: 60,
  height: 32,
  borderRadius: 16,
  padding: 2,
  justifyContent: "center",
}

const $toggleSwitchOn: ViewStyle = {
  backgroundColor: "#4CAF50",
  alignItems: "flex-end",
}

const $toggleSwitchOff: ViewStyle = {
  backgroundColor: "#CCC",
  alignItems: "flex-start",
}

const $toggleIndicator: ViewStyle = {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "#FFFFFF",
}

const $toggleIndicatorOn: ViewStyle = {
  backgroundColor: "#FFFFFF",
}

const $toggleIndicatorOff: ViewStyle = {
  backgroundColor: "#FFFFFF",
}

const $recurrenceContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
}

const $recurrenceButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F8F9FA",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 20,
  borderWidth: 2,
  borderColor: "transparent",
}

const $recurrenceButtonSelected: ViewStyle = {
  backgroundColor: "#E8F5E8",
  borderColor: "#4CAF50",
}

const $recurrenceIcon: TextStyle = {
  fontSize: 16,
  marginRight: 8,
}

const $recurrenceText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#666",
}

const $recurrenceTextSelected: TextStyle = {
  color: "#4CAF50",
  fontWeight: "700",
}

const $submitButton: ViewStyle = {
  backgroundColor: "#4CAF50",
  borderRadius: 16,
  paddingVertical: 18,
  alignItems: "center",
  marginTop: 32,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 4,
}

const $submitButtonDisabled: ViewStyle = {
  backgroundColor: "#CCC",
}

const $submitButtonText: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
  color: "#FFFFFF",
}
