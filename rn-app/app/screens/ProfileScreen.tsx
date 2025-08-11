// app/screens/ProfileScreen.tsx
import { FC, useState, useEffect } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  Alert,
} from "react-native"
import axios from "axios"
import * as ImagePicker from 'expo-image-picker'

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Button } from "@/components/Button"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useAuth } from "@/context/AuthContext"
import { SecureStorage } from "@/utils/secureStorage"

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL

interface ProfileScreenProps extends AppStackScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()
  
  const { logout, setAuthToken } = useAuth()
  
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchUserProfile()
    fetchProfilePicture()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/profile/getUserProfile`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.data) {
        setUserProfile(response.data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchProfilePicture = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/profile/getUserProfilePicture`, {
        withCredentials: true,
        responseType: 'arraybuffer', // Important for binary data
      })

      if (response.data && response.data.byteLength > 0) {
        // Convert byte array to base64
        const base64String = btoa(
          new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        
        // Create data URI
        const dataUri = `data:image/jpeg;base64,${base64String}`
        setProfilePictureUri(dataUri)
        console.log('Profile picture loaded successfully')
      } else {
        console.log('No profile picture found, using default avatar')
      }
    } catch (error: any) {
      // Don't treat missing profile picture as an error, just log it
      if (error.response?.status === 404) {
        console.log('No profile picture available, using default avatar')
      } else {
        console.log('Could not load profile picture, using default avatar:', error.message)
      }
      // Keep default profile picture - don't set profilePictureUri
    }
  }

  const handleUploadProfilePicture = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos to upload a profile picture.")
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
      Alert.alert("Error", "Failed to select image. Please try again.")
    }
  }

  const uploadProfilePicture = async (imageUri: string) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      
      // Add image file
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any)

      const response = await axios.post(`${serverUrl}/api/profile/addProfilePicture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      })

      console.log('Profile picture uploaded successfully:', response.data)
      setProfilePictureUri(imageUri)
      Alert.alert(
        "Success!",
        "Profile picture uploaded successfully!",
        [{ text: "OK" }]
      )
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      const errorMessage = error.response?.data?.message || "Failed to upload profile picture. Please try again."
      Alert.alert("Upload Error", errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      Alert.alert("Logged Out", "You have been successfully logged out.")
    } catch (error) {
      console.error('Logout error:', error)
      Alert.alert("Logout Error", "Failed to logout. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleClearAccessToken = async (event: any) => {
    try {
      // Clear access token from secure storage
      await SecureStorage.clearAccessToken()
      
      // Clear axios authorization header
      delete axios.defaults.headers.common['Authorization']
      
      // Clear any axios cookies/credentials by calling server logout
      try {
        await axios.post(`${serverUrl}/auth/logout`, {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        })
        console.log('Server session cleared via logout endpoint')
      } catch (logoutError) {
        console.log('Logout call failed, but continuing with token clearing:', logoutError)
      }
      event.preventDefault();
      setAuthToken(undefined)  // Clear the context state
      Alert.alert(
        "Access Token Cleared",
        "Access token cleared and server session invalidated. Refresh token is preserved. Try making an API call to test auto-refresh.",
        [{ text: "OK" }]
      )
      console.log('Access token cleared and server session invalidated, refresh token preserved')
    } catch (error) {
      console.error('Error clearing access token:', error)
      Alert.alert("Error", "Failed to clear access token. Please try again.")
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
          <Text style={$backButtonText}>← Back</Text>
        </Pressable>
        <Text preset="heading" style={$title}>Profile</Text>
      </View>

      {/* Profile Picture Section */}
      <View style={$profilePictureSection}>
        <View style={$profilePictureContainer}>
          <Image
            source={
              profilePictureUri
                ? { uri: profilePictureUri }
                : require("../../assets/images/avatar-placeholder.jpg")
            }
            style={$profilePicture}
            resizeMode="cover"
          />
        </View>
        
        <Button
          text={isUploading ? "Uploading..." : "Upload Profile Picture"}
          style={$uploadButton}
          textStyle={$uploadButtonText}
          onPress={handleUploadProfilePicture}
          disabled={isUploading}
        />
      </View>

      {/* User Info */}
      {userProfile && (
        <View style={$userInfoSection}>
          <Text preset="subheading" style={$userName}>
            {userProfile.name || "Unknown User"}
          </Text>
          {userProfile.email && (
            <Text style={$userEmail}>{userProfile.email}</Text>
          )}
        </View>
      )}

      {/* Logout Button */}
      <View style={$logoutSection}>
        <Button
          text="Clear Access Token (Test)"
          style={$testButton}
          textStyle={$testButtonText}
          onPress={handleClearAccessToken}
        />
        
        <Button
          text="Logout"
          style={$logoutButton}
          textStyle={$logoutButtonText}
          onPress={handleLogout}
        />
      </View>
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
  marginBottom: 32,
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
  marginRight: 48, // Offset for back button
}

const $profilePictureSection: ViewStyle = {
  alignItems: "center",
  marginBottom: 32,
}

const $profilePictureContainer: ViewStyle = {
  marginBottom: 24,
}

const $profilePicture: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  borderWidth: 3,
  borderColor: "#E5E5E5",
}

const $uploadButton: ViewStyle = {
  backgroundColor: "#007AFF",
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
}

const $uploadButtonText: TextStyle = {
  color: "white",
  fontWeight: "600",
}

const $userInfoSection: ViewStyle = {
  alignItems: "center",
  marginBottom: 40,
}

const $userName: TextStyle = {
  marginBottom: 8,
  textAlign: "center",
}

const $userEmail: TextStyle = {
  fontSize: 16,
  color: "#666",
  textAlign: "center",
}

const $logoutSection: ViewStyle = {
  marginTop: "auto",
  paddingBottom: 32,
  gap: 16,
}

const $testButton: ViewStyle = {
  backgroundColor: "#FF9500",
  paddingVertical: 16,
  borderRadius: 8,
}

const $testButtonText: TextStyle = {
  color: "white",
  fontWeight: "600",
  textAlign: "center",
}

const $logoutButton: ViewStyle = {
  backgroundColor: "#FF3B30",
  paddingVertical: 16,
  borderRadius: 8,
}

const $logoutButtonText: TextStyle = {
  color: "white",
  fontWeight: "600",
  textAlign: "center",
}
