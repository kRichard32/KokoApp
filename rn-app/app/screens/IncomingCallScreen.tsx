import { FC, useState, useEffect } from "react"
import { View, Text, Pressable, Image, Vibration, ViewStyle, TextStyle, ImageStyle } from "react-native"
import { Audio } from 'expo-av'
import type { AppStackScreenProps } from "@/navigators/AppNavigator"

interface IncomingCallScreenProps extends AppStackScreenProps<"IncomingCall"> {}

export const IncomingCallScreen: FC<IncomingCallScreenProps> = ({ navigation, route }) => {
  const { callerName, callerAvatar, conversationId } = route.params
  const [sound, setSound] = useState<Audio.Sound>()

  useEffect(() => {
    // Play ringtone
    playRingtone()
    
    // Start vibration pattern
    const vibrationPattern = [1000, 1000, 1000, 1000]
    Vibration.vibrate(vibrationPattern, true)

    return () => {
      // Cleanup
      sound?.unloadAsync()
      Vibration.cancel()
    }
  }, [])

  const playRingtone = async () => {
    try {
      const { sound: ringtone } = await Audio.Sound.createAsync(
        require('../../assets/sounds/call-ring.wav'),
        { isLooping: true, shouldPlay: true, volume: 1.0 }
      )
      setSound(ringtone)
    } catch (error) {
      console.error('Error playing ringtone:', error)
    }
  }

  const acceptCall = async () => {
    // Stop ringtone and vibration
    await sound?.unloadAsync()
    Vibration.cancel()

    // Navigate to video call as receiver
    navigation.replace("VideoCall", {
      conversationId,
      isInitiator: false
    })
  }

  const declineCall = async () => {
    // Stop ringtone and vibration
    await sound?.unloadAsync()
    Vibration.cancel()

    // Send decline signal to backend
    try {
      const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL
      await fetch(`${serverUrl}/api/calls/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId }),
      })
    } catch (error) {
      console.error('Error declining call:', error)
    }

    // Go back
    navigation.goBack()
  }

  return (
    <View style={$container}>
      <View style={$callerInfo}>
        <Image 
          source={callerAvatar ? { uri: callerAvatar } : require('../../assets/images/avatar-placeholder.jpg')}
          style={$callerAvatar}
        />
        <Text style={$callerName}>{callerName}</Text>
        <Text style={$callLabel}>Incoming video call...</Text>
      </View>

      <View style={$controls}>
        <Pressable style={[$callButton, $declineButton]} onPress={declineCall}>
          <Text style={$buttonIcon}>📞</Text>
        </Pressable>

        <Pressable style={[$callButton, $acceptButton]} onPress={acceptCall}>
          <Text style={$buttonIcon}>📹</Text>
        </Pressable>
      </View>
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: '#000000',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 100,
}

const $callerInfo: ViewStyle = {
  alignItems: 'center',
}

const $callerAvatar: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  marginBottom: 24,
}

const $callerName: TextStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#FFFFFF',
  marginBottom: 8,
}

const $callLabel: TextStyle = {
  fontSize: 18,
  color: '#CCCCCC',
}

const $controls: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-around',
  width: '60%',
}

const $callButton: ViewStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  justifyContent: 'center',
  alignItems: 'center',
}

const $acceptButton: ViewStyle = {
  backgroundColor: '#34C759',
}

const $declineButton: ViewStyle = {
  backgroundColor: '#FF3B30',
}

const $buttonIcon: TextStyle = {
  fontSize: 32,
}