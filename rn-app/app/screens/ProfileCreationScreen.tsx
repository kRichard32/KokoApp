// app/screens/ProfileCreationScreen.tsx
import { FC, useState } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  ScrollView,
  Alert,
} from "react-native"
import axios from "axios"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

interface ProfileCreationScreenProps extends AppStackScreenProps<"ProfileCreation"> {}

interface Trait {
  id: string
  label: string
  emoji: string
}

const AVAILABLE_TRAITS: Trait[] = [
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "active", label: "Active", emoji: "🏃‍♂️" },
  { id: "thoughtful", label: "Thoughtful", emoji: "🤔" },
  { id: "funny", label: "Funny", emoji: "😄" },
  { id: "caring", label: "Caring", emoji: "❤️" },
  { id: "curious", label: "Curious", emoji: "🔍" },
  { id: "patient", label: "Patient", emoji: "🧘‍♀️" },
  { id: "optimistic", label: "Optimistic", emoji: "🌟" },
  { id: "helpful", label: "Helpful", emoji: "🤝" },
  { id: "independent", label: "Independent", emoji: "💪" },
  { id: "social", label: "Social", emoji: "👥" },
]

export const ProfileCreationScreen: FC<ProfileCreationScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleTrait = (traitId: string) => {
    setSelectedTraits(prev => 
      prev.includes(traitId) 
        ? prev.filter(id => id !== traitId)
        : [...prev, traitId]
    )
  }

  const handleSubmit = async () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert("Error", "Please enter your first name")
      return
    }
    if (!lastName.trim()) {
      Alert.alert("Error", "Please enter your last name")
      return
    }
    if (selectedTraits.length === 0) {
      Alert.alert("Error", "Please select at least one trait")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await axios.post(`${serverUrl}/api/profile/create`, {
        name: firstName.trim() + " " + lastName.trim(),
        jsonTraits: JSON.stringify(selectedTraits),
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Profile created successfully:', response.data)
      Alert.alert(
        "Success", 
        "Your profile has been created!", 
        [
          {
            text: "OK",
            onPress: () => navigation.navigate('Home' as never)
          }
        ]
      )
    } catch (error: any) {
      console.error('Error creating profile:', error)
      const errorMessage = error.response?.data?.message || "Failed to create profile. Please try again."
      Alert.alert("Error", errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTrait = (trait: Trait) => {
    const isSelected = selectedTraits.includes(trait.id)
    return (
      <Pressable
        key={trait.id}
        style={[
          $traitButton,
          isSelected && $traitButtonSelected,
          { borderColor: isSelected ? colors.tint : colors.border }
        ]}
        onPress={() => toggleTrait(trait.id)}
        accessible
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={trait.label}
      >
        <Text style={$traitEmoji}>{trait.emoji}</Text>
        <Text 
          style={[
            $traitLabel,
            { color: isSelected ? colors.tint : colors.text }
          ]}
        >
          {trait.label}
        </Text>
        {isSelected && (
          <Text style={[$checkmark, { color: colors.tint }]}>✓</Text>
        )}
      </Pressable>
    )
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($container)}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={$header}>
          <Text preset="heading" style={themed($title)}>
            Create Your Profile
          </Text>
          <Text style={themed($subtitle)}>
            Tell us a bit about yourself to personalize your experience
          </Text>
        </View>

        {/* Name Fields */}
        <View style={$section}>
          <Text preset="subheading" style={themed($sectionTitle)}>
            Basic Information
          </Text>
          
          <TextField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            containerStyle={$fieldContainer}
            style={$textInput}
          />
          
          <TextField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            containerStyle={$fieldContainer}
            style={$textInput}
          />
        </View>

        {/* Traits Selection */}
        <View style={$section}>
          <Text preset="subheading" style={themed($sectionTitle)}>
            Your Traits
          </Text>
          <Text style={themed($sectionDescription)}>
            Select all that apply to you ({selectedTraits.length} selected)
          </Text>
          
          <View style={$traitsGrid}>
            {AVAILABLE_TRAITS.map(renderTrait)}
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            $submitButton,
            { 
              backgroundColor: colors.tint,
              opacity: isSubmitting ? 0.6 : 1 
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Create profile"
        >
          <Text style={$submitButtonText}>
            {isSubmitting ? "Creating Profile..." : "Create Profile"}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

/* ————————— Styles ————————— */

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
})

const $header: ViewStyle = {
  marginBottom: 32,
  alignItems: "center",
}

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  color: colors.textDim,
  fontSize: 16,
  lineHeight: 24,
})

const $section: ViewStyle = {
  marginBottom: 32,
}

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $sectionDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 14,
  marginBottom: spacing.md,
})

const $fieldContainer: ViewStyle = {
  marginBottom: 16,
}

const $textInput: TextStyle = {
  fontSize: 16,
}

const $traitsGrid: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
}

const $traitButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 20,
  borderWidth: 2,
  minWidth: "45%",
  marginBottom: 8,
}

const $traitButtonSelected: ViewStyle = {
  backgroundColor: "rgba(0, 122, 255, 0.1)",
}

const $traitEmoji: TextStyle = {
  fontSize: 20,
  marginRight: 8,
}

const $traitLabel: TextStyle = {
  fontSize: 16,
  fontWeight: "500",
  flex: 1,
}

const $checkmark: TextStyle = {
  fontSize: 18,
  fontWeight: "bold",
}

const $submitButton: ViewStyle = {
  paddingVertical: 16,
  paddingHorizontal: 32,
  borderRadius: 12,
  alignItems: "center",
  marginTop: 16,
  marginBottom: 32,
}

const $submitButtonText: TextStyle = {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "bold",
}
