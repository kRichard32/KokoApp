// app/screens/CreateEventScreen.tsx
import { FC, useState } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  ScrollView,
  Alert,
  Switch,
  Image,
  ImageStyle,
} from "react-native"
import axios from "axios"
import * as ImagePicker from "expo-image-picker"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Button } from "@/components/Button"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL

interface CreateEventScreenProps extends AppStackScreenProps<"CreateEvent"> {}

export const CreateEventScreen: FC<CreateEventScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    date: "",
    time: "",
    duration: "",
    location: "",
    maxParticipants: "",
    tags: "",
  })
  const [eventImage, setEventImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 活动分类选项
  const categories = [
    "Fishing",
    "Gardening", 
    "Reading",
    "Cooking",
    "Arts",
    "Music",
    "Sports",
    "Social",
    "Educational",
    "Other"
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "date") {
      // Format date as user types
      const formatted = formatDateInput(value as string)
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }))
    } else if (field === "time") {
      // Format time as user types
      const formatted = formatTimeInput(value as string)
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }))
    } else if (field === "maxParticipants") {
      // Only allow numbers for max participants
      const numbersOnly = (value as string).replace(/[^0-9]/g, '')
      setFormData(prev => ({
        ...prev,
        [field]: numbersOnly
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const formatDateInput = (input: string) => {
    // Remove all non-digit characters
    const numbers = input.replace(/\D/g, '')
    
    // Format as YYYY-MM-DD
    if (numbers.length <= 4) {
      return numbers
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`
    }
  }

  const formatTimeInput = (input: string) => {
    // Remove any characters that aren't digits, spaces, A, M, or P
    let cleaned = input.replace(/[^0-9\sAMPamp]/gi, '')
    
    // Convert to uppercase for consistency
    cleaned = cleaned.toUpperCase()
    
    // Extract numbers and AM/PM separately
    const numbers = cleaned.replace(/[^0-9]/g, '')
    const ampmMatch = cleaned.match(/[AP]M?/i)
    let ampm = ampmMatch ? ampmMatch[0].toUpperCase() : ''
    
    // If user typed just 'A' or 'P', append 'M'
    if (ampm === 'A') ampm = 'AM'
    if (ampm === 'P') ampm = 'PM'
    
    // Format based on number of digits
    if (numbers.length === 0) {
      return ampm ? ` ${ampm}` : ''
    } else if (numbers.length === 1) {
      const hour = parseInt(numbers)
      if (hour >= 1 && hour <= 9) {
        return ampm ? `${hour} ${ampm}` : numbers
      }
      return numbers
    } else if (numbers.length === 2) {
      const hour = parseInt(numbers)
      if (hour >= 1 && hour <= 12) {
        return ampm ? `${hour} ${ampm}` : numbers
      } else if (hour >= 13 && hour <= 23) {
        // Convert 24-hour to 12-hour
        const hour12 = hour > 12 ? hour - 12 : hour
        return `${hour12} PM`
      }
      return numbers
    } else if (numbers.length === 3) {
      const hour = parseInt(numbers.slice(0, 1))
      const minute = parseInt(numbers.slice(1, 3))
      if (hour >= 1 && hour <= 9 && minute <= 59) {
        return ampm ? `${hour}:${numbers.slice(1, 3)} ${ampm}` : `${hour}:${numbers.slice(1, 3)}`
      }
      return numbers.slice(0, 2)
    } else if (numbers.length >= 4) {
      const hour = parseInt(numbers.slice(0, 2))
      const minute = parseInt(numbers.slice(2, 4))
      
      if (hour >= 1 && hour <= 12 && minute <= 59) {
        const formattedMinute = numbers.slice(2, 4).padStart(2, '0')
        return ampm ? `${hour}:${formattedMinute} ${ampm}` : `${hour}:${formattedMinute}`
      } else if (hour >= 13 && hour <= 23 && minute <= 59) {
        // Convert 24-hour to 12-hour
        const hour12 = hour > 12 ? hour - 12 : hour
        const formattedMinute = numbers.slice(2, 4).padStart(2, '0')
        return `${hour12}:${formattedMinute} PM`
      } else if (hour === 0 && minute <= 59) {
        // Handle midnight case
        const formattedMinute = numbers.slice(2, 4).padStart(2, '0')
        return `12:${formattedMinute} AM`
      }
      // If invalid, return just valid portion
      return numbers.slice(0, 2)
    }
    
    return numbers
  }

  const validateDate = (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) return false
    
    const dateObj = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return dateObj >= today && !isNaN(dateObj.getTime())
  }

  const validateTime = (time: string): boolean => {
    const trimmed = time.trim()
    
    // Check for valid 12-hour format: H:MM AM/PM or HH:MM AM/PM
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i
    
    // Also allow format without minutes: H AM/PM or HH AM/PM  
    const hourOnlyRegex = /^(0?[1-9]|1[0-2])\s(AM|PM)$/i
    
    return timeRegex.test(trimmed) || hourOnlyRegex.test(trimmed)
  }

  const validateLocation = (location: string): boolean => {
    const trimmed = location.trim()
    return trimmed.length >= 3 && trimmed.length <= 200
  }

  const handleSelectEventImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission required", "We need permission to access your photo library.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Event images work well with this aspect ratio
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        setEventImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
      Alert.alert("Error", "Failed to select image. Please try again.")
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter an event title")
      return false
    }
    if (!formData.description.trim()) {
      Alert.alert("Error", "Please enter an event description")
      return false
    }
    if (!formData.date.trim()) {
      Alert.alert("Error", "Please enter an event date")
      return false
    }
    if (!validateDate(formData.date.trim())) {
      Alert.alert("Error", "Please enter a valid date (YYYY-MM-DD) that is today or in the future")
      return false
    }
    if (!formData.time.trim()) {
      Alert.alert("Error", "Please enter an event time")
      return false
    }
    if (!validateTime(formData.time.trim())) {
      Alert.alert("Error", "Please enter a valid time (e.g., 2:30 PM, 10 AM, 11:45 PM)")
      return false
    }
    if (!formData.location.trim()) {
      Alert.alert("Error", "Please enter an event location")
      return false
    }
    if (!validateLocation(formData.location.trim())) {
      Alert.alert("Error", "Location must be between 3 and 200 characters")
      return false
    }
    if (!formData.maxParticipants.trim() || isNaN(Number(formData.maxParticipants)) || Number(formData.maxParticipants) < 1) {
      Alert.alert("Error", "Please enter a valid maximum number of participants (at least 1)")
      return false
    }
    
    // Additional validation for timestamp conversion
    try {
      const [year, month, day] = formData.date.split('-').map(Number)
      const timeStr = formData.time.trim()
      const timeMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
      
      if (!timeMatch) {
        Alert.alert("Error", "Time format is invalid. Please use format like '2:30 PM' or '10 AM'")
        return false
      }
      
      const testDate = new Date(year, month - 1, day)
      if (isNaN(testDate.getTime())) {
        Alert.alert("Error", "Invalid date provided")
        return false
      }
    } catch (error) {
      Alert.alert("Error", "Date or time format is invalid")
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Convert date and time to timestamp
      // Parse the date (YYYY-MM-DD format)
      const [year, month, day] = formData.date.split('-').map(Number)
      
      // Parse the time (H:MM AM/PM or H AM/PM format)
      const timeStr = formData.time.trim()
      let hours = 0
      let minutes = 0
      
      const timeMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
      if (timeMatch) {
        hours = parseInt(timeMatch[1])
        minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
        const ampm = timeMatch[3].toUpperCase()
        
        // Convert to 24-hour format
        if (ampm === 'PM' && hours !== 12) {
          hours += 12
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0
        }
      }
      
      // Create timestamp in milliseconds
      const eventDate = new Date(year, month - 1, day, hours, minutes)
      const eventTimestamp = eventDate.getTime()
      
      // Determine event type based on location
      const isVirtual = formData.location.toLowerCase().includes('virtual') || 
                       formData.location.toLowerCase().includes('zoom') || 
                       formData.location.toLowerCase().includes('online') ||
                       formData.location.toLowerCase().includes('meet') ||
                       formData.location.toLowerCase().includes('teams')
      
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: formData.duration.trim() || "1 hour", // Default to 1 hour if not provided
        eventDate: eventTimestamp,
        location: formData.location.trim(),
        maxParticipants: parseInt(formData.maxParticipants),
        eventType: formData.category,
        status: "ACTIVE"
      }

      console.log('Creating event with data:', eventData)

      // Create the event first
      const response = await axios.post(`${serverUrl}/api/events/createEvent`, eventData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Event creation response:', response.data)

      if (response.status === 200 || response.status === 201) {
        const eventId = response.data.id
        
        // Upload image if one was selected
        if (eventImage && eventId) {
          try {
            console.log(`Uploading image for event ID: ${eventId}`)
            const imageFormData = new FormData()
            imageFormData.append('picture', {
              uri: eventImage,
              type: 'image/jpeg',
              name: 'event-image.jpg',
            } as any)

            const imageResponse = await axios.put(`${serverUrl}/api/events/${eventId}/setEventPicture`, imageFormData, {
              withCredentials: true,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            
            console.log('Image upload response:', imageResponse.data)
          } catch (imageError) {
            console.error('Error uploading event image:', imageError)
            // Continue even if image upload fails
          }
        }

        Alert.alert(
          "Success!",
          "Event created successfully!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack()
            }
          ]
        )
      }
    } catch (error: any) {
      console.error('Error creating event:', error)
      const errorMessage = error.response?.data?.message || "Failed to create event. Please try again."
      Alert.alert("Error", errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($container)}
    >
      {/* Header */}
      <View style={$header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={$backButton}
        >
          <Text style={$backButtonText}>← Cancel</Text>
        </Pressable>
        <Text preset="heading" style={$title}>Create Event</Text>
      </View>

      <ScrollView style={$form}>
        {/* Event Title */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Event Title *</Text>
          <TextField
            value={formData.title}
            onChangeText={(text) => handleInputChange("title", text)}
            placeholder="Enter event title"
            containerStyle={$textFieldContainer}
            inputWrapperStyle={$textFieldWrapper}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Event Description */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Description *</Text>
          <TextField
            value={formData.description}
            onChangeText={(text) => handleInputChange("description", text)}
            placeholder="Describe your event"
            multiline
            numberOfLines={4}
            containerStyle={$textFieldContainer}
            inputWrapperStyle={$textFieldWrapper}
            autoCapitalize="sentences"
            autoCorrect={true}
          />
        </View>

        {/* Category */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Category</Text>
          <View style={$categoryContainer}>
            {categories.map((category) => (
              <Pressable
                key={category}
                style={[
                  $categoryButton,
                  formData.category === category && $categoryButtonActive
                ]}
                onPress={() => handleInputChange("category", category)}
              >
                <Text style={[
                  $categoryText,
                  formData.category === category && $categoryTextActive
                ]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date and Time */}
        <View style={$rowContainer}>
          <View style={[$fieldGroup, $halfWidth]}>
            <Text style={$fieldLabel}>Date *</Text>
            <TextField
              value={formData.date}
              onChangeText={(text) => handleInputChange("date", text)}
              placeholder="2024-01-20"
              containerStyle={$textFieldContainer}
              inputWrapperStyle={$textFieldWrapper}
              maxLength={10}
              keyboardType="numeric"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <View style={[$fieldGroup, $halfWidth]}>
            <Text style={$fieldLabel}>Time *</Text>
            <TextField
              value={formData.time}
              onChangeText={(text) => handleInputChange("time", text)}
              placeholder="2:00 PM"
              containerStyle={$textFieldContainer}
              inputWrapperStyle={$textFieldWrapper}
              maxLength={10}
              autoCorrect={false}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Duration */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Duration</Text>
          <TextField
            value={formData.duration}
            onChangeText={(text) => handleInputChange("duration", text)}
            placeholder="e.g., 1 hour, 2.5 hours"
            containerStyle={$textFieldContainer}
            inputWrapperStyle={$textFieldWrapper}
            autoCorrect={false}
          />
        </View>

        {/* Event Image */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Event Image (optional)</Text>
          <Pressable
            onPress={handleSelectEventImage}
            style={$imageUploadButton}
          >
            {eventImage ? (
              <View style={$imagePreviewContainer}>
                <Image source={{ uri: eventImage }} style={$imagePreview} />
                <Text style={$changeImageText}>Tap to change image</Text>
              </View>
            ) : (
              <View style={$imageUploadPlaceholder}>
                <Text style={$imageUploadText}>📷 Add Event Image</Text>
                <Text style={$imageUploadSubtext}>Tap to select an image</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Location */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Location/Platform *</Text>
          <TextField
            value={formData.location}
            onChangeText={(text) => handleInputChange("location", text)}
            placeholder="e.g., 123 Main St, Zoom Meeting, Google Meet"
            containerStyle={$textFieldContainer}
            inputWrapperStyle={$textFieldWrapper}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Max Participants */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Maximum Participants *</Text>
          <TextField
            value={formData.maxParticipants}
            onChangeText={(text) => handleInputChange("maxParticipants", text)}
            placeholder="e.g., 20"
            keyboardType="numeric"
            containerStyle={$textFieldContainer}
            inputWrapperStyle={$textFieldWrapper}
            maxLength={4}
            autoCorrect={false}
          />
        </View>

        {/* Tags */}
        <View style={$fieldGroup}>
          <Text style={$fieldLabel}>Tags (comma separated)</Text>
          <TextField
            value={formData.tags}
            onChangeText={(text) => handleInputChange("tags", text)}
            placeholder="e.g., Relaxing, Social, Learning"
            containerStyle={$textFieldContainer}
            inputWrapperStyle={$textFieldWrapper}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Submit Button */}
        <Button
          text={isSubmitting ? "Creating Event..." : "Create Event"}
          style={$submitButton}
          textStyle={$submitButtonText}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </ScrollView>
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
})

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 24,
}

const $backButton: ViewStyle = {
  padding: 8,
  marginRight: 16,
}

const $backButtonText: TextStyle = {
  fontSize: 16,
  color: "#007AFF",
}

const $title: TextStyle = {
  flex: 1,
  textAlign: "center",
  marginRight: 48,
}

const $form: ViewStyle = {
  flex: 1,
}

const $fieldGroup: ViewStyle = {
  marginBottom: 20,
}

const $fieldLabel: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#374151",
  marginBottom: 8,
}

const $textFieldContainer: ViewStyle = {
  marginBottom: 0,
}

const $textFieldWrapper: ViewStyle = {
  borderWidth: 1,
  borderColor: "#D1D5DB",
  borderRadius: 8,
  backgroundColor: "#FFFFFF",
  minHeight: 48,
  paddingHorizontal: 12,
  paddingVertical: 0,
}

const $categoryContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
}

const $categoryButton: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "#D1D5DB",
  backgroundColor: "#FFFFFF",
}

const $categoryButtonActive: ViewStyle = {
  backgroundColor: "#4CAF50",
  borderColor: "#4CAF50",
}

const $categoryText: TextStyle = {
  fontSize: 14,
  color: "#374151",
  fontWeight: "500",
}

const $categoryTextActive: TextStyle = {
  color: "#FFFFFF",
}

const $rowContainer: ViewStyle = {
  flexDirection: "row",
  gap: 16,
}

const $halfWidth: ViewStyle = {
  flex: 1,
}

const $switchContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $submitButton: ViewStyle = {
  backgroundColor: "#4CAF50",
  paddingVertical: 16,
  borderRadius: 8,
  marginTop: 32,
  marginBottom: 32,
}

const $submitButtonText: TextStyle = {
  color: "white",
  fontWeight: "600",
  textAlign: "center",
  fontSize: 18,
}

const $imageUploadButton: ViewStyle = {
  borderWidth: 2,
  borderColor: "#D1D5DB",
  borderStyle: "dashed",
  borderRadius: 8,
  backgroundColor: "#F9FAFB",
  minHeight: 120,
}

const $imageUploadPlaceholder: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: 20,
}

const $imageUploadText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#374151",
  marginBottom: 4,
}

const $imageUploadSubtext: TextStyle = {
  fontSize: 14,
  color: "#6B7280",
}

const $imagePreviewContainer: ViewStyle = {
  alignItems: "center",
  padding: 8,
}

const $imagePreview: ImageStyle = {
  width: "100%",
  height: 160,
  borderRadius: 8,
  marginBottom: 8,
}

const $changeImageText: TextStyle = {
  fontSize: 14,
  color: "#374151",
  textAlign: "center",
}
